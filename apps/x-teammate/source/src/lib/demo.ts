/* Invented example data for the demo (?demo=1) and the localhost mock. Every
   person, handle and post here is made up. Times are relative to "now" so the
   freshness clocks move while you look. */

import type { Activity, Lesson, ListMember, Person, Profile, Reply, Search, Summary, XList } from './types'

const m = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const ahead = (min: number) => new Date(Date.now() + min * 60_000).toISOString()
const day = (offset = 0) => {
  const d = new Date(Date.now() - offset * 86_400_000)
  return d.toISOString().slice(0, 10)
}

export function demoProfile(): Profile {
  return {
    id: 'p1',
    onboarding_step: 'done',
    name: 'Maya',
    x_handle: 'maya_automates',
    x_followers: 1840,
    timezone: 'Asia/Kolkata',
    business: {
      what: 'I run a 4-person studio that builds AI automations for marketing agencies',
      who: 'Agency owners and ops leads drowning in client reporting and follow-ups',
      offer: 'A free 20-minute teardown of one workflow, then we build it with you',
      link: 'loomstudio.example/?utm_source=x&utm_medium=reply',
      tag: '@loomstudio',
      topics: ['agency operations', 'client reporting', 'AI agents at work', 'workflow tools that break'],
    },
    limits: {
      daily_cap: 30,
      gap_min: 180,
      gap_max: 240,
      hour_cap: 5,
      break_start: '13:00',
      break_minutes: 120,
      day_start: '08:00',
      day_end: '23:00',
    },
    auto_post: true,
    state: 'running',
    started_at: m(60 * 24 * 19),
    browser_status: 'signed_in',
    browser_checked_at: m(6),
    summary_time: '09:00',
    voice: [
      'lowercase, plain words, no colons - join with " - "',
      'open with your own point, never by grading theirs',
      'one concrete detail from client work per reply',
      'no em dashes, no "great post", no question tacked on the end',
    ],
    last_post_at: m(4),
  }
}

/** A morning's worth of posted replies, so the ring and the readouts have something to show. */
function morning(): Reply[] {
  const who = [
    ['lena_does_ops', 'Lena Vogt', 5400],
    ['carlos_agency', 'Carlos Ruiz', 2900],
    ['priya_ops_lab', 'Priya Menon', 11800],
    ['jon_automates', 'Jon Hale', 7300],
    ['agencyweekly_ana', 'Ana Duarte', 19600],
    ['mo_reports', 'Mo Haddad', 1600],
    ['ops_with_kay', 'Kay Lindqvist', 4400],
    ['retainer_rob', 'Rob Ellis', 9100],
    ['studio_sena', 'Sena Okoro', 3300],
    ['the_am_desk', 'Dana Price', 6000],
    ['ruth_runs_growth', 'Ruth Abara', 2500],
  ] as const
  const views = [41, 63, 18, 120, 35, 22, 57, 44, 29, 76, 12]
  const said = [
    ['our onboarding doc has a "who owns this automation" column now. painful week to write it', 'that column is the whole fix tbh - we add a 2nd one, "what breaks if it stops", and the scary ones get a daily check'],
    ['retainers are getting harder to justify when clients can prompt their own ads', 'the retainer moves to the boring bit - the agent that checks spend every morning and flags the 2 campaigns that drifted'],
    ['anyone else drowning in client slack channels? 40 of them', 'we pipe all 40 into one daily digest per AM - who asked something, who is still waiting. the channels stay, the scrolling goes'],
    ['AI agents for agencies are 90% demo, 10% production', 'the 10% is always the dull stuff - reports, invoices, chasing approvals. nobody demos the friday report'],
    ['hiring an ops person vs automating ops - what would you do at 15 people?', 'automate the repeatable 60% first, then hire for the judgement bit. the hire ramps faster when the dull stuff already runs'],
    ['monthly reporting took my team 3 days this month. again', '3 days is the copy-paste tax. pull the numbers on the 1st, draft the 3-line story, AM edits in 20 mins'],
    ['what tool do you use to track client approvals?', 'a channel per client + an agent that nudges at 48h with the exact file. approvals stopped living in email'],
    ['the best agency ops people I know are basically product managers', 'and the worst agency ops tools are built by people who never ran a client friday'],
    ['which workflow tool for a 6-person agency?', 'whichever one you can hand to the next person - at 6 people the bus factor matters more than the pricing'],
    ['we automated our proposals and win rate went down', 'the template got faster but lost the 1 line that showed you listened on the call - keep that line human'],
    ['client churn always starts with a missed report', 'or a report nobody read - we flag any client who hasn\'t opened the last 2'],
  ]
  // as many as the pace allows by now (1.5 an hour from 08:00 + 2), less the 3 posted below
  const hours = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })) - 8
  const n = Math.max(0, Math.min(who.length, Math.floor(1.5 * Math.max(0, hours) + 2) - 4))
  return who.slice(0, n).map(([handle, name, followers], i) => ({
    id: `m${i}`,
    kind: 'reply',
    lane: i % 4 === 3 ? 'topic' : 'list',
    list_id: i % 4 === 3 ? null : i % 3 === 2 ? 'L2' : 'L1',
    status: 'posted',
    approved_by: i % 3 === 0 ? 'you' : 'auto',
    post_url: '#',
    reply_url: '#',
    author_handle: handle,
    author_name: name,
    author_followers: followers,
    post_text: said[i][0],
    why: 'On your list, early',
    draft: said[i][1],
    mention: i % 3 === 1 ? 'tag' : 'none',
    posted_at: m(4 + i * 17),
    readout: i < 9 ? { views: views[i], likes: Math.round(views[i] / 20), replies: i % 4 === 0 ? 1 : 0, author_replied: i === 3, checked_at: m(10) } : null,
    created_at: m(20 + i * 17),
  }))
}

