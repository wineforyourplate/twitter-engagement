# Twitter Engagement: design

The pod and app are named `x-teammate`; the name people see is **Twitter Engagement**. The teammate is
Kite. How to install and run it is in [README.md](README.md).

## Thesis

One person, one X account, five minutes a day. The app answers three questions in this order: did
anyone answer me, what is waiting for my tap, and is my teammate safe to leave running.

- **Hero moment:** Today. The ring fills as replies go out against today's cap, with a tick where the
  pace allows Kite to be right now. Beside it, the auto-post switch, and under it the line that says
  what auto-post will never do. Then the queue: people who answered you, drafts waiting for you, and
  what's going out next with the time each one goes.
- **First 30 seconds:** the greeting with Kite's live status ("Read your list: 14 new posts, 2
  drafted"), the ring, and the first person who answered you.
- **Primary scenario:** read a draft (their post, why Kite picked it, the reply), approve, edit or skip;
  hold anything auto-post queued that you'd rather see first.

## Screens

| Screen | What it holds |
| --- | --- |
| Onboarding (5 steps) | Hello; your business and topics; your first list (paste handles, or "find people for me") and an optional off-topic list; sign in to X in your own browser; the deal, with the choice to allow auto-post in week 1 |
| Today | The ring and pace, auto-post, pause, the stop banner, Answered you, Waiting for you, Going out next, What Kite did |
| Replies | Waiting, Going out, Posted (views, likes, replies, "author replied"), Skipped and expired; each reply shows its list |
| Lists | Kite's add/drop suggestions, then each X List: mode, share of the cap (and what that is a day), may mention your business, voice notes, members, pause, and a new list |
| People | Everyone who answered you, hottest first, with next steps (and a Follow button when Kite suggests one); the ones already handled |
| Summary | Today's numbers, a post for today, the summary itself, earlier days |
| You | Your X account and sign-in, your business, how Kite writes (voice rules and lessons), searches, limits with the reason for each |
| Ask Kite | A chat about what's on screen, from any page |

States designed on purpose: week 1 (auto-post locked unless chosen in onboarding), paused by you,
stopped by Kite (the coral banner with the one fix), the daily break (queued replies show "after the
break, 15:02"), signed out, nothing waiting, and the first day before any summary.

## Look: Liquid Glass

Glass only works with light behind it, so the page has three layers:

1. **The light.** A pale sky (`#f2f4fa`) lit by slow, blurred washes in Kite's colours: blue
   (`#426cf5`), coral (`#fc707e`), lilac and peach. It drifts over 40 seconds and stops under reduced
   motion.
2. **Content is frosted glass.** Cards are white at 56% with a 24px blur and a hairline rim that catches
   light top-left and bottom-right. The post you're replying to sits in a sunken well; your reply sits in
   a clearer bubble, so the two never blur together.
3. **Chrome is glass too.** One floating pill for navigation, with a lens of clearer glass that slides to
   the page you pick. The switch is a liquid bead in a glass track that stretches when pressed. The one
   primary action per card is smoked ink glass; secondary actions are clear glass; tertiary are quiet text.

- **Colour:** ink `#12141c` (near X's black). Kite blue for live and selected states, coral for what's
  hot or stopped, mint for healthy, amber for waiting. Status is always in words too ("Asked a question",
  "fresh for 1h 22m"), never colour alone.
- **Type:** Geist for the interface; Instrument Serif for the greeting, page titles and the big numbers.
  Weights are light (480 to 620); hierarchy comes from size and colour.
- **Motion:** cards rise in, the nav lens springs, the switch bead overshoots, Kite bobs while idle and
  sways while working. Everything respects `prefers-reduced-motion`.
- **Phones:** one column, the ring above the switch, the nav pill and the Ask pill clear of each other,
  no horizontal scroll at 375px.

## Credits

- **Piecework** (a Lemma day-planner pod from the same team): the Liquid Glass recipe this app follows: light behind the
  glass, frosted content, glass chrome, one floating navigation pill, the smoked-ink primary button and
  the rim highlight. Nothing was copied from its source; the tokens, components and the nav are written
  for this pod. Piecework's own navbar is a vendored 21st.dev component ("Liquid Navbar (Waterline)" by
  Guglielmo Giannattasio, `@gughigug/liquid-glass-navbar`); this app does **not** use it. Our nav is a
  plain React pill with a sliding lens, in `src/components/Dock.tsx`.
- **LinkedIn Teammate** ([github.com/wineforyourplate/linkedin-teammate](https://github.com/wineforyourplate/linkedin-teammate)): the onboarding shape, the approval flow, the
  per-person clock (switched-off schedule templates, each person gets their own copy), the browser lock,
  the allowance pattern and the skill layout.
- **Kite** is from Lemma's cast. Its art loads from `https://lemma.work/teammates/extended/kite-sm.webp`
  and is not bundled; the eye positions come from the cast's rig. If the art can't load, a glass diamond
  in Kite's two colours stands in.
- **Fonts:** Geist and Instrument Serif from Google Fonts. **Icons:** lucide-react.

## Resource map

| UI | Table / resource |
| --- | --- |
| Ring, pace, cap | `replies` (posted today), `profile.limits`, the same rules as `allowance` |
| Auto-post, pause, stop banner | `profile.auto_post`, `week1_auto`, `state`, `stop_reason` |
| Answered you, People | `people` |
| Lists | `lists`, `list_members` |
| Waiting, Going out, Replies | `replies` |
| What Kite did, the status line | `activity`, `profile.last_note` |
| Summary | `summaries` |
| You | `profile`, `searches`, `lessons` |
| Each person's clock | schedule `clock-u<id>` copied from the `clock` template by `src/lib/live.ts` |
| Ask Kite, sign-in | conversations with the `kite` agent (`[App] …`, `[onboarding] …`) |

## Open

- A dark "night" surface for people who live in X's dark mode.
- Whether members below the User role can create their own clock: untested on lemma.work. If they
  can't, Today says the clock couldn't start and why.
