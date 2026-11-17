#input_type_name: ReachInput
#output_type_name: ReachResult
#function_name: reach

"""The reach check's verdict, and the one place a stop is written.

In the lab, X hid the account's replies for days (1-5 views each, on posts with
hundreds to thousands of views) before anyone noticed. So every 3 hours Kite reads
the views on the person's replies and asks this function what they mean:

- 10 or more replies have gone out since they last resumed (or started), and every
  one over an hour old that has a reading sits at 5 views or fewer: X is most likely
  hiding them. Stop, and say what to do: post one reply by hand, check it from a
  logged-out browser, then press Resume.
- Otherwise carry on, and report the median.

Kite also calls it with `problem` when X itself showed trouble: a warning, "unusual
activity", a rate limit, a locked account, a captcha, or a reply that doesn't show
after posting. Those stop at once.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from lemma_sdk import FunctionContext
from pydantic import BaseModel

MIN_REPLIES = 10
LOW = 5


class ReachInput(BaseModel):
    problem: str | None = None  # what X showed, in the person's words, when Kite saw trouble


class ReachResult(BaseModel):
    stop: bool
    reason: str
    read: int = 0
    median: int | None = None
    message: str | None = None  # one line for message_user when stop is true


def _parse(value: Any) -> datetime | None:
    if not value:
        return None
    dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _stop(pod, p: dict, reason: str, now: datetime) -> None:
    pod.table("profile").update(p["id"], {"state": "stopped", "stop_reason": reason, "stopped_at": now.isoformat(), "browser_lock": None})


async def reach(ctx: FunctionContext, data: ReachInput) -> ReachResult:
    pod = ctx.pod
    now = datetime.now(timezone.utc)
    p = (pod.records.list("profile", limit=1).to_dict().get("items") or [{}])[0]
    if not p.get("id"):
        return ReachResult(stop=False, reason="no profile yet")

    if data.problem:
        reason = f"X showed a problem: {data.problem.strip()[:300]}. Kite stopped everything on X. Open X yourself, deal with it, then press Resume."
        _stop(pod, p, reason, now)
        return ReachResult(stop=True, reason=reason, message=f"I've stopped X: {data.problem.strip()[:120]}. Open the app when you can.")

    since = max(t for t in [_parse(p.get("resumed_at")), _parse(p.get("started_at")), now - timedelta(days=7)] if t)
    rows = pod.records.list(
        "replies", limit=200, filter=[{"field": "status", "op": "eq", "value": "posted"}], sort=[{"field": "posted_at", "direction": "desc"}]
    ).to_dict().get("items") or []
    sent = [r for r in rows if r.get("kind") in ("reply", "answer") and (t := _parse(r.get("posted_at"))) and t >= since]
    read = [int(r["readout"]["views"]) for r in sent if now - (_parse(r.get("posted_at")) or now) > timedelta(hours=1) and (r.get("readout") or {}).get("views") is not None]
    median = sorted(read)[len(read) // 2] if read else None
    if len(sent) >= MIN_REPLIES and len(read) >= MIN_REPLIES and all(v <= LOW for v in read):
        reason = (
            f"Your last {len(read)} replies have {LOW} views or fewer each (median {median}), which usually means X is hiding them. "
            "Post one reply by hand, check it from a logged-out browser, then press Resume. Kite restarts slowly."
        )
        _stop(pod, p, reason, now)
        return ReachResult(stop=True, reason=reason, read=len(read), median=median, message=f"I've stopped X: your last {len(read)} replies sit at {LOW} views or fewer. Open the app for the fix.")
    return ReachResult(stop=False, reason=f"{len(read)} read since {since:%d %b %H:%M} UTC, median {median}", read=len(read), median=median)
