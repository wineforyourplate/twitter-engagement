/* The live pod: load this person's rows, keep them fresh, write through, make sure
   their own clock exists, and talk to Kite. Every table is private to the signed-in
   person (RLS), so every list here is only their rows. */

import { lemma } from '../lemma-client'
import { getState, setState, setWriter, type State } from './store'
import type { Profile } from './types'

const TABLES: { key: keyof State; table: string; sort?: string; limit?: number }[] = [
  { key: 'profile', table: 'profile', limit: 1 },
  { key: 'replies', table: 'replies', sort: 'created_at', limit: 300 },
  { key: 'people', table: 'people', sort: 'updated_at', limit: 300 },
  { key: 'lists', table: 'lists', sort: 'created_at', limit: 50 },
  { key: 'members', table: 'list_members', sort: 'created_at', limit: 1000 },
  { key: 'searches', table: 'searches', limit: 50 },
  { key: 'activity', table: 'activity', sort: 'at', limit: 40 },
  { key: 'summaries', table: 'summaries', sort: 'day', limit: 14 },
  { key: 'lessons', table: 'lessons', sort: 'created_at', limit: 100 },
]

function norm<T>(r: unknown): T {
  const row = r as Record<string, unknown>
  if (row && typeof row.data === 'object' && row.data) {
    const o = { ...(row.data as Record<string, unknown>) }
    for (const k of ['id', 'created_at', 'updated_at', 'user_id']) if (row[k] != null && o[k] == null) o[k] = row[k]
    return o as T
  }
  return row as T
}

async function load(t: (typeof TABLES)[number]) {
  const page = (await lemma.records.list(t.table, {
    limit: t.limit ?? 100,
    sort: t.sort ? [{ field: t.sort, direction: 'desc' }] : undefined,
  })) as unknown as { items?: unknown[] }
  const rows = (page.items || []).map((r) => norm<Record<string, unknown>>(r))
  if (t.key === 'profile') return { profile: (rows[0] as unknown as Profile) || null }
  return { [t.key]: rows } as Partial<State>
}

let inFlight: Promise<void> | null = null
/** Re-read one table, or all of them (one full re-read at a time). */
export async function refresh(only?: string) {
  if (only) {
    const t = TABLES.find((x) => x.table === only)
    if (t) setState(await load(t))
    return
  }
  inFlight ??= Promise.all(TABLES.map(load))
    .then((parts) => setState(Object.assign({}, ...parts)))
    .finally(() => (inFlight = null))
  return inFlight
}

export async function run(fn: string, input: Record<string, unknown> = {}) {
  const r = (await lemma.functions.run(fn, { input })) as unknown as { output_data?: Record<string, unknown> }
  return r?.output_data ?? null
}

export const myTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
export const userId = () => (lemma.auth.getState().user as { id?: string } | null)?.id || ''
export const userName = () => (lemma.auth.getState().user as { name?: string } | null)?.name || ''

/** Boot: rows exist (setup_me), first load, writer, fresh on focus and on a heartbeat. */
export async function startLive() {
  await lemma.auth.checkAuth()
  await run('setup_me', { timezone: myTimezone(), name: (userName() || '').split(' ')[0] || null })
  await refresh()
  setWriter({
    async update(table, id, patch) {
      await lemma.records.update(table, id, patch)
      void refresh(table)
    },
    async create(table, row) {
      const r = (await lemma.records.create(table, row)) as Record<string, unknown>
      void refresh(table)
      return String((norm<Record<string, unknown>>(r) as { id?: string }).id || '')
    },
    async remove(table, id) {
      await lemma.records.delete(table, id)
      void refresh(table)
    },
  })
  setState({ ready: true, demo: false })
  const tick = () => document.visibilityState === 'visible' && void refresh()
  document.addEventListener('visibilitychange', tick)
  window.addEventListener('focus', tick)
  window.setInterval(tick, 25_000)
  // `npm run dev` talks to a real pod: never make a clock from a dev build unless asked (?clock)
  if (!import.meta.env.DEV || new URLSearchParams(location.search).has('clock')) void ensureClock()
}

/* ---- each person's own clock ----------------------------------------------------
   A timed schedule runs as the person who owns it, and every table is private to
   its owner, so one shared timer would only ever see one person's rows. The bundle
   ships `clock` switched off, as a template; each person gets their own switched-on
   copy, `clock-u<first 8 of their id>`, visible only to them, on their time zone. */

