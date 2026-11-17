/* One store for the app. Screens read it with useStore(selector) and change it
   only through the actions below. Each action is one record write on the pod
   (live.ts); in the demo it changes memory only. */

import { useSyncExternalStore } from 'react'
import type { Activity, Lesson, Limits, ListMember, Person, Profile, Reply, Search, Summary, XList } from './types'

export interface State {
  ready: boolean
  demo: boolean
  profile: Profile | null
  replies: Reply[]
  people: Person[]
  lists: XList[]
  members: ListMember[]
  searches: Search[]
  activity: Activity[]
  summaries: Summary[]
  lessons: Lesson[]
  toast: { id: number; text: string; undo?: () => void } | null
  clockError?: string | null
}

let state: State = {
  ready: false,
  demo: false,
  profile: null,
  replies: [],
  people: [],
  lists: [],
  members: [],
  searches: [],
  activity: [],
  summaries: [],
  lessons: [],
  toast: null,
}
const subs = new Set<() => void>()

export function getState() {
  return state
}
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...p }
  subs.forEach((f) => f())
}
function subscribe(f: () => void) {
  subs.add(f)
  return () => void subs.delete(f)
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state))
}

/* ---- the writer: the demo writes memory, live writes the pod ---------------- */

export interface Writer {
  update(table: string, id: string, patch: Record<string, unknown>): Promise<void>
  create(table: string, row: Record<string, unknown>): Promise<string>
  remove(table: string, id: string): Promise<void>
}
let writer: Writer = {
  async update() {},
  async create() {
    return Math.random().toString(36).slice(2)
  },
  async remove() {},
}
export function setWriter(w: Writer) {
  writer = w
}

let toastN = 0
export function toast(text: string, undo?: () => void) {
  const id = ++toastN
  setState({ toast: { id, text, undo } })
  setTimeout(() => {
    if (state.toast?.id === id) setState({ toast: null })
  }, 4200)
}

const now = () => new Date().toISOString()

