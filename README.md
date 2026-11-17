<p align="center">
  <img src="https://lemma.work/teammates/extended/kite-sm.webp" alt="Kite" width="88" />
</p>

<h1 align="center">Twitter Engagement</h1>

<p align="center">
  <strong>Get into the right conversations on X. Five minutes of you a day.</strong>
</p>

<p align="center">
  Kite reads the people you care about, drafts replies in your voice to their fresh posts,<br />
  answers everyone who answers you, and tells you once a day who is warming up.<br />
  You approve, or switch auto-post on and Kite replies by itself, at a human pace.
</p>

---

## What it does

- **Your X Lists first.** Each list is a private X List (one page shows every member's new posts) with
  Lemma's settings for it: a mode (auto-reply, drafts only, like only, or ideas only), its share of the
  daily cap, its own voice notes, and whether your business may ever be mentioned there. Kite reads one
  list every 30 to 45 minutes, the one furthest behind its share. Add an off-topic list (a sport, a cause)
  so your account doesn't look like it only promotes. Kite suggests who to add or drop; nobody joins or
  leaves without you. Mid-size accounts work best, because they answer back.
- **Asks second.** Two or three times a day it searches for people asking for what you do, and for your
  topics. An answered ask is worth more than any other reply.
- **People who answer you, always.** Every 2 hours Kite reads who replied to you and handles them, hottest
  first: a like, one plain answer in the thread, and a DM drafted for your tap when someone wants to try
  what you offer.
- **Auto-post, on your say-so.** Off by default. When it's on, replies on your auto-reply lists and
  answers to people who replied to you go out on their own. Posts found by search, DMs and follows always wait for
  your tap: X's rules forbid automated replies to posts found by keyword search.
- **A daily summary** at your time: replies and views, who to act on, anything that stopped, and one post
  idea built from what Kite read that day. You post that yourself; Kite never posts your own posts.

## Safe by design

Every limit is checked by code before every action, and each one comes from a two-week engagement lab
on a real founder account:

| Limit | Why |
| --- | --- |
| 30 replies a day by default, 38 at most | About 38 a day reached people. At 76 to 100 a day, views per reply fell from about 38 to 13 and X hid the account's replies |
| 3 to 4 minutes between replies, at most 5 an hour, paced across the day | Bursts drew 1 to 24 views; spaced replies the same day drew 10 to 30 |
| A 2-hour break every day; only your working hours | A person takes lunch |
| Posts under 2 hours old (your list) or 3 hours (search) | Later replies got about a third of the views |
| Week 1: 10 a day, approve-only unless you chose otherwise in onboarding. Week 2: 18 | New accounts and new voices start gently |
| A link or tag in at most 1 reply in 3, none in week 1 | A link in every reply reads as a bot |
| No replies, likes or quotes on posts that address AI or ask for a code | Those posts are traps for automated accounts |
| A reach check every 3 hours | If 10 replies in a row sit at 5 views or fewer, Kite stops X and tells you what to do |
| 30 likes, 5 follows, 5 DMs a day; follows and DMs only with your tap | Automated follows and DMs are what X catches fastest |

At a warning, a captcha, "unusual activity", a rate limit or a reply that doesn't show, Kite stops
everything on X and sends you one message. It never tries to get past a check. One person, one account:
Kite never coordinates accounts, and every table is private to its owner.

## Connect X

There is no X connector and no API key. Each person signs in to X **in their own Lemma browser**, from
the onboarding (or later from You, "Sign in again"). They type their password there; Kite never sees it.
Kite reads and replies in that browser, one run at a time. To sign out:
`lemma browser-logins forget x.com`.

## Install

**One click:** open [lemma.work/import/github/wineforyourplate/twitter-engagement](https://lemma.work/import/github/wineforyourplate/twitter-engagement),
pick an organisation, and Lemma makes the whole pod from this repository: the tables, the functions,
Kite and its notes (`files/skills` lands in `/skills`), the workflow, the clock template, and the app,
built and deployed. Then open the `x-teammate` app and go through the onboarding. Nothing else to run.

**From the command line:** you need the Lemma CLI (logged in), `python3`, and Node.js 20+ with npm. Pass `--server`, `--org` and
`--pod` on every call if you use more than one Lemma server.

```bash
lemma --server <server> --org <org-id> pods create x-teammate
bash scripts/bootstrap.sh --server <server> --org <org-id> --pod <pod-id> --import
```

`--import` imports the tables, functions, the `kite` agent, the `tick` workflow and the `clock`
template. The script then publishes the skills to `/skills` (a bundle import can't write that system
folder), builds the app and deploys it. It is safe to re-run.

Then open the `x-teammate` app. Everyone who uses it, you and anyone you invite to the pod, goes through
the onboarding and gets their own clock.

### Several people in one pod

Every table is private to its owner, so each person sees only their own account, drafts and people. A
timed schedule runs as the person who owns it, so the bundle ships `clock` **switched off**, as a
template. When someone finishes onboarding, the app gives them their own switched-on copy,
`clock-u<first 8 of their id>`, visible only to them, on their time zone, every 15 minutes (the shortest
timed schedule Lemma allows). Their runs then see their rows and drive their browser. Members need a role
that may create schedules (User or above).

Or give each person their own pod: install the same bundle once per person. Nothing changes.

## Seed (example data)

To see a working day without touching X, seed invented example rows for yourself, then remove them:

```bash
bash seed/seed.sh --server <server> --org <org-id> --pod <pod-id>
bash seed/seed.sh clean --server <server> --org <org-id> --pod <pod-id>
```

Every handle and URL is made up (`x.com/example/...`). The seed pauses your own clock while the example
rows are there, so Kite never works on them, and `clean` switches it back on. To see the screens on invented data with no pod at all, run the app
locally and open `/?demo=1`.

## Smoke test

Run these as yourself, after the install and before you finish onboarding. Each should answer as shown.

1. `lemma functions run setup_me --data '{"timezone":"Asia/Kolkata"}'`: your profile and 3 starter searches.
   Nothing else: the lab's lessons live in Kite's notes (`files/skills/learnings`), not in anyone's rows.
2. `lemma functions run x_clock --data '{}'`: `skip`, "still onboarding".
3. `lemma functions run allowance --data '{"action":"reply","owner":"t"}'`: `allowed: 0`, "still onboarding".
4. `lemma functions run browser_lock --data '{"action":"take","owner":"t","minutes":2}'`, then
   `{"action":"check","owner":"u"}` says "in use", then `{"action":"release","owner":"t"}`.
5. `lemma workflows run tick`: completes through `clock → route → quiet`. Kite is never woken.
6. Seed (above), then `lemma functions run x_clock --data '{}'`:
   - `action: post` with one id, the auto-approved reply on the auto-reply list;
   - the stale example draft is now `expired`;
   - the auto-approved **search** find is back to `waiting`, because auto-post never sends search finds.
7. `lemma functions run x_clock --data '{"finish":true,"task":"post"}'` clears the run. Run the clock again
   (finishing between runs): next comes `lists` (the weekly review), then `list` picks lists by weight.
   A reply with a link on the Cricket list goes back to waiting with "never mentions your business".
8. `lemma agents chat kite "[App] [Viewing: Today] which drafts are waiting for me? don't open the browser"`:
   Kite lists them and says the search find needs your tap.
9. Open the app: Today shows the ring, the switch and the queue. Approve, Skip and Hold write to `replies`;
   the switch writes `profile.auto_post`.
10. Clean the seed.

## How it works

```text
 every 15 minutes, as you ──▶ x_clock (code: cheap, claims the work)
        │
        ├─ summary time ─────────▶ Kite writes the day's summary and one post idea (no browser)
        ├─ approved replies ─────▶ Kite posts up to 3, one at a time, each asked of `allowance`
        ├─ every 2 hours ────────▶ Kite reads who replied to you and handles each, by tier
        ├─ every 3 hours ────────▶ the reach check: views read back, `reach` decides
        ├─ 3 slots a day ────────▶ your searches, asks first
        ├─ every 3 hours ────────▶ lists: make new X Lists, add approved members (20 a day), weekly review
        ├─ every 30–45 minutes ──▶ one X List, by weight: draft, like or just read, per its mode
        └─ otherwise ────────────▶ nothing; Kite isn't woken
```

| Layer | What ships |
| --- | --- |
| App `x-teammate` (shown as Twitter Engagement) | Onboarding, Today (ring, auto-post, the queue), Replies, Lists, People, Summary, You, and Kite in the corner. Liquid Glass |
| Agent `kite` | One agent. Its instruction is a short index; the notes are 11 files in `files/skills/` (published to `/skills`): `limits`, `learnings`, `x-browser`, `lanes`, `voice`, `posting`, `reply-handling`, `lists`, `reach-check`, `daily-summary`, `learn-about-you`. Each person's memory is their own `lessons` rows |
| Tables | `profile`, `lists`, `list_members`, `searches`, `people`, `signals`, `replies`, `activity`, `summaries`, `lessons`, all private to their owner |
| Functions | `setup_me`, `x_clock`, `allowance`, `browser_lock`, `reach` |
| Automation | Workflow `tick`; schedule template `clock` (each person gets their own copy) |

The screens, the look and their credits are in [DESIGN.md](DESIGN.md).

## Make it yours

- `agents/kite/instruction.md`: who Kite is, the index of notes, the rules that never bend.
- `files/skills/limits/SKILL.md`: every limit and why. `files/skills/learnings/SKILL.md`: the lab's lessons.
- `files/skills/lanes/SKILL.md`: lists, searches, freshness. `files/skills/voice/SKILL.md`: drafting and the self-check.
- `files/skills/reply-handling/SKILL.md`: the playbook.
- `functions/allowance/code.py`: every limit, in one place.
- `apps/x-teammate/source/`: the React app. `npm run dev`, then `/?demo=1`.

Keep private records, browser sessions, member ids and credentials out of Git.
