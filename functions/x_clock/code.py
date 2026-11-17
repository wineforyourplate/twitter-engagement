#input_type_name: XClockInput
#output_type_name: XClockResult
#function_name: x_clock

"""Every 15 minutes (the shortest timed schedule Lemma allows), as the person: what's due now, or nothing.

A cheap check. It wakes Kite only when there is work, and claims that work before
saying yes, so no job ever starts twice. In order:

0. Housekeeping, every time: replies whose post got too old expire; a reply stuck in
   "posting" for 30 minutes fails (check X before retrying); anything auto-post
   queued that it isn't allowed to (a search find, a DM, auto-post now off, week 1
   without their say-so) goes back to waiting. That last rule is the code behind
   "posts found by search always wait": X's rules forbid automated replies to posts
   found by keyword search.
1. summary: at their summary time, once a day. Needs no browser, so it runs even
   while X is stopped.
2. post: approved replies are waiting and the allowance would let one go within the
   next 10 minutes. Claims up to 3 (answers first, then the soonest to expire); Kite
   posts them one at a time, 3-4 minutes apart.
3. people: every 2 hours, read who answered them and act per the playbook.
   lists: every 3 hours while a List still has to be made on X or members added
   (about 20 a day), and once a week per list, to suggest who to add or drop.
4. check: every 3 hours, read the views on today's replies (the reach check).
5. search: 3 slots a day (an hour after their start, mid-day, 3 hours before their
   end). The lab found searching more often turned up no more asks.
6. list: every 30-45 minutes, read one of their X Lists (one page load shows every
   member's new posts), picked by weight: the list furthest behind its share of the
   cap goes next. About 7 in 10 replies come from lists.

With finish=true it clears the running mark (the workflow's last step).
"""

import hashlib
import random
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from lemma_sdk import FunctionContext
from pydantic import BaseModel


LIMITS = {"daily_cap": 30, "gap_min": 180, "gap_max": 240, "hour_cap": 5, "break_start": "13:00", "break_minutes": 120, "day_start": "08:00", "day_end": "23:00"}


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


class XClockInput(BaseModel):
    finish: bool = False
    task: str | None = None


class XClockResult(BaseModel):
    action: str  # summary | post | people | lists | check | search | list | skip
    reason: str
    run: str | None = None
    ids: list[str] = []
    slot: str | None = None
    list_id: str | None = None
    list_name: str | None = None
    mode: str | None = None


RUN_STALE = timedelta(minutes=40)
POST_STALE = timedelta(minutes=30)
AUTO_LANES = ("list", "answer")


def _local_hm(now: datetime, tz: ZoneInfo) -> str:
    return now.astimezone(tz).strftime("%H:%M")