function patchReply(id: string, patch: Partial<Reply>) {
  setState((s) => ({ replies: s.replies.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  return writer.update('replies', id, patch as Record<string, unknown>)
}
function patchPerson(id: string, patch: Partial<Person>) {
  setState((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  return writer.update('people', id, patch as Record<string, unknown>)
}
export function patchProfile(patch: Partial<Profile>) {
  const p = state.profile
  if (!p) return Promise.resolve()
  setState({ profile: { ...p, ...patch } })
  return writer.update('profile', p.id, patch as Record<string, unknown>)
}

/* ---- replies ----------------------------------------------------------------- */

export function approve(id: string, text?: string) {
  const r = state.replies.find((x) => x.id === id)
  if (!r) return
  const edited = text != null && text.trim() !== r.draft.trim()
  void patchReply(id, {
    status: 'approved',
    approved_by: 'you',
    approved_at: now(),
    ...(edited ? { text: text!.trim() } : {}),
  })
  toast(r.kind === 'dm' ? 'DM approved. Kite sends it on the next run.' : edited ? 'Approved with your edit. Kite will learn from it.' : 'Approved. It goes out in its turn.', () =>
    patchReply(id, { status: 'waiting', approved_by: null, approved_at: null }),
  )
}

export function skip(id: string) {
  const r = state.replies.find((x) => x.id === id)
  if (!r) return
  const prev = r.status
  void patchReply(id, { status: 'skipped' })
  toast('Skipped. Kite notes why posts like this miss.', () => patchReply(id, { status: prev }))
}

export function saveEdit(id: string, text: string) {
  return patchReply(id, { text })
}

/** Take a queued reply back out of the line: it waits for you again. */
export function hold(id: string) {
  void patchReply(id, { status: 'waiting', approved_by: null, approved_at: null })
  toast('Held. It waits for you now.', () => patchReply(id, { status: 'approved', approved_by: 'you', approved_at: now() }))
}

/* ---- people ------------------------------------------------------------------ */

/* ---- lists ------------------------------------------------------------------- */

export function patchList(id: string, patch: Partial<XList>) {
  setState((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
  return writer.update('lists', id, patch as Record<string, unknown>)
}
function patchMember(id: string, patch: Partial<ListMember>) {
  setState((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  return writer.update('list_members', id, patch as Record<string, unknown>)
}
export async function createList(row: Partial<XList> & { name: string }) {
  const full = { mode: 'drafts', cap_share: 20, may_mention: false, active: true, x_status: 'to_create', ...row } as XList
  const id = await writer.create('lists', full as unknown as Record<string, unknown>)
  setState((s) => ({ lists: s.lists.some((l) => l.id === id) ? s.lists : [...s.lists, { ...full, id }] }))
  return id
}
export async function addMembers(listId: string, handles: string[]) {
  const have = new Set(state.members.filter((m) => m.list_id === listId).map((m) => m.handle.toLowerCase()))
  for (const handle of handles.filter((h) => !have.has(h.toLowerCase()))) {
    const row = { handle, name: handle, list_id: listId, status: 'member', why: 'You added them', on_x: false } as ListMember
    const id = await writer.create('list_members', row as unknown as Record<string, unknown>)
    setState((s) => ({ members: s.members.some((m) => m.id === id) ? s.members : [...s.members, { ...row, id }] }))
  }
}
export function acceptMember(id: string) {
  const m = state.members.find((x) => x.id === id)
  if (!m) return
  if (m.status === 'drop_suggested') {
    void patchMember(id, { status: 'removed' })
    toast('Dropped. Kite takes them off the List on X.')
  } else {
    void patchMember(id, { status: 'member' })
    toast('Added. Kite puts them on the List on X (about 20 a day).')
  }
}
export function declineMember(id: string) {
  const m = state.members.find((x) => x.id === id)
  if (!m) return
  void patchMember(id, { status: m.status === 'drop_suggested' ? 'member' : 'removed' })
  toast(m.status === 'drop_suggested' ? 'Kept.' : "Not now. Kite won't suggest them again this month.")
}
export function removeMember(id: string) {
  void patchMember(id, { status: 'removed' })
  toast('Removed. Kite takes them off the List on X.')
}
export function approveFollow(id: string) {
  void patchPerson(id, { follow: 'approved' })
  toast('Kite follows them on its next people run (5 a day at most).')
}
export function markDone(id: string) {
  void patchPerson(id, { status: 'done' })
}

/* ---- the switch and the stop -------------------------------------------------- */

export function setAutoPost(on: boolean) {
  void patchProfile({ auto_post: on })
  if (!on) {
    // what auto-post queued but hasn't sent goes back to you
    for (const r of state.replies.filter((x) => x.status === 'approved' && x.approved_by === 'auto'))
      void patchReply(r.id, { status: 'waiting', approved_by: null, approved_at: null })
  }
  toast(on ? 'Auto-post is on. List replies and answers go out on their own.' : 'Auto-post is off. Everything waits for you.')
}
export function resume() {
  void patchProfile({ state: 'running', stop_reason: null, stopped_at: null, resumed_at: new Date().toISOString() })
  toast('Resumed. Kite starts slow: one reply, then checks it shows.')
}
export function pause() {
  void patchProfile({ state: 'paused' })
  toast('Paused. Nothing goes out on X until you resume.')
}
export function setLimits(patch: Partial<Limits>) {
  const p = state.profile
  if (!p) return
  void patchProfile({ limits: { ...p.limits, ...patch } })
}
export function toggleSearch(id: string, active: boolean) {
  setState((s) => ({ searches: s.searches.map((x) => (x.id === id ? { ...x, active } : x)) }))
  void writer.update('searches', id, { active })
}

/* ---- derived numbers -------------------------------------------------------- */

export function startOfDay(tz: string) {
  // midnight in the person's time zone, as an instant
  const now = new Date()
  const local = new Date(now.toLocaleString('en-US', { timeZone: tz }))
  const diff = now.getTime() - local.getTime()
  local.setHours(0, 0, 0, 0)
  return new Date(local.getTime() + diff)
}

/** Today's cap after the new-account ramp: week 1 → 10, week 2 → 18, then the setting. */
export function todaysCap(p: Profile) {
  const started = p.started_at ? new Date(p.started_at).getTime() : Date.now()
  const days = Math.floor((Date.now() - started) / 86_400_000)
  if (days < 7) return { cap: Math.min(10, p.limits.daily_cap), week: 1 }
  if (days < 14) return { cap: Math.min(18, p.limits.daily_cap), week: 2 }
  return { cap: p.limits.daily_cap, week: 3 }
}

/** How many replies the pace allows by now: 1.5 an hour from your day's start, plus 2. */
export function paceNow(p: Profile, cap: number) {
  const [h, m] = p.limits.day_start.split(':').map(Number)
  const start = startOfDay(p.timezone).getTime() + (h * 60 + m) * 60_000
  const hours = Math.max(0, (Date.now() - start) / 3_600_000)
  return Math.min(cap, Math.floor(1.5 * hours + 2))
}
