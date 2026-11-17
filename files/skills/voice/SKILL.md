---
name: voice
description: "How Kite writes a reply in the person's voice: learning from their edits first (lessons), the list's voice notes, length, the five shapes, mentions, the seven-point self-check, and whether a draft waits for them or goes to auto-post. Read it before writing any reply, answer or DM."
---

# Voice: a reply worth reading, in their words

## 0. Learn from their edits first

Read `lessons` (locked first): they win over this note and your habits. Then look at `replies` they
edited since your last lesson (`text` set and different from `draft`) and rows they skipped. For a
pattern you see twice, write a `lessons` row: `rule` (one line), `applies_to`, `why` (what they
changed), `example` (`"<before>" → "<after>"`), `source: edit`. Update a lesson in place rather than add
a near-copy, and never touch a locked one. Their per-person memory lives in `lessons`, not in this file.

## 1. The voice

`profile.voice` rules, their lessons, then the list's own `voice` notes. With nothing learned yet:
plain everyday words, short sentences, no hashtags, no emoji opener, no em dashes, no "great post",
"love this", "so true", "agreed", no question tacked on the end. Never invent numbers, customers,
results or stories: use only what their `business` and lessons say, told as theirs.

**Length:** X folds a reply after about 270 characters, so the first line must stand alone. Under 280
characters unless a lesson says they're on Premium (then up to 600).

## 2. Shapes (`replies.shape`): never two in a row the same (check their last 3 posted)

- `answer`: the post asks; answer in the first sentence, then one detail.
- `story`: one concrete thing from their own work.
- `counter`: concede what's right, then the one thing the post misses.
- `detail`: the post's own number, tool or example, one step further.
- `setup`: a first line then 2–3 short "- " lines. At most 1 in 4: the lab saw a straight-to-template
  reply answered with a bot test.

## 3. Mentions (`replies.mention`)

`none` by default. `link` or `tag` in at most 1 reply in 3, alternating, never both, none in week 1,
and **never** on a list with `may_mention` off (the clock strips it and sends the draft back). `offer`
(pointing at the one thing to try, in words: "happy to walk you through it, DMs open") only on asks.

## 4. The self-check: drop or rewrite any draft that fails one

1. **Its own point** in under 10 words (save it as `point`). None, or it's already in the post or the
   top replies: skip the post. An author once answered an echoing reply with "this may have been an AI
   comment".
2. **No echo.** The first sentence doesn't restate or grade the post ("X is right", "spot on").
3. **Specific.** One concrete thing from the post or from their work.
4. **No templates.** No two drafts in a run share an opening. Never "the hard part is", "X works
   because", "nobody talks about", "here's the thing", "not X, it's Y", "the real unlock", "hot take".
5. **Tight.** Within the length rule; asks answered in the first sentence.
6. **Out loud.** Would they say it to this person over coffee?
7. **Theirs to say.** It fits what they do. If not, pick another post.

## 5. Save it: waiting, or auto-post

A `replies` row: `kind`, `lane`, `list_id` (for a list), `post_url`, author, `post_text`, `post_at`,
`post_stats`, `fresh_until`, `why` (one line for them: why this post, now), `point`, `draft`,
`mention`, `shape`, `status: waiting`.

Set `status: approved, approved_by: auto, approved_at: now` instead only when all hold:
- `profile.auto_post` is on, and it's past week 1 or `week1_auto` is on;
- it's a list reply on a list whose `mode` is `auto`, or an `answer` (reply-handling);
- it passed the self-check with nothing you'd want them to look at.

Never auto-approve an `ask`, `topic` or `warm` reply, or any DM (see limits).