export function demoReplies(): Reply[] {
  return [
    ...morning(),
    {
      id: 'r1',
      kind: 'reply',
      lane: 'ask',
      status: 'waiting',
      post_url: '#',
      author_handle: 'devika_runs_ops',
      author_name: 'Devika Nair',
      author_followers: 6200,
      author_bio: 'COO at a 30-person performance agency. Spreadsheets are my love language.',
      post_text:
        'genuine question for agency people - how are you doing weekly client reports without someone losing every friday to it? we tried 3 dashboards and still end up screenshotting',
      post_at: m(47),
      post_stats: { likes: 18, replies: 9, views: 2400 },
      why: 'A real ask: she needs this now, and weekly reports are exactly what you build',
      draft:
        "the screenshotting is the tell - the dashboard isn't the report, the story is. what works for agencies we set up - an agent pulls the numbers friday 7am, writes the 3 lines a client actually reads, and drops it in slack for the AM to ok\n- AM edits, clicks send\n- edits get saved so next week's draft sounds like them\nhappy to walk you through one, DMs open",
      mention: 'none',
      shape: 'answer-then-setup',
      fresh_until: ahead(60 * 23),
      created_at: m(9),
    },
    {
      id: 'r2',
      kind: 'reply',
      lane: 'list',
      list_id: 'L1',
      status: 'approved',
      approved_by: 'auto',
      post_url: '#',
      author_handle: 'tomas_buildsops',
      author_name: 'Tomás Ferreira',
      author_followers: 14300,
      author_bio: 'Ops for agencies. Writing about the boring parts that make money.',
      post_text:
        'hot take - most agencies don\'t have an automation problem, they have a "nobody owns the automation" problem. it breaks on a tuesday and the person who built it left in march',
      post_at: m(38),
      post_stats: { likes: 64, replies: 21, views: 7900 },
      why: 'On your list, 38 min old, and ownership after launch is your strongest story',
      draft:
        'had a client where the automation that sent invoices died silently for 6 weeks - nobody noticed till cash flow did. we moved it to an agent that posts a daily "here\'s what ran, here\'s what didn\'t" in their slack. boring, but now someone owns it - the channel does',
      mention: 'none',
      shape: 'story',
      fresh_until: ahead(82),
      created_at: m(6),
    },
    {
      id: 'r3',
      kind: 'reply',
      lane: 'list',
      list_id: 'L1',
      status: 'approved',
      approved_by: 'auto',
      post_url: '#',
      author_handle: 'ines_writes_growth',
      author_name: 'Inês Carvalho',
      author_followers: 3100,
      author_bio: 'Growth for B2B services. Former agency AM.',
      post_text:
        'what\'s the one task you\'d never hand to AI in client work? mine is the monthly "this is why the numbers dipped" call',
      post_at: m(22),
      post_stats: { likes: 11, replies: 14, views: 980 },
      why: 'A question post from your list, early, under 15 replies',
      draft:
        'same - but the prep for that call is where ai earns it. ours pulls the dip, checks the 3 usual suspects (tracking, budget, seasonality) and hands the AM a 5-line brief. the call stays human, the 2 hrs of digging don\'t',
      mention: 'tag',
      shape: 'agree-then-detail',
      fresh_until: ahead(98),
      created_at: m(3),
    },
    {
      id: 'r4',
      kind: 'answer',
      lane: 'answer',
      status: 'approved',
      approved_by: 'auto',
      approved_at: m(2),
      post_url: '#',
      author_handle: 'raf_agencylife',
      author_name: 'Rafael Mendes',
      author_followers: 890,
      post_text: 'how do you stop the agent from sending a report with a broken number though?',
      post_at: m(70),
      why: 'He asked you a question under your reply. Answer within 2 hours',
      draft:
        'it never sends - it drafts. anything that moved more than 30% vs last week gets flagged at the top so the AM checks that line first',
      mention: 'none',
      shape: 'answer',
      fresh_until: ahead(50),
      created_at: m(12),
    },
    {
      id: 'r5',
      kind: 'reply',
      lane: 'list',
      list_id: 'L1',
      status: 'posted',
      approved_by: 'you',
      post_url: '#',
      reply_url: '#',
      author_handle: 'tomas_buildsops',
      author_name: 'Tomás Ferreira',
      author_followers: 14300,
      post_text: 'agencies charging retainers for "AI strategy" with zero automations shipped is the new SEO audit',
      post_at: m(60 * 5),
      why: 'On your list, early',
      draft: 'the tell is the deck has no "what runs on monday" slide. we start every engagement with 1 workflow live in week 1',
      mention: 'none',
      posted_at: m(60 * 4 + 20),
      readout: { views: 212, likes: 6, replies: 2, author_replied: true, checked_at: m(30) },
      created_at: m(60 * 4 + 40),
    },
    {
      id: 'r6',
      kind: 'reply',
      lane: 'topic',
      status: 'posted',
      approved_by: 'you',
      post_url: '#',
      reply_url: '#',
      author_handle: 'opsjunkie_lee',
      author_name: 'Lee Park',
      author_followers: 22100,
      post_text: 'workflow builders are great until you have 40 workflows and no idea which ones matter',
      post_at: m(60 * 3),
      why: 'Climbing topic post, workflows at scale',
      draft: 'we tag each workflow with the client it bills to. the ones nobody can tag get switched off for a week - half of them nobody misses',
      mention: 'link',
      posted_at: m(60 * 2 + 40),
      readout: { views: 88, likes: 3, replies: 0, author_replied: false, checked_at: m(25) },
      created_at: m(60 * 2 + 50),
    },
    {
      id: 'r7',
      kind: 'reply',
      lane: 'list',
      list_id: 'L1',
      status: 'posted',
      approved_by: 'auto',
      post_url: '#',
      reply_url: '#',
      author_handle: 'devika_runs_ops',
      author_name: 'Devika Nair',
      author_followers: 6200,
      post_text: 'client onboarding checklist v4. still 31 steps. someone stop me',
      post_at: m(60 * 2),
      why: 'On your list, she replied to you last week',
      draft: '31 is fine if 20 of them run themselves - we got one agency to 9 human steps, the rest happen when the contract lands in the drive',
      mention: 'none',
      posted_at: m(60 + 35),
      readout: { views: 46, likes: 2, replies: 1, author_replied: false, checked_at: m(20) },
      created_at: m(60 + 50),
    },
    {
      id: 'r8',
      kind: 'reply',
      lane: 'topic',
      status: 'expired',
      post_url: '#',
      author_handle: 'growthgrid_sam',
      author_name: 'Sam Okafor',
      author_followers: 41000,
      post_text: 'every agency will have an AI ops person by 2027. most will call it something embarrassing',
      post_at: m(60 * 6),
      why: 'Climbing topic post',
      draft: 'ours is called "the friday person" because it does the friday stuff',
      mention: 'none',
      created_at: m(60 * 5),
    },
    {
      id: 'r9',
      kind: 'dm',
      lane: 'warm',
      status: 'waiting',
      post_url: '#',
      author_handle: 'nikhil_scales',
      author_name: 'Nikhil Batra',
      author_followers: 2300,
      author_bio: 'Founder, 12-person paid social agency',
      post_text: 'looks interesting tbh, shoot me a DM',
      post_at: m(95),
      why: 'He asked for a DM under your reply. Hot: send it today',
      draft:
        "hey nikhil - saw you run paid social for 12 people. the one thing i'd start with for you is the weekly client report - we build it with you in a 20 min call and it's live by friday. happy to set it up with you if you want",
      mention: 'offer',
      created_at: m(40),
    },
  ]
}

