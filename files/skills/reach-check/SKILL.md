---
name: reach-check
description: "Every 3 hours: read back the views, likes and replies on the person's recent X replies, record them, and ask function_reach whether X is hiding them. If it says stop, X stops and the person hears once. Load it for the clock's check task."
---

# The reach check

In the lab, X hid the account's replies for days (1–5 views each, on posts with hundreds to thousands of
views) before anyone noticed, and replies kept going out into nothing. This check catches that within 3
hours, and every readout also feeds the summary and the person's numbers.

1. Take the browser (x-browser §0). Open `https://x.com/<their handle>/with_replies`, scroll 3–4 times,
   and read every reply of theirs from the last 26 hours as data: its URL, its action-bar numbers
   (`aria-label`: replies, reposts, likes, views), and whether the post's author replied under it.
2. Match each to its `replies` row by `reply_url`. For every one posted more than an hour ago, set
   `readout` to `{views, likes, replies, author_replied, checked_at}`.
3. For a reply on a list member's post, update that `list_members` row's `signals` (`our_replies`,
   `best_views`, `last_engaged_at`). An author who replied to them goes to reply-handling on its next
   run; you don't handle them here.
4. Ask: `function_reach {}`.
   - `stop: false`: write one `check` activity row with its `reason` ("9 read, median 41").
   - `stop: true`: it already stopped X. `message_user` once with its `message`, write a `warning`
     activity row, release, stop.
5. Release the browser. Set `last_note`.

Never "test" reach by posting. Never resume X yourself: only they do, after checking a hand-posted reply
from a logged-out browser.
