#input_type_name: SetupMeInput
#output_type_name: SetupMeResult
#function_name: setup_me

"""Make sure the calling person has a profile row and starter searches.

Runs as the caller, and every table here is private to its owner, so this only ever
touches the caller's own rows. Safe to call on every app load: it creates what is
missing and changes nothing that exists.

The lab's lessons are not copied into anyone's rows: they live in Kite's own notes
(agents/kite/instruction.md, "Learnings", and the learnings note). A person's
`lessons` rows hold only what their own edits and words taught Kite.
"""

from typing import Any

from lemma_sdk import FunctionContext
from pydantic import BaseModel

LIMITS = {
    "daily_cap": 30,  # the lab: ~38 a day reached people; 76-100 in bursts got replies hidden
    "gap_min": 180,  # 3-4 minutes between replies, never a burst
    "gap_max": 240,
    "hour_cap": 5,
    "break_start": "13:00",  # a 2-hour break every day
    "break_minutes": 120,
    "day_start": "08:00",
    "day_end": "23:00",
}

# Generic starters. The onboarding replaces the words with the person's own field.
SEARCHES = [
    {
        "kind": "ask",
        "label": "Looking for someone to build it",
        "query": '("looking for someone" OR "can anyone recommend" OR "need someone to" OR "looking for an agency") ({topic})',
        "max_age_hours": 48,
    },
    {
        "kind": "ask",
        "label": "Is there a tool for this",
        "query": '("is there a tool" OR "what do you use for" OR "how do you handle" OR "how do I automate") ({topic})',
        "max_age_hours": 24,
    },
    {
        "kind": "topic",
        "label": "Your topic, climbing",
        "query": "({topic}) min_faves:30",
        "max_age_hours": 2,
    },
]

class SetupMeInput(BaseModel):
    timezone: str | None = None
    name: str | None = None
    topic: str | None = None  # words for the starter searches, e.g. "client reporting OR agency ops"


class SetupMeResult(BaseModel):
    profile: dict[str, Any]
    created: bool
    searches: int


def _items(pod, table: str, limit: int = 200) -> list[dict]:
    return pod.records.list(table, limit=limit).to_dict().get("items") or []


async def setup_me(ctx: FunctionContext, data: SetupMeInput) -> SetupMeResult:
    pod = ctx.pod
    rows = _items(pod, "profile", 1)
    created = not rows
    if created:
        row: dict[str, Any] = {
            "onboarding_step": "hello",
            "limits": LIMITS,
            "business": {"topics": []},
            "voice": [],
            "clock": {},
            "auto_post": False,
            "state": "running",
        }
        if data.timezone:
            row["timezone"] = data.timezone
        if data.name:
            row["name"] = data.name.strip()[:120]
        profile = pod.table("profile").create(row)
    else:
        profile = rows[0]
        fix: dict[str, Any] = {}
        if not profile.get("limits"):
            fix["limits"] = LIMITS
        else:
            merged = {**LIMITS, **(profile.get("limits") or {})}
            if merged != profile.get("limits"):
                fix["limits"] = merged
        if fix:
            profile = pod.table("profile").update(profile["id"], fix)

    if not _items(pod, "searches", 1):
        topic = (data.topic or "").strip() or '"AI agents" OR automation'
        for s in SEARCHES:
            pod.table("searches").create({**s, "query": s["query"].replace("{topic}", topic), "active": True})

    return SetupMeResult(
        profile=profile,
        created=created,
        searches=len(_items(pod, "searches", 50)),
    )