export function demoPeople(): Person[] {
  return [
    {
      id: 'h1',
      handle: 'nikhil_scales',
      name: 'Nikhil Batra',
      bio: 'Founder, 12-person paid social agency',
      followers: 2300,
      tier: 'hot',
      said: 'looks interesting tbh, shoot me a DM',
      said_at: m(95),
      next_step: 'Send the DM (drafted). He asked for it.',
      status: 'open',
      follows_you: false,
      follow: 'suggested',
    },
    {
      id: 'h2',
      handle: 'raf_agencylife',
      name: 'Rafael Mendes',
      bio: 'AM at a creative agency',
      followers: 890,
      tier: 'question',
      said: 'how do you stop the agent from sending a report with a broken number though?',
      said_at: m(70),
      next_step: 'Answer queued (auto-post). Then a DM for your tap.',
      status: 'open',
      follows_you: true,
    },
    {
      id: 'h3',
      handle: 'tomas_buildsops',
      name: 'Tomás Ferreira',
      bio: 'Ops for agencies. Writing about the boring parts that make money.',
      followers: 14300,
      tier: 'agreement',
      said: 'the "what runs on monday" slide is going in my next deck',
      said_at: m(60 * 3 + 10),
      next_step: 'Liked. One reply that builds on it, with your tag.',
      status: 'open',
    },
  ]
}

