#!/usr/bin/env python3
"""Seed invented example rows for the person running it, so the app shows a working day.

Every person, handle and post here is made up, and every URL points at x.com/example, so
nothing can reach a real account. The ids it creates are saved to seed/.seeded.json and
the profile it changes is backed up there, so `seed/clean.py` puts everything back.

It pauses your own clock (`clock-u…`) while the example rows are there, so Kite never
works on them; `seed/clean.py` switches it back on.

    python3 seed/seed.py --server <server> --org <org-id> --pod <pod-id>
"""
import json, os, subprocess, sys, tempfile
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, ".seeded.json")
ARGS = sys.argv[1:]
now = datetime.now(timezone.utc)
ago = lambda m: (now - timedelta(minutes=m)).isoformat()
ahead = lambda m: (now + timedelta(minutes=m)).isoformat()
EX = "https://x.com/example/status/"


def lemma(*a, data=None):
    cmd = ["lemma", *ARGS, *a] + (["--data", json.dumps(data)] if data is not None else []) + ["--json"]
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode:
        sys.exit(f"lemma {' '.join(a)} failed: {out.stderr or out.stdout}")
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return {}


def items(table):
    r = lemma("records", "list", table, "--limit", "200")
    rows = r.get("items", r if isinstance(r, list) else [])
    return [{**(x.get("data") or {}), "id": x.get("id")} if isinstance(x.get("data"), dict) else x for x in rows]


if os.path.exists(STATE):
    sys.exit("Already seeded. Run seed/clean.py first.")

lemma("functions", "run", "setup_me", data={})
profile = items("profile")[0]
me = profile.get("user_id")
scheds = lemma("schedules", "list", "--limit", "200")
scheds = scheds.get("items", scheds if isinstance(scheds, list) else [])
paused = [x["id"] for x in scheds if str(x.get("name") or "").startswith("clock-u") and x.get("is_active") and x.get("user_id") == me]
for sid in paused:
    lemma("schedules", "update", sid, data={"is_active": False})
backup = {k: profile.get(k) for k in ["onboarding_step", "name", "x_handle", "x_followers", "business", "auto_post", "week1_auto", "state", "started_at", "browser_status", "browser_checked_at", "voice", "clock", "last_note", "stop_reason", "stopped_at"]}
today = now.astimezone().strftime("%Y-%m-%d")
lemma("records", "update", "profile", profile["id"], data={
    "onboarding_step": "done", "name": "Maya", "x_handle": "example_maya", "x_followers": 1840,
    "business": {"what": "I run a 4-person studio that builds AI automations for marketing agencies", "who": "Agency owners and ops leads",
                 "offer": "A free 20-minute teardown of one workflow", "link": "example.com/?utm_source=x", "tag": "@example_studio",
                 "topics": ["agency operations", "client reporting", "AI agents at work"]},
    "auto_post": True, "state": "running", "started_at": ago(60 * 24 * 20), "browser_status": "unknown",
    "voice": ["lowercase, plain words", "open with your own point, never by grading theirs", "one concrete detail from client work per reply"],
    "clock": {"last_summary_on": today, "last_people_at": ago(10), "last_check_at": ago(10), "last_list_at": ago(5), "last_search_slot": f"{today}#2"},
    "last_note": "Example data: read your list, 14 new posts, 2 drafted",
})

made = {"lists": [], "list_members": [], "replies": [], "people": [], "activity": [], "summaries": []}
def add(table, row):
    r = lemma("records", "create", table, data=row)
    rid = r.get("id") or (r.get("data") or {}).get("id")
    made[table].append(rid)
    return rid

# Lists are marked ready with a made-up X id, so Kite never tries to make them on X.
L1 = add("lists", {"name": "Agency ops", "topic": "agency owners and ops leads", "mode": "auto", "cap_share": 55, "may_mention": True, "active": True, "x_status": "ready", "x_list_id": "0", "members_on_x": 3, "voice": "talk like an operator"})
L2 = add("lists", {"name": "Cricket", "topic": "match chat", "mode": "like", "cap_share": 5, "may_mention": False, "active": True, "x_status": "ready", "x_list_id": "0", "members_on_x": 1, "voice": "a fan, never work talk"})
for h, n, lid in [("example_tomas", "Tomás Ferreira", L1), ("example_devika", "Devika Nair", L1), ("example_ines", "Inês Carvalho", L1), ("example_covers", "Cover Drive Daily", L2)]:
    add("list_members", {"handle": h, "name": n, "list_id": lid, "status": "member", "on_x": True, "signals": {"our_replies": 2}})
add("list_members", {"handle": "example_clara", "name": "Clara Weiss", "list_id": L1, "status": "suggested", "on_x": True, "why": "Example: posted on client reporting 4 times this week, 8.7K"})
add("list_members", {"handle": "example_ben", "name": "Ben Adeyemi", "list_id": L1, "status": "drop_suggested", "on_x": True, "why": "Example: silent for 3 weeks"})