interface ScheduleRow {
  id: string
  name?: string | null
  user_id?: string
  is_active?: boolean
  workflow_name?: string | null
  config?: Record<string, unknown>
}

export async function ensureClock(): Promise<string> {
  try {
    const r = await makeClock()
    setState({ clockError: null })
    return r
  } catch (e) {
    const msg = String((e as Error)?.message || e)
    setState({ clockError: msg })
    return msg
  }
}

async function makeClock(): Promise<string> {
  const p = getState().profile
  const me = userId()
  if (!p || p.onboarding_step !== 'done' || !me) return 'not yet'
  const name = `clock-u${me.replace(/-/g, '').slice(0, 8)}`
  const page = (await lemma.schedules.list({ scheduleType: 'TIME' as never, limit: 200 })) as unknown as { items?: ScheduleRow[] }
  const all = page.items || []
  const template = all.find((s) => s.name === 'clock')
  const mine = all.find((s) => s.name === name && (!s.user_id || s.user_id === me))
  const config: Record<string, unknown> = { cron: '*/15 * * * *', max_concurrent_runs: 1, ...(template?.config || {}), timezone: p.timezone || myTimezone() }
  if (!mine) {
    const made = (await lemma.schedules.create({
      name,
      schedule_type: 'TIME' as never,
      workflow_name: template?.workflow_name || 'tick',
      config,
      visibility: 'PERSONAL',
    })) as unknown as ScheduleRow
    if (p.clock_schedule !== made.id) await lemma.records.update('profile', p.id, { clock_schedule: made.id })
    return 'made'
  }
  if (mine.is_active === false || mine.config?.timezone !== config.timezone || mine.config?.cron !== config.cron) {
    await lemma.schedules.update(mine.id, { config, is_active: true } as never)
  }
  if (p.clock_schedule !== mine.id) await lemma.records.update('profile', p.id, { clock_schedule: mine.id })
  return 'ok'
}

/* ---- talking to Kite ------------------------------------------------------------ */

const AGENT = 'kite'

/** A background job in its own conversation, so it never queues behind the chat. */
export async function task(text: string) {
  const c = await lemma.conversations.createForAgent(AGENT, { title: text.slice(0, 80) })
  await lemma.conversations.appendMessage(c.id, { content: text })
  return c.id
}

interface Msg {
  role: string
  kind: string
  text?: string | null
  tool_name?: string | null
  tool_call_id?: string | null
  created_at: string
  sequence?: number
}

async function messages(conversationId: string) {
  const page = (await lemma.conversations.messages.list(conversationId, { limit: 100 })) as unknown as { items?: Msg[] }
  return (page.items || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
}

/** Where the person signs in, when Kite asked them to (browser_sign_in). */
export async function pendingSignIn(conversationId: string): Promise<string | null> {
  const ms = await messages(conversationId)
  const returned = new Set(ms.filter((m) => m.kind === 'TOOL_RETURN').map((m) => m.tool_call_id))
  const ask = ms.filter((m) => m.kind === 'TOOL_CALL' && m.tool_name === 'browser_sign_in' && m.tool_call_id && !returned.has(m.tool_call_id)).pop()
  if (!ask) return null
  const base = new URL((lemma as unknown as { authUrl?: string }).authUrl || location.origin).origin
  return `${base}/sign-in-to-site/${conversationId}/${ask.tool_call_id}`
}

let chatId: string | null = null
/** One chat with Kite about what's on screen. Resolves with Kite's reply. */
export async function ask(text: string, viewing: string): Promise<string> {
  if (!chatId) chatId = (await lemma.conversations.createForAgent(AGENT, { title: 'Ask Kite' })).id
  const before = (await messages(chatId)).length
  await lemma.conversations.appendMessage(chatId, { content: `[App] [Viewing: ${viewing}] ${text}` })
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const c = (await lemma.conversations.get(chatId)) as unknown as { status?: string }
    const ms = await messages(chatId)
    const reply = ms.slice(before).filter((m) => m.role !== 'user' && m.kind === 'TEXT' && m.text).pop()
    const running = /RUNNING|PENDING|QUEUED|STREAMING/i.test(String(c.status || ''))
    if (reply && !running) {
      void refresh()
      return reply.text as string
    }
  }
  return 'Still working on it. I will update the rows when I am done.'
}
