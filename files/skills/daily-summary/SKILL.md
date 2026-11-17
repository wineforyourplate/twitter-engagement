---
name: daily-summary
description: "Once a day at the person's summary time: the day on X in one page (status, numbers, people to act on, decisions for them) written to the summaries table, one short message, and one post idea built from what Kite read. No browser. Load it for the clock's summary task."
---

# The daily summary

What the founder in the lab found most useful was a daily list with names and next steps. This is that,
for one person, from rows only. Never open the browser for it.

## 1. Gather (last 24 hours, their time zone)

- `replies` posted: count, total and median views (from `readout`), author replies, by lane, how many by
  auto-post vs approved by them.
- `replies` waiting, and anything `expired` or `failed` (and why).
- `people` with `status: open`, hottest first; `list_members` suggested to add or drop, per list; each
  list's replies today against its share.
- `profile.state` and `stop_reason`; any `warning` in `activity`.
- `signals` from today: topics, how many posts each, the busiest posts.

## 2. Write the `summaries` row

`day` (YYYY-MM-DD, their time), a `headline` with the day's one fact that matters ("14 replies, 1 hot
lead, reach is healthy"), `numbers` `{replies, views, author_replies, answered, people}`, and `body` in
markdown, short and plain, in this order:

```
## Status
- replies and the cap, median views, and whether reach looks healthy
- anything stopped, and the one thing that fixes it
## People
- each open person: name, what they said in a few words, the next step
## Decisions for you
1. people to add to or drop from a list, a lesson to confirm
## What I read
- one line: how many posts, the loudest topic
```

Nobody's name without a reason they're there. No praise, no filler, no em dashes.

## 3. One post idea (`idea`)

From today's `signals`, pick the topic with the most posts and engagement where their `business` has
something real to say. Run 2–3 web searches for what's actually new on it (a number, a launch, a study),
with dates. Write `take`: one post in their voice, a claim plus why, under 280 characters, no invented
numbers or customers. `why`: one line on why now ("9 posts on client reporting today, 4 from your list").
`backups`: two other one-line angles. They post it themselves; you never post their own posts.

## 4. Send it

`message_user` once. Title: the headline. Body, 3–5 short lines: the replies and median views, the
hottest person and their next step, anything stopped, and "Open today's summary in the app." Then set
`last_note`.
