---
name: lists
description: "Keeping the person's X Lists: making each List on X (private) when they create one in the app, adding the members they approved (about 20 a day), and once a week per list suggesting who to add or drop, from signals. Nobody joins or leaves a list without them. Read it for the clock's lists task."
---

# Lists: their feeds, kept tidy

Each `lists` row is a native X List plus Lemma's settings for it (mode, share of the cap, voice notes,
`may_mention`). Members are `list_members` rows. The person decides who's on a list; you make it so on
X and suggest changes.

Take the browser first (x-browser §0). Then, in this order:

## 1. Make the Lists that don't exist on X yet (`x_status: to_create`)

At most 2 a day (`function_allowance {"action": "list_create"}`).
1. Open `https://x.com/i/lists/create`. Name it exactly as the row's `name`, description from `topic`,
   **Private** on.
2. Save, then read the new List's URL: `https://x.com/i/lists/<digits>`. Set `x_list_id`, `x_list_url`,
   `x_status: ready`. If they already have a List with that name (check `https://x.com/<handle>/lists`
   first), use it instead of making another.
3. X refuses or asks for anything: `x_status: needs_you` with a one-line `note`; don't retry today.

## 2. Add approved members (`list_members` with `status: member`, `on_x: false`)

About 20 a day across all lists, 20 seconds apart (`function_allowance {"action": "list_add"}`); oldest
first. For each: open their profile, the "…" menu, "Add/remove from Lists", tick the list, save. Read
back that it's ticked, then set `on_x: true` and `added_at`, and raise the list's `members_on_x`. A
handle that doesn't exist, is protected or blocks them: set `status: removed` with the reason in `why`.

`status: removed` rows that are still `on_x`: untick them the same way, then `on_x: false`.

## 3. The weekly review (lists whose `last_review_at` is over 7 days old)

No browser needed; read `signals`, `replies` and `people`.
- **Suggest adding** up to 5 people a week per list: accounts that posted on this list's topic 3+ times
  in the week (signals `person: "suggest for <list>"`), about 1K–50K followers, who aren't brands,
  bots, engagement farms or sellers of competing products. Prefer anyone who replied to them. A
  `list_members` row with `status: suggested` and a `why` with the evidence ("posted on client reporting
  4 times this week, 8K, replied to you on Tuesday").
- **Suggest dropping** members silent for 3 weeks, or whose posts never drew a reply worth posting in a
  month: `status: drop_suggested` and a `why`.
- Update each member's `signals` (`our_replies`, `best_views`, `last_engaged_at`, `replied_to_us`,
  `last_post_at`, `posts_week`). Set the list's `last_review_at`.
- Suggestions they don't answer drop off after 2 weeks.

## 4. Finish

Release the browser. Set `last_note` ("Made your Cricket list on X and added 12 people").
