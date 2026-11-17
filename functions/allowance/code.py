#input_type_name: AllowanceInput
#output_type_name: AllowanceResult
#function_name: allowance

"""May Kite act on X right now, and if not, when?

Kite asks before every reply, answer, like, follow and DM. The answer comes from
code, not from the agent's judgment. Every number here comes from the engagement
lab (2-17 Nov 2026, one founder account, 560 X replies):

- About 38 replies a day reached people (about 38 views each). At 76-100 a day in
  bursts of 4-5 in 15 minutes, views fell to about 13 and X hid the account's
  replies (1-5 views each). So: 30 a day by default, 38 at the most.
- Bursts drew 1-24 views while spaced replies the same day drew 10-30. So: 3-4
  minutes between replies, a different gap each time, at most 5 in any hour.
- Paced across the day: by any hour, at most 1.5 x hours since the day's start + 2.
- A 2-hour break every day; nothing outside working hours.
- New accounts ramp: week 1 at most 10, week 2 at most 18.
- Likes only go to replies to the person (30 a day). Follows and DMs only with a tap
  (5 each a day): automated follows and DMs are what X catches fastest.

`wait_seconds` says how long until the answer could change; Kite waits that long and
asks again. Held back means "later" or "tomorrow", never "failed".
"""

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from lemma_sdk import FunctionContext
from pydantic import BaseModel

LIMITS = {"daily_cap": 30, "gap_min": 180, "gap_max": 240, "hour_cap": 5, "break_start": "13:00", "break_minutes": 120, "day_start": "08:00", "day_end": "23:00"}
OTHER = {  # action -> (daily cap, seconds between two)
    "like": (30, 25),  # replies to them, and fresh posts on a like-only list
    "list_add": (20, 20),  # adding members to an X List: about 20 a day, never 100 at once
    "list_create": (2, 60),
    "follow": (5, 120),
    "dm": (5, 180),
}


class AllowanceInput(BaseModel):
    action: str  # reply | answer | like | follow | dm | list_add | list_create
    owner: str  # the browser-lock owner of this run
    count: int = 1
    list_id: str | None = None  # a reply from a list: that list's share of the cap applies too


class AllowanceResult(BaseModel):
    allowed: int
    wait_seconds: int = 0
    reason: str
    cap: int = 0
    used: int = 0
    week: int = 3


def _parse(value: Any) -> datetime | None:
    if not value:
        return None
    dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _items(pod, table: str, limit: int = 300, filt: list | None = None, newest: str | None = None) -> list[dict]:
    kw: dict[str, Any] = {"limit": limit}
    if filt:
        kw["filter"] = filt
    if newest:
        kw["sort"] = [{"field": newest, "direction": "desc"}]
    return pod.records.list(table, **kw).to_dict().get("items") or []


def _tz(p: dict) -> ZoneInfo:
    try:
        return ZoneInfo(p.get("timezone") or "UTC")
    except Exception:
        return ZoneInfo("UTC")


def _at(local_day: datetime, hhmm: str, tz: ZoneInfo) -> datetime:
    h, m = (str(hhmm or "00:00").split(":") + ["0"])[:2]
    return local_day.replace(hour=int(h) % 24, minute=int(m) % 60, second=0, microsecond=0).astimezone(timezone.utc)


def week_and_cap(p: dict, limits: dict, now: datetime) -> tuple[int, int]:
    started = _parse(p.get("started_at")) or now
    days = (now - started).days
    cap = max(1, min(38, int(limits.get("daily_cap") or 30)))
    week = 1 if days < 7 else 2 if days < 14 else 3
    if week == 1:
        cap = min(cap, 10)
    elif week == 2:
        cap = min(cap, 18)
    joined = _parse(p.get("x_joined_at"))
    if joined and (now - joined).days < 30:  # a young X account stays gentle for its first month
        cap = min(cap, 10 if (now - joined).days < 7 else 18)
    return week, cap


def gap_after(last: datetime, limits: dict) -> int:
    """A different 3-4 minute gap after each reply, picked from the reply's own time."""
    lo, hi = int(limits.get("gap_min") or 180), int(limits.get("gap_max") or 240)
    seed = int(hashlib.sha1(last.isoformat().encode()).hexdigest()[:8], 16)
    return lo + seed % max(1, hi - lo + 1)