P = lambda **k: {"kind": "reply", "mention": "none", "post_url": EX + str(abs(hash(k.get("author_handle", "")))) , **k}
add("replies", P(lane="ask", status="waiting", author_handle="example_devika", author_name="Devika Nair", author_followers=6200,
    post_text="genuine question for agency people - how are you doing weekly client reports without someone losing every friday to it?",
    post_at=ago(47), post_stats={"likes": 18, "replies": 9, "views": 2400}, why="A real ask: she needs this now, and weekly reports are what you build",
    draft="the screenshotting is the tell - the dashboard isn't the report, the story is. an agent pulls the numbers friday 7am, writes the 3 lines a client reads, and the AM oks it in slack",
    point="the story, not the dashboard", shape="answer", fresh_until=ahead(60 * 23)))
add("replies", P(lane="list", list_id=L1, status="approved", approved_by="auto", approved_at=ago(3), author_handle="example_tomas", author_name="Tomás Ferreira", author_followers=14300,
    post_text="most agencies don't have an automation problem, they have a nobody-owns-it problem", post_at=ago(38),
    why="On your list, 38 min old", draft="had a client where the invoice automation died silently for 6 weeks. now a daily 'what ran, what didn't' lands in their slack - the channel owns it",
    point="a daily what-ran note makes ownership", shape="story", fresh_until=ahead(82)))
add("replies", P(lane="topic", status="approved", approved_by="auto", approved_at=ago(2), author_handle="example_lee", author_name="Lee Park", author_followers=22100,
    post_text="workflow builders are great until you have 40 workflows and no idea which ones matter", post_at=ago(50),
    why="Search find: auto-post must not send this one", draft="tag each workflow with the client it bills to - untaggable ones get switched off for a week",
    point="bill-to tags find dead workflows", shape="detail", fresh_until=ahead(130)))
add("replies", P(lane="list", list_id=L1, status="waiting", author_handle="example_sam", author_name="Sam Okafor", author_followers=41000,
    post_text="every agency will have an AI ops person by 2027", post_at=ago(60 * 5), why="On your list", draft="ours is called the friday person",
    point="name it after the job", shape="detail", fresh_until=ago(60 * 3)))
add("replies", {"kind": "dm", "lane": "warm", "status": "waiting", "mention": "offer", "post_url": EX + "dm1", "author_handle": "example_nikhil", "author_name": "Nikhil Batra",
    "author_followers": 2300, "post_text": "looks interesting tbh, shoot me a DM", "post_at": ago(95), "why": "He asked for a DM under your reply. Hot: send it today",
    "draft": "hey nikhil - saw you run paid social for 12 people. the one thing i'd start with for you is the weekly client report - we build it with you in a 20 min call. happy to set it up with you if you want"})
views = [41, 63, 18, 120, 35, 22, 57, 44, 29]
for i, v in enumerate(views):
    add("replies", P(lane="list", list_id=L1, status="posted", approved_by="you" if i % 3 == 0 else "auto", author_handle=f"example_{i}", author_name=f"Example Author {i + 1}",
        author_followers=3000 + 900 * i, post_text="an example post from this morning", post_at=ago(90 + 20 * i), why="On your list, early",
        draft="an example reply from this morning", posted_at=ago(70 + 20 * i), reply_url=EX + f"r{i}",
        readout={"views": v, "likes": v // 20, "replies": 1 if i % 4 == 0 else 0, "author_replied": i == 3, "checked_at": ago(10)}))

add("people", {"handle": "example_nikhil", "name": "Nikhil Batra", "followers": 2300, "tier": "hot", "said": "looks interesting tbh, shoot me a DM", "said_at": ago(95),
    "next_step": "Send the DM (drafted). He asked for it.", "status": "open", "follow": "suggested", "note": "example"})
add("people", {"handle": "example_rafael", "name": "Rafael Mendes", "followers": 890, "tier": "question", "said": "how do you stop the agent sending a report with a broken number?",
    "said_at": ago(70), "next_step": "Answer it in the thread, then a DM for your tap.", "status": "open", "note": "example"})

add("activity", {"at": ago(5), "action": "read", "detail": "Example: read your list, 14 new posts, 2 drafted", "result": "ok", "page_loads": 1, "run": "example"})
add("activity", {"at": ago(48), "action": "skip", "detail": "Example: skipped a post asking AI accounts to reply with a code (bot-bait)", "result": "ok", "run": "example"})
add("summaries", {"day": today, "headline": "Example: 9 replies, 1 hot lead, reach is healthy", "numbers": {"replies": 9, "views": 429, "author_replies": 1, "answered": 2, "people": 2},
    "body": "## Status\n- **9 replies** so far (cap 30), median **41 views**.\n## People\n- **Nikhil Batra** asked for a DM. It's drafted, first in your queue.\n## Decisions for you\n1. Add **Clara Weiss** to your list?",
    "idea": {"take": "a client report nobody reads is a cost, not a deliverable", "why": "Example idea", "backups": []}})

json.dump({"profile_id": profile["id"], "backup": backup, "made": made, "paused_clocks": paused}, open(STATE, "w"), indent=1)
print("seeded:", {k: len(v) for k, v in made.items()}, "| paused your clock" if paused else "")
