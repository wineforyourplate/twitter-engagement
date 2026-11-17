---
name: posting
description: "Posting the queue the clock claimed (task post with ids): one reply at a time, each asked of function_allowance (with its list), the 3-4 minute gap waited out, freshness re-checked, the text typed and read back, the reply found after posting, and DMs the person approved. Read it for the clock's post task."
---

# Posting the queue

The clock claimed these rows (`status: posting`) for this run. Post them in the order given.

Take the browser (x-browser §0). Then for each id:
1. Read the row. If it's no longer `posting` (they held or skipped it), leave it.
2. Ask: `function_allowance {"action": "reply"` (or `"answer"`), `"owner": …, "list_id": <the row's
   list_id, if any>}`. Wait out `wait_seconds` if under 10 minutes (the 3–4 minute gap), then ask again.
   A longer wait, a cap or a list's share used up: set the row back to `approved` and stop. The clock
   brings it back.
3. Post it exactly as x-browser §4 says: re-check freshness first (too old: `expired`), type the row's
   `text` if set, else `draft`, read it back, click, find the reply and save `reply_url`. Text that won't
   match: set the row back to `waiting` with a one-line `error`.
4. One `activity` row ("Replied to Inês Carvalho on your Agency ops list, 34 min old"), then the next.

A `dm` row: `function_allowance {"action": "dm"}`, then x-browser §5. One DM per person, ever.

A reply that doesn't show after posting, or "Something went wrong" twice: that's a stop (x-browser §6).

Release the browser at the end. Set `last_note` ("Posted 3: Devika, Tomás, Inês").