async def x_clock(ctx: FunctionContext, data: XClockInput) -> XClockResult:
    pod = ctx.pod
    now = datetime.now(timezone.utc)
    p = (_items(pod, "profile", 1) or [{}])[0]
    if not p.get("id"):
        return XClockResult(action="skip", reason="no profile yet")
    profiles = pod.table("profile")
    clock = dict(p.get("clock") or {})

    if data.finish:
        if clock.get("running"):
            clock["running"] = None
            profiles.update(p["id"], {"clock": clock})
        return XClockResult(action="skip", reason=f"finished {data.task or ''}".strip())

    if p.get("onboarding_step") != "done":
        return XClockResult(action="skip", reason="still onboarding")

    tz = _tz(p)
    limits = {**LIMITS, **(p.get("limits") or {})}
    week, cap = week_and_cap(p, limits, now)
    auto_ok = bool(p.get("auto_post")) and (week > 1 or bool(p.get("week1_auto")))
    replies = pod.table("replies")

    lists = {x["id"]: x for x in _items(pod, "lists", 50)}

    # 0. housekeeping
    open_rows = _items(pod, "replies", 300, [{"field": "status", "op": "eq", "value": "waiting"}]) + _items(
        pod, "replies", 300, [{"field": "status", "op": "eq", "value": "approved"}]
    )
    for r in open_rows:
        fresh = _parse(r.get("fresh_until"))
        if fresh and fresh < now and r.get("kind") != "dm":
            replies.update(r["id"], {"status": "expired"})
            r["status"] = "expired"
        elif r.get("status") == "approved" and r.get("approved_by") == "auto" and (
            not auto_ok
            or r.get("lane") not in AUTO_LANES
            or r.get("kind") == "dm"
            or (r.get("lane") == "list" and (lists.get(r.get("list_id") or "") or {}).get("mode") != "auto")
        ):
            replies.update(r["id"], {"status": "waiting", "approved_by": None, "approved_at": None})
            r["status"] = "waiting"
        if r.get("status") in ("waiting", "approved") and r.get("lane") == "list" and r.get("mention") not in (None, "none"):
            lst = lists.get(r.get("list_id") or "") or {}
            if lst and not lst.get("may_mention"):
                replies.update(r["id"], {"status": "waiting", "approved_by": None, "approved_at": None, "mention": "none",
                                         "error": f"The {lst.get('name')} list never mentions your business. Take the mention out before approving."})
                r["status"] = "waiting"
    for r in _items(pod, "replies", 50, [{"field": "status", "op": "eq", "value": "posting"}]):
        claimed = _parse(r.get("updated_at")) or now
        if now - claimed > POST_STALE and not r.get("posted_at"):
            replies.update(r["id"], {"status": "failed", "error": "Kite may not have finished posting this one. Check it on X before trying again."})

    running = clock.get("running") or {}
    since = _parse(running.get("since"))
    busy = bool(running and since and now - since < RUN_STALE)
    local = now.astimezone(tz)
    today = local.strftime("%Y-%m-%d")
    run = f"{local:%Y-%m-%d %H:%M}"

    def go(action: str, reason: str, stamp: dict[str, Any] | None = None, **extra: Any) -> XClockResult:
        clock.update(stamp or {})
        clock["running"] = {"task": action, "since": now.isoformat(), "run": f"{action} {run}"}
        profiles.update(p["id"], {"clock": clock})
        return XClockResult(action=action, reason=reason, run=f"{action} {run}", **extra)

    if busy:
        return XClockResult(action="skip", reason=f"{running.get('task')} is still running")

    # 1. the daily summary
    if _local_hm(now, tz) >= str(p.get("summary_time") or "09:00") and clock.get("last_summary_on") != today:
        return go("summary", "summary time", {"last_summary_on": today})

    if p.get("state") == "stopped":
        return XClockResult(action="skip", reason="X is stopped until they resume")
    lock = p.get("browser_lock") or {}
    lock_until = _parse(lock.get("until"))
    if lock.get("owner") and lock_until and lock_until > now:
        return XClockResult(action="skip", reason=f"the browser is in use by {lock['owner']}")

    day = local.replace(hour=0, minute=0, second=0, microsecond=0)
    start, end = _at(day, limits["day_start"], tz), _at(day, limits["day_end"], tz)
    if not (start <= now < end):
        return XClockResult(action="skip", reason="outside their hours")

    # 2. post the approved queue
    if p.get("state") == "running":
        queue = [r for r in open_rows if r.get("status") == "approved" and (r.get("approved_by") == "you" or auto_ok)]
        if queue:
            ok, wait, why, cap_, used, _ = reply_budget(p, posted_times(pod), now)
            dms = [r for r in queue if r.get("kind") == "dm"]
            pubs = [r for r in queue if r.get("kind") != "dm"]
            pubs.sort(key=lambda r: (0 if r.get("kind") == "answer" else 1, str(r.get("fresh_until") or "9999")))
            # a list may use only its share of today's cap
            day0 = local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
            used_by: dict[str, int] = {}
            for r in _items(pod, "replies", 300, [{"field": "status", "op": "eq", "value": "posted"}], newest="posted_at"):
                if r.get("list_id") and (t := _parse(r.get("posted_at"))) and t >= day0:
                    used_by[r["list_id"]] = used_by.get(r["list_id"], 0) + 1
            fit = []
            for r in pubs:
                lid = r.get("list_id")
                if r.get("lane") == "list" and lid:
                    lst = lists.get(lid) or {}
                    share = -(-cap_ * max(0, min(100, int(lst.get("cap_share") or 0))) // 100)
                    if lst.get("mode") in ("like", "ideas") or used_by.get(lid, 0) >= share:
                        continue
                    used_by[lid] = used_by.get(lid, 0) + 1
                fit.append(r)
            pubs = fit
            room = max(0, cap_ - used)
            pick = (pubs[: min(3, room)] if (ok or wait < 600) else []) + dms[:2]
            if pick:
                ids = [r["id"] for r in pick]
                for r in pick:
                    replies.update(r["id"], {"status": "posting", "claimed_by": f"post {run}"})
                return go("post", f"{len(ids)} approved", ids=ids)

    # 3. people who answered them
    last_people = _parse(clock.get("last_people_at"))
    if not last_people or now - last_people >= timedelta(hours=2) - timedelta(minutes=5):
        return go("people", "every 2 hours", {"last_people_at": now.isoformat()})

    # 3b. lists to make on X, members to add, or the weekly review
    pending = [x for x in lists.values() if x.get("active", True) and x.get("x_status") == "to_create"]
    to_add = _items(pod, "list_members", 50, [{"field": "on_x", "op": "eq", "value": False}])
    to_add = [m for m in to_add if m.get("status") == "member"]
    stale = [x for x in lists.values() if x.get("active", True) and x.get("x_status") == "ready" and (
        not _parse(x.get("last_review_at")) or now - _parse(x.get("last_review_at")) > timedelta(days=7))]
    last_lists = _parse(clock.get("last_lists_at"))
    if (pending or to_add or stale) and (not last_lists or now - last_lists >= timedelta(hours=3)):
        why = f"{len(pending)} to make, {len(to_add)} to add, {len(stale)} to review"
        return go("lists", why, {"last_lists_at": now.isoformat()})

    # 4. the reach check
    last_check = _parse(clock.get("last_check_at"))
    recent = [t for t in posted_times(pod) if timedelta(hours=1) < now - t < timedelta(hours=26)]
    if recent and (not last_check or now - last_check >= timedelta(hours=3)):
        return go("check", f"{len(recent)} replies to read back", {"last_check_at": now.isoformat()})

    # 5. a search slot
    span = (end - start).total_seconds() / 3600
    slots = [start + timedelta(hours=1), start + timedelta(hours=span * 0.45), end - timedelta(hours=3)]
    due = [i for i, s in enumerate(slots) if s <= now]
    if due:
        key = f"{today}#{due[-1]}"
        last_day, _, last_i = str(clock.get("last_search_slot") or "").partition("#")
        done_i = int(last_i) if last_day == today and last_i.isdigit() else -1
        if due[-1] > done_i:
            return go("search", f"search slot {due[-1] + 1} of 3", {"last_search_slot": key}, slot=key)

    # 6. one list feed, rotating by weight (its share of the cap)
    last_list = _parse(clock.get("last_list_at"))
    gap = timedelta(minutes=int(clock.get("next_list_gap") or 30))
    ready = [x for x in lists.values() if x.get("active", True) and x.get("x_status") == "ready" and x.get("x_list_id")]
    if ready and (not last_list or now - last_list >= gap):
        reads = clock.get("list_reads") or {}
        if reads.get("day") != today:
            reads = {"day": today, "n": {}}
        n = reads.setdefault("n", {})
        pick = min(ready, key=lambda x: (n.get(x["id"], 0) / max(5, int(x.get("cap_share") or 0)), -int(x.get("cap_share") or 0), str(x.get("last_read_at") or "")))
        n[pick["id"]] = n.get(pick["id"], 0) + 1
        return go(
            "list",
            f"the {pick.get('name')} list ({pick.get('mode')})",
            {"last_list_at": now.isoformat(), "next_list_gap": random.choice([30, 45]), "list_reads": reads},
            list_id=pick["id"],
            list_name=pick.get("name"),
            mode=pick.get("mode"),
        )

    return XClockResult(action="skip", reason="nothing due")
