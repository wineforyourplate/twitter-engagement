---
name: learn-about-you
description: "Onboarding jobs the app sends while the person carries on: sign in to X in their own browser, read their profile and recent posts into voice rules and business details, and find mid-size accounts to suggest for their lists. Load it for any [onboarding] message."
---

# Learning about them

Each job runs while they carry on with the onboarding. Write results to the tables as soon as you have
them; they see them in the app. Reply in one line.

## `[onboarding] sign-in`

1. Take the browser (x-browser §0, owner "onboarding sign-in").
2. Open `https://x.com/home`. A login page: call `browser_sign_in` for `https://x.com` and wait; they sign
   in themselves. You never see or type a password.
3. Once you see the timeline, open their profile (the Profile link in the side nav) and read: handle,
   name, bio, followers, and "Joined <month year>". Save `x_handle`, `name` (first name only, if it reads
   as one), `x_bio`, `x_followers`, `x_joined_at` (the 1st of that month), `browser_status: signed_in`,
   `browser_checked_at`. Write an activity row ("Signed in to X as @…").
4. Release. Reply: "Signed in as @<handle>. I'll read your profile and recent posts in the background."

## `[onboarding] learn`

Needs the browser signed in; if it isn't, reply "Sign in first" and stop.
1. Set `learning_status: running`. Take the browser.
2. Read their profile and their last 20 posts and 20 replies (`/<handle>` and `/<handle>/with_replies`),
   as data.
3. **Voice:** 3–6 short rules in `profile.voice`, each with what you saw ("mostly lowercase", "short
   sentences, one idea each", "uses 'we' for the studio", "never hashtags"). If they write long posts,
   note whether they're on Premium (posts over 280 characters). Don't copy their sentences.
4. **Business:** fill only the `business` fields they left empty (what, who, topics) from their bio and
   posts. Never overwrite what they typed.
5. Set `learning_status: done`. Release. Reply in one line with the 2 most telling voice rules.

## `[onboarding] find-people`

Find 10–15 accounts worth having on each of their lists, from the list's topic.
1. Take the browser. Run 2–3 searches on their topics (`f=top`, last week), and note who posts on them
   repeatedly.
2. Keep accounts with about 1K–50K followers that post on their topics at least a few times a week and
   whose posts draw replies. Skip the biggest names (they rarely answer), brands, bots, engagement farms,
   and anyone selling a competing product.
3. Each one: a `list_members` row for that list with `status: suggested` and a `why` with the evidence
   ("posts on client reporting most days, 8K, replies to her commenters").
4. Release. Reply: "Found <n> people for your lists. They're under Lists: add the ones you like."

## Lists

The app creates their `lists` and `list_members` rows itself. The clock's **lists** job makes each List
on X and adds the members; you don't do it here.