def reply_budget(p: dict, posted: list[datetime], now: datetime) -> tuple[int, int, str, int, int, int]:
    """(allowed now 0/1, wait seconds, reason, cap, used today, week). `posted` = this person's reply times."""
    limits = {**LIMITS, **(p.get("limits") or {})}
    tz = _tz(p)
    local = now.astimezone(tz)
    day = local.replace(hour=0, minute=0, second=0, microsecond=0)
    start, end = _at(day, limits["day_start"], tz), _at(day, limits["day_end"], tz)
    b0 = _at(day, limits["break_start"], tz)
    b1 = b0 + timedelta(minutes=int(limits.get("break_minutes") or 120))
    week, cap = week_and_cap(p, limits, now)
    today = sorted(t for t in posted if t >= day.astimezone(timezone.utc))
    used = len(today)
    if now < start:
        return 0, int((start - now).total_seconds()), f"before your day starts ({limits['day_start']})", cap, used, week
    if now >= end:
        return 0, int((start + timedelta(days=1) - now).total_seconds()), f"after your day ends ({limits['day_end']}); tomorrow", cap, used, week
    if b0 <= now < b1:
        return 0, int((b1 - now).total_seconds()), "the daily break", cap, used, week
    if used >= cap:
        return 0, int((start + timedelta(days=1) - now).total_seconds()), f"today's cap of {cap} is used; tomorrow", cap, used, week
    hours = (now - start).total_seconds() / 3600
    pace = int(1.5 * hours + 2)
    if used >= pace:
        need = (used + 1 - 2) / 1.5  # hours after the start when the pace allows one more
        wait = max(60, int((start + timedelta(hours=need) - now).total_seconds()))
        return 0, wait, f"pacing the day: {used} by now is the most the pace allows", cap, used, week
    last_hour = [t for t in posted if now - t < timedelta(hours=1)]
    hour_cap = int(limits.get("hour_cap") or 5)
    if len(last_hour) >= hour_cap:
        wait = int((min(last_hour) + timedelta(hours=1) - now).total_seconds()) + 5
        return 0, max(30, wait), f"{hour_cap} in the last hour already", cap, used, week
    if posted:
        last = max(posted)
        gap = gap_after(last, limits)
        if len(posted) > 1:
            prev = sorted(posted)[-2]
            if gap == gap_after(prev, limits):  # never the same gap twice in a row
                gap = gap + 11 if gap + 11 <= int(limits["gap_max"]) else gap - 11
        ready = last + timedelta(seconds=gap)
        if now < ready:
            return 0, int((ready - now).total_seconds()) + 1, f"spacing: next reply {gap // 60}m{gap % 60:02d}s after the last", cap, used, week
    return 1, 0, "ok", cap, used, week


def posted_times(pod) -> list[datetime]:
    rows = _items(pod, "replies", 300, [{"field": "status", "op": "eq", "value": "posted"}], newest="posted_at")
    out = []
    for r in rows:
        if r.get("kind") in ("reply", "answer"):
            t = _parse(r.get("posted_at"))
            if t:
                out.append(t)
    return out


def list_share_ok(pod, p: dict, list_id: str, cap: int, now: datetime) -> tuple[bool, str]:
    """A list may use its cap_share percent of today's cap (rounded up), and nothing in a list
    whose mode isn't auto or drafts goes out as a reply."""
    lst = next((x for x in _items(pod, "lists", 50) if x.get("id") == list_id), None)
    if not lst:
        return False, "that list doesn't exist any more"
    if not lst.get("active", True):
        return False, f"the {lst.get('name')} list is switched off"
    if lst.get("mode") in ("like", "ideas"):
        return False, f"the {lst.get('name')} list is {lst.get('mode')}-only: no replies there"
    share = max(0, min(100, int(lst.get("cap_share") or 0)))
    allowed = -(-cap * share // 100)  # ceil
    tz = _tz(p)
    day = now.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    rows = _items(pod, "replies", 200, [{"field": "list_id", "op": "eq", "value": list_id}], newest="posted_at")
    used = sum(1 for r in rows if r.get("status") == "posted" and (t := _parse(r.get("posted_at"))) and t >= day)
    if used >= allowed:
        return False, f"the {lst.get('name')} list has used its share today ({used} of {allowed})"
    return True, "ok"


async def allowance(ctx: FunctionContext, data: AllowanceInput) -> AllowanceResult:
    pod = ctx.pod
    now = datetime.now(timezone.utc)
    p = (_items(pod, "profile", 1) or [{}])[0]
    if not p.get("id") or p.get("onboarding_step") != "done":
        return AllowanceResult(allowed=0, reason="still onboarding")
    if p.get("state") == "stopped":
        return AllowanceResult(allowed=0, reason=f"stopped: {(p.get('stop_reason') or 'X showed a problem').rstrip('.')}. Only they can resume.")
    if p.get("state") == "paused":
        return AllowanceResult(allowed=0, reason="paused by them. Nothing goes out on X until they resume.")
    lock = p.get("browser_lock") or {}
    until = _parse(lock.get("until"))
    if lock.get("owner") != data.owner or not until or until <= now:
        return AllowanceResult(allowed=0, reason="take the browser first (browser_lock), with this same owner")

    action = data.action
    if action in ("reply", "answer"):
        ok, wait, reason, cap, used, week = reply_budget(p, posted_times(pod), now)
        if ok and data.list_id:
            share_ok, why = list_share_ok(pod, p, data.list_id, cap, now)
            if not share_ok:
                return AllowanceResult(allowed=0, wait_seconds=0, reason=why, cap=cap, used=used, week=week)
        return AllowanceResult(allowed=min(ok, max(0, data.count)), wait_seconds=wait, reason=reason, cap=cap, used=used, week=week)

    if action not in OTHER:
        return AllowanceResult(allowed=0, reason=f"unknown action {action!r}: reply, answer, like, follow or dm")
    cap, spacing = OTHER[action]
    tz = _tz(p)
    day = now.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    done = [
        t
        for a in _items(pod, "activity", 200, [{"field": "action", "op": "eq", "value": action}], newest="at")
        if a.get("result") == "ok" and (t := _parse(a.get("at"))) and t >= day
    ]
    used = len(done)
    if used >= cap:
        return AllowanceResult(allowed=0, reason=f"{cap} {action}s today already; tomorrow", cap=cap, used=used)
    if done:
        ready = max(done) + timedelta(seconds=spacing)
        if now < ready:
            return AllowanceResult(allowed=0, wait_seconds=int((ready - now).total_seconds()) + 1, reason=f"spacing between {action}s", cap=cap, used=used)
    return AllowanceResult(allowed=min(max(0, data.count), cap - used, 1), reason="ok", cap=cap, used=used)
