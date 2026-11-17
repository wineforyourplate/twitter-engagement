/* Row shapes, one per pod table. Every table is private to its owner (RLS), so
   the app only ever sees the signed-in person's rows. See ../../../../SPEC.md §6. */

export type Lane = 'list' | 'ask' | 'topic' | 'warm' | 'answer'
export type Mention = 'none' | 'tag' | 'link' | 'offer'
export type ReplyStatus =
  | 'waiting' // drafted, waiting for you
  | 'approved' // you said yes (or auto-post did), waiting for its turn
  | 'posting' // a run claimed it
  | 'posted'
  | 'skipped'
  | 'expired' // the post got too old before it could go out
  | 'failed'
export type ReplyKind = 'reply' | 'answer' | 'dm'

export interface Readout {
  views?: number | null
  likes?: number | null
  replies?: number | null
  author_replied?: boolean
  checked_at?: string
}

export interface Reply {
  id: string
  kind: ReplyKind
  lane: Lane
  list_id?: string | null
  status: ReplyStatus
  post_url: string
  author_handle: string
  author_name: string
  author_followers?: number | null
  author_bio?: string | null
  post_text: string
  post_at?: string | null // when the post went up
  post_stats?: { likes?: number; replies?: number; views?: number } | null
  why: string
  draft: string
  text?: string | null // your edit, if you changed it
  mention: Mention
  shape?: string | null
  fresh_until?: string | null
  approved_by?: 'you' | 'auto' | null
  approved_at?: string | null
  posted_at?: string | null
  reply_url?: string | null
  readout?: Readout | null
  person_id?: string | null
  error?: string | null
  point?: string | null
  parent_url?: string | null
  created_at: string
}

export type ListMode = 'auto' | 'drafts' | 'like' | 'ideas'

export interface XList {
  id: string
  name: string
  topic?: string | null
  x_list_id?: string | null
  x_list_url?: string | null
  mode: ListMode
  cap_share: number // percent of the daily cap, and its weight in the rotation
  voice?: string | null
  may_mention: boolean
  active: boolean
  x_status: 'to_create' | 'ready' | 'needs_you'
  members_on_x?: number | null
  last_read_at?: string | null
  note?: string | null
  created_at?: string
}

export interface ListMember {
  id: string
  handle: string
  name?: string | null
  list_id: string
  status: 'member' | 'suggested' | 'drop_suggested' | 'removed'
  why?: string | null
  followers?: number | null
  on_x?: boolean | null
  signals?: { replied_to_us?: boolean; our_replies?: number; best_views?: number; last_engaged_at?: string; last_post_at?: string; posts_week?: number } | null
}

export type Tier = 'hot' | 'question' | 'pushback' | 'agreement' | 'ack' | 'ignore'

export interface Person {
  id: string
  handle: string
  name: string
  bio?: string | null
  followers?: number | null
  tier?: Tier | null
  said?: string | null // what they said to you, last time
  said_url?: string | null
  said_at?: string | null
  next_step?: string | null
  status: 'open' | 'done' | 'snoozed' | 'none'
  follows_you?: boolean | null
  you_follow?: boolean | null
  follow?: 'none' | 'suggested' | 'approved' | 'done' | 'failed' | null
  dm_sent_at?: string | null
  last_touch_at?: string | null
}

export type RunState = 'running' | 'paused' | 'stopped'

export interface Limits {
  daily_cap: number // 10–38
  gap_min: number // seconds, 180
  gap_max: number // seconds, 240
  hour_cap: number // 5
  break_start: string // "13:00"
  break_minutes: number // 120
  day_start: string // "08:00"
  day_end: string // "23:00"
}

export interface Business {
  what: string // what you do, one line
  who: string // who you want to reach
  offer: string // the one thing to try
  link?: string // your link, with tracking
  tag?: string // your company handle, e.g. @yourco
  topics: string[]
}

export interface Profile {
  id: string
  onboarding_step: 'hello' | 'business' | 'list' | 'connect' | 'deal' | 'done'
  name: string
  x_handle?: string | null
  x_followers?: number | null
  timezone: string
  business: Business
  limits: Limits
  auto_post: boolean
  week1_auto?: boolean | null
  state: RunState
  stop_reason?: string | null
  stopped_at?: string | null
  started_at?: string | null // the ramp counts from here
  browser_status: 'unknown' | 'signed_in' | 'signed_out' | 'checkpoint'
  browser_checked_at?: string | null
  summary_time: string // "09:00"
  clock_schedule?: string | null
  voice: string[] // short rules, learned or told
  last_post_at?: string | null
  x_bio?: string | null
  last_note?: string | null
  learning_status?: 'idle' | 'running' | 'done' | null
  resumed_at?: string | null
  clock?: Record<string, unknown> | null
}

export interface Search {
  id: string
  kind: 'ask' | 'topic'
  label: string
  query: string
  active: boolean
  last_run_at?: string | null
  found_last?: number | null
}

export interface Activity {
  id: string
  at: string
  action: 'read' | 'reply' | 'answer' | 'like' | 'follow' | 'dm' | 'check' | 'stop' | 'skip' | 'summary'
  detail: string
  result?: 'ok' | 'warning' | 'failed' | null
  page_loads?: number | null
}

export interface Summary {
  id: string
  day: string // YYYY-MM-DD
  headline: string
  body: string // markdown
  numbers: { replies: number; views: number; author_replies: number; answered: number; people: number }
  idea?: { take: string; why: string; backups?: string[] } | null
  created_at: string
}

export interface Lesson {
  id: string
  rule: string
  applies_to?: string | null
  why?: string | null
  example?: string | null
  source: 'edit' | 'told' | 'lab'
  locked: boolean
  created_at: string
}
