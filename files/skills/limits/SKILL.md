---
name: limits
description: "Every limit Kite works within on X, with the reason for each: replies a day, the new-account ramp, pacing, the 3-4 minute gap, the hour cap, the daily break, freshness windows, list shares, mentions, likes, follows, DMs, X List additions, and the reach check. Code enforces them (function_allowance, x_clock); this note is so you can explain them. Read it before any run that acts on X."
---

# Limits, and why

`function_allowance` answers every "may I act now?" from code. Never act past `allowed`. These are its
rules, with the lab behind each one (2–17 Nov 2026, one founder account, 560 X replies).

| Limit | Value | Why |
| --- | --- | --- |
| Replies a day | 30 by default, their setting, never over 38 | About 38 a day reached people (about 38 views each). At 76–100 a day in bursts, views fell to 13 and X hid the account's replies for days |
| New account ramp | Week 1: 10. Week 2: 18. An X account under a month old stays at 10, then 18 | New voices and new accounts start gently |
| Gap between replies | 3–4 minutes, a different gap each time | Bursts drew 1–24 views; spaced replies the same day drew 10–30 |
| An hour | At most 5 | Same |
| Pace | By any hour, at most 1.5 × hours since their day's start, plus 2 | Spread across the day, never front-loaded |
| Daily break | 2 hours (default 13:00) and only their working hours | A person takes lunch and sleeps |
| Freshness, at the moment of posting | List posts 2 hours, search posts 3 hours, asks 24 hours (48 for "looking for someone to build this" with under 30 replies), answers 24 hours | Replies on 4–6 hour old posts got about a third of the views |
| A list's share | Each list may use its `cap_share` percent of today's cap (rounded up). Like-only and ideas-only lists never reply | Their mix is their choice; one topic never eats the day |
| Mentions | Their link or tag in at most 1 reply in 3, none in week 1, never on a list with `may_mention` off | A link in every reply reads as a bot; off-topic lists must never pitch |
| Likes | 30 a day: replies to them, and fresh posts on like-only lists | |
| Follows | 5 a day, only ones they approved | Mass following is what X punishes most |
| DMs | 5 a day, only ones they approved, one per person ever | Automated DMs are what X catches fastest |
| Adding to X Lists | 20 a day, 20 seconds apart; at most 2 new Lists a day | Never 100 at once |
| Reach check | Every 3 hours. 10+ replies since they resumed, all at 5 views or fewer: stop | X hid the lab account's replies for days before anyone noticed |

**What auto-post may send:** replies on lists whose mode is `auto`, and answers to people who replied
to them, when `auto_post` is on (and it's past week 1, unless they chose `week1_auto`). Never a search
find, a DM or a follow: X's automation rules forbid automated replies to posts found by keyword search.
`x_clock` sends anything else back to waiting.

**When the allowance says wait:** wait out `wait_seconds` if it's under 10 minutes (that's the gap),
then ask again. Longer, or a cap: leave it for the next run. Held back is "later" or "tomorrow", never
"failed".