export function demoLists(): XList[] {
  return [
    { id: 'L1', name: 'Agency ops', topic: 'agency owners and ops leads on reporting, delivery and tooling', mode: 'auto', cap_share: 55, may_mention: true, active: true, x_status: 'ready', x_list_id: '1', members_on_x: 24, last_read_at: m(6), voice: 'talk like an operator, one concrete client detail' },
    { id: 'L2', name: 'Product', topic: 'people building AI products and agents', mode: 'drafts', cap_share: 25, may_mention: true, active: true, x_status: 'ready', x_list_id: '2', members_on_x: 18, last_read_at: m(52) },
    { id: 'L3', name: 'Cricket', topic: 'match chat and cricket writers', mode: 'like', cap_share: 10, may_mention: false, active: true, x_status: 'ready', x_list_id: '3', members_on_x: 12, last_read_at: m(140), voice: 'a fan, never work talk' },
    { id: 'L4', name: 'Social issues', topic: 'education and civic causes she cares about', mode: 'drafts', cap_share: 10, may_mention: false, active: true, x_status: 'to_create', members_on_x: 0, voice: 'careful and personal; never pitch, never joke' },
  ]
}

export function demoMembers(): ListMember[] {
  const mem = (id: string, handle: string, name: string, list_id: string, followers: number, extra: Partial<ListMember> = {}): ListMember => ({
    id, handle, name, list_id, followers, status: 'member', on_x: true, ...extra,
  })
  return [
    mem('M1', 'tomas_buildsops', 'Tomás Ferreira', 'L1', 14300, { signals: { our_replies: 4, best_views: 212, replied_to_us: true, last_post_at: m(38) } }),
    mem('M2', 'devika_runs_ops', 'Devika Nair', 'L1', 6200, { signals: { our_replies: 3, best_views: 140, last_post_at: m(47) } }),
    mem('M3', 'ines_writes_growth', 'Inês Carvalho', 'L1', 3100, { signals: { our_replies: 1, best_views: 64, last_post_at: m(22) } }),
    mem('M4', 'lena_does_ops', 'Lena Vogt', 'L1', 5400, { signals: { our_replies: 2, best_views: 41, last_post_at: m(90) } }),
    mem('M5', 'priya_ops_lab', 'Priya Menon', 'L2', 11800, { signals: { our_replies: 1, best_views: 18, last_post_at: m(200) } }),
    mem('M6', 'jon_automates', 'Jon Hale', 'L2', 7300, { signals: { our_replies: 2, best_views: 120, last_post_at: m(70) } }),
    mem('M7', 'cover_drive_daily', 'Cover Drive Daily', 'L3', 9100, { signals: { last_post_at: m(30) } }),
    mem('M8', 'nets_and_notes', 'Nets and Notes', 'L3', 4200, { signals: { last_post_at: m(160) } }),
    mem('M9', 'ben_from_ops', 'Ben Adeyemi', 'L1', 4100, { status: 'drop_suggested', why: 'Silent for 3 weeks', signals: { our_replies: 2, last_post_at: m(60 * 24 * 23) } }),
    mem('M10', 'clara_ops_notes', 'Clara Weiss', 'L1', 8700, { status: 'suggested', on_x: false, why: 'Posted on client reporting 4 times this week, 8.7K, replied to you on Tuesday' }),
    mem('M11', 'opsjunkie_lee', 'Lee Park', 'L2', 22100, { status: 'suggested', on_x: false, why: 'Posted about workflow sprawl 3 times this week; your reply there got 88 views' }),
    mem('M12', 'civic_class', 'Asha Kulkarni', 'L4', 3600, { on_x: false }),
  ]
}

export function demoSearches(): Search[] {
  return [
    { id: 's1', kind: 'ask', label: 'Looking for someone to build it', query: '("looking for someone" OR "can anyone recommend" OR "need someone to build") (automation OR agent OR workflow)', active: true, last_run_at: m(130), found_last: 2 },
    { id: 's2', kind: 'ask', label: 'Client reporting pain', query: '("client reports" OR "client reporting") ("how do you" OR "anyone" OR "takes forever")', active: true, last_run_at: m(130), found_last: 1 },
    { id: 's3', kind: 'ask', label: 'Outgrowing a workflow tool', query: '("workflow tool" OR automations) ("outgrown" OR "keeps breaking" OR "alternative")', active: true, last_run_at: m(130), found_last: 0 },
    { id: 's4', kind: 'topic', label: 'Agency operations', query: '("agency owner" OR "agency ops") (AI OR automation)', active: true, last_run_at: m(130), found_last: 4 },
    { id: 's5', kind: 'topic', label: 'AI agents at work', query: '("AI agents" OR agentic) (team OR clients OR ops)', active: false },
  ]
}

export function demoActivity(): Activity[] {
  return [
    { id: 'a1', at: m(4), action: 'reply', detail: 'Replied to @lena_does_ops (list, 52 min old)', result: 'ok' },
    { id: 'a2', at: m(6), action: 'read', detail: 'Read your list: 14 new posts, 3 fresh enough, 2 drafted', result: 'ok', page_loads: 1 },
    { id: 'a3', at: m(12), action: 'like', detail: 'Liked @raf_agencylife\'s question', result: 'ok' },
    { id: 'a4', at: m(31), action: 'check', detail: 'Reach check: 9 replies over an hour old, median 41 views', result: 'ok', page_loads: 1 },
    { id: 'a5', at: m(48), action: 'skip', detail: 'Skipped a post asking AI accounts to reply with a code (bot-bait)', result: 'ok' },
  ]
}

export function demoSummaries(): Summary[] {
  return [
    {
      id: 'y1',
      day: day(0),
      headline: '14 replies, 1 hot lead, reach is healthy',
      numbers: { replies: 14, views: 1210, author_replies: 3, answered: 4, people: 6 },
      body: `## Status
- **14 replies** so far (cap 30), median **41 views**. Reach is healthy.
- **3 authors replied** to you: Tomás, Devika and one from search.
- Auto-post is on. 9 went out on their own, 5 you approved.

## People
- **Nikhil Batra** asked for a DM 1 h ago. It's drafted and first in your queue.
- **Rafael Mendes** asked how the agent avoids broken numbers. The answer goes out in a few minutes; then a DM waits for your tap.
- **Tomás Ferreira** (14K) said your "what runs on monday" line is going in his deck. One reply with your tag is queued.

## Decisions for you
1. Add **Clara Weiss** and **Lee Park** to your list? Both post about your topics daily.
2. **Ben Adeyemi** has been silent 3 weeks. Drop him from the list?

## What I read
112 posts across your list and 3 searches. The loudest topic today was client reporting after a big reporting tool raised prices.`,
      idea: {
        take: 'a client report nobody reads is a cost, not a deliverable. 3 lines and 1 chart beat 14 slides - the AM can actually defend 3 lines on a call',
        why: '9 posts on client reporting today, 4 from your list, most of them complaints with no fix',
        backups: ['the automation that dies on a tuesday is an ownership problem, not a tooling one', 'agencies should bill for workflows that run, not decks about them'],
      },
      created_at: m(5),
    },
    {
      id: 'y2',
      day: day(1),
      headline: '29 replies, 2 people asked questions, both answered',
      numbers: { replies: 29, views: 1730, author_replies: 4, answered: 2, people: 5 },
      body: `## Status
- **29 replies** (cap 30), median **38 views**.
- Both questions were answered within 2 hours.`,
      created_at: m(60 * 24),
    },
  ]
}

export function demoLessons(): Lesson[] {
  return [
    {
      id: 'l1',
      rule: 'Cut the first sentence when it restates their post',
      applies_to: 'every reply, the opening line',
      why: 'You deleted the opener on 4 drafts this week; each one repeated their point',
      example: '"weekly reports are a pain" → (cut) "the screenshotting is the tell"',
      source: 'edit',
      locked: false,
      created_at: m(60 * 20),
    },
    {
      id: 'l2',
      rule: 'Say "clients", never "customers"',
      applies_to: 'every reply and DM',
      why: 'You changed it 3 times; agencies say clients',
      source: 'edit',
      locked: true,
      created_at: m(60 * 40),
    },
  ]
}
