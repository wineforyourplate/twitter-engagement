/* Today: the ring and the switch, then what needs you. People who answered you
   come first, then drafts waiting for you, then what's going out next. */

import { useEffect, useState } from 'react'
import { AlertTriangle, Coffee, Lock, PauseCircle, Play } from 'lucide-react'
import { Kite } from '../components/Kite'
import { Ring } from '../components/Ring'
import { DraftCard } from '../components/DraftCard'
import { PersonCard } from '../components/PersonCard'
import { hold, paceNow, pause, resume, setAutoPost, startOfDay, todaysCap, useStore } from '../lib/store'
import type { Profile, Reply } from '../lib/types'
import { addMinutes, ago, clock, cx } from '../lib/ui'

function useTick(ms = 30_000) {
  const [, set] = useState(0)
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(t)
  }, [ms])
}

function hello(tz: string) {
  const h = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: tz }))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/** When will each queued reply go out? 3–4 minutes apart, never in the break. */
function etas(p: Profile, queue: Reply[]) {
  const gap = ((p.limits.gap_min + p.limits.gap_max) / 2) * 1000
  const [bh, bm] = p.limits.break_start.split(':').map(Number)
  const breakStart = startOfDay(p.timezone).getTime() + (bh * 60 + bm) * 60_000
  const breakEnd = breakStart + p.limits.break_minutes * 60_000
  let t = Math.max(Date.now() + 60_000, (p.last_post_at ? new Date(p.last_post_at).getTime() : 0) + gap)
  return queue.map(() => {
    if (t >= breakStart && t < breakEnd) t = breakEnd + 60_000
    const at = t
    t += gap
    const m = Math.round((at - Date.now()) / 60000)
    if (m <= 1) return 'about a minute'
    if (m < 60) return `~${m} min`
    return `after the break, ${clock(new Date(at), p.timezone)}`
  })
}

function inBreak(p: Profile) {
  const now = clock(new Date(), p.timezone)
  const end = addMinutes(p.limits.break_start, p.limits.break_minutes)
  return now >= p.limits.break_start && now < end
}

export function Today() {
  useTick()
  const p = useStore((s) => s.profile)!
  const replies = useStore((s) => s.replies)
  const people = useStore((s) => s.people)
  const activity = useStore((s) => s.activity)
  const clockError = useStore((s) => s.clockError)

  const since = startOfDay(p.timezone).getTime()
  const sentToday = replies.filter((r) => r.status === 'posted' && r.kind !== 'dm' && r.posted_at && new Date(r.posted_at).getTime() >= since)
  const doneToday = sentToday.length
  const { cap, week } = todaysCap(p)
  const pace = paceNow(p, cap)
  const waiting = replies.filter((r) => r.status === 'waiting')
  const queue = replies
    .filter((r) => r.status === 'approved' || r.status === 'posting')
    .sort((a, b) => (a.kind === 'answer' ? -1 : 0) - (b.kind === 'answer' ? -1 : 0))
  const eta = etas(p, queue)
  const open = people.filter((x) => x.status === 'open' && x.tier && ['hot', 'question', 'pushback', 'agreement'].includes(x.tier))
  const stopped = p.state === 'stopped'
  const paused = p.state === 'paused'
  const resting = inBreak(p)
  const read = sentToday.filter((r) => r.readout?.views != null).map((r) => r.readout!.views!)
  const views = read.reduce((n, v) => n + v, 0)
  const median = read.length ? [...read].sort((a, b) => a - b)[Math.floor(read.length / 2)] : null

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6 sm:pt-8">
      {/* greeting */}
      <header className="mb-5 flex items-start gap-3 sm:items-center sm:gap-3.5">
        <Kite size={52} mood={stopped || paused ? 'still' : 'busy'} />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[30px] leading-[1.02] sm:text-[40px]">
            {hello(p.timezone)}, {p.name}
          </h1>
          <p className="mt-1.5 flex items-start gap-2 text-[13.5px] leading-snug text-ink-2 sm:items-center sm:text-[14.5px]">
            {stopped ? (
              <>Kite has stopped X for now. Nothing goes out until you resume.</>
            ) : paused ? (
              <>Paused by you. Kite still reads, nothing goes out.</>
            ) : resting ? (
              <>
                <Coffee size={15} aria-hidden /> On the daily break until {addMinutes(p.limits.break_start, p.limits.break_minutes)}. Drafts keep coming.
              </>
            ) : (
              <>
                <span className="h-2 w-2 flex-none rounded-full bg-mint live-dot" aria-hidden /> {p.last_note || activity[0]?.detail || 'Kite starts on its next run, within 15 minutes'}{!p.last_note && activity[0] ? ` · ${ago(activity[0].at)}` : ''}
              </>
            )}
          </p>
        </div>
        <a href="#/you" className={cx('chip hidden sm:inline-flex', p.browser_status === 'signed_in' ? 'chip-mint' : 'chip-coral')}>
          {p.x_handle ? `@${p.x_handle}` : 'X'} · {p.browser_status === 'signed_in' ? 'signed in' : p.browser_status === 'checkpoint' ? 'needs you' : 'not signed in'}
        </a>
      </header>

      {clockError && (
        <section className="glass mb-5 flex items-start gap-3 p-4" style={{ background: 'rgb(255 244 228 / .7)' }}>
          <AlertTriangle className="mt-0.5 flex-none text-amber-ink" size={20} aria-hidden />
          <p className="min-w-0 flex-1 text-[14.5px] text-ink-2">
            <b className="text-ink">Your clock couldn't start, so Kite won't run on its own yet.</b> Ask the pod's admin to give you the User role or above, then reopen the app. ({clockError})
          </p>
        </section>
      )}

      {stopped && (
        <section className="glass mb-5 flex flex-wrap items-start gap-3 p-4 sm:p-5" style={{ background: 'rgb(255 236 238 / .7)' }}>
          <AlertTriangle className="mt-0.5 flex-none text-coral-ink" size={20} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">X stopped {ago(p.stopped_at)} ago</p>
            <p className="mt-0.5 text-[14.5px] text-ink-2">{p.stop_reason}</p>
          </div>
          <button className="btn-ink press" onClick={resume}>
            <Play size={16} aria-hidden /> Resume
          </button>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* left: the ring, the switch, the day */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="glass p-5">
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
              <div className="flex justify-center">
                <Ring done={doneToday} cap={cap} pace={pace} size={196}>
                  <div>
                    <div className="font-serif text-[58px] leading-none tnum">{doneToday}</div>
                    <div className="mt-1 text-[13px] font-medium text-ink-3">of {cap} today</div>
                  </div>
                </Ring>
              </div>
              <dl className="grid flex-1 grid-cols-2 gap-2.5 text-[14px] sm:grid-cols-1 lg:mt-2 lg:grid-cols-2">
                <div>
                  <dt className="text-[12.5px] text-ink-3">Views on today's replies</dt>
                  <dd className="font-semibold tnum">{read.length ? `${views.toLocaleString()} · median ${median}` : 'Not read yet'}</dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-ink-3">Pace allows now</dt>
                  <dd className="font-semibold tnum">{pace} by {clock(new Date(), p.timezone)}</dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-ink-3">Daily break</dt>
                  <dd className="font-semibold tnum">
                    {p.limits.break_start}–{addMinutes(p.limits.break_start, p.limits.break_minutes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-ink-3">Spacing</dt>
                  <dd className="font-semibold">3–4 min apart</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* the switch */}
          <section className="glass p-5">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-semibold">Auto-post</h2>
                <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">
                  {week === 1 && !p.week1_auto
                    ? 'Off for your first week, while Kite learns your voice from what you approve.'
                    : p.auto_post
                      ? 'Replies on your auto-reply lists and answers to people who replied go out on their own.'
                      : 'Everything waits for your tap.'}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={p.auto_post && (week > 1 || !!p.week1_auto)}
                aria-label="Auto-post"
                className="lswitch"
                disabled={(week === 1 && !p.week1_auto) || stopped}
                onClick={() => setAutoPost(!p.auto_post)}
              />
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white/50 px-3 py-2.5 text-[12.5px] leading-snug text-ink-2">
              <Lock size={14} className="mt-0.5 flex-none" aria-hidden />
              Posts found by search, DMs and follows always wait for you. X doesn't allow automated replies to posts found by keyword search.
            </p>
          </section>

          {!stopped && (
            <button className="btn-quiet w-full justify-center" onClick={paused ? resume : pause}>
              {paused ? <Play size={16} aria-hidden /> : <PauseCircle size={16} aria-hidden />}
              {paused ? 'Resume X' : 'Pause everything on X'}
            </button>
          )}
        </aside>

        {/* right: what needs you */}
        <main className="min-w-0 space-y-7 pb-4">
          {open.length > 0 && (
            <section>
              <SectionHead title="Answered you" note="People first. They spoke to you." count={open.length} />
              <div className="space-y-3">
                {open.map((x, i) => (
                  <PersonCard key={x.id} p={x} delay={i * 60} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead title="Waiting for you" note={p.auto_post ? 'Search finds, DMs and drafts-only lists. Auto-reply lists go out on their own.' : 'Approve, edit or skip.'} count={waiting.length} />
            {waiting.length ? (
              <div className="space-y-3">
                {waiting
                  .sort((a, b) => (a.kind === 'dm' ? -1 : 0) - (b.kind === 'dm' ? -1 : 0))
                  .map((r, i) => (
                    <DraftCard key={r.id} r={r} delay={i * 60} />
                  ))}
              </div>
            ) : (
              <Empty text="Nothing waiting. Kite drafts more when your list posts." />
            )}
          </section>

          <section>
            <SectionHead title="Going out next" note="One at a time, 3–4 minutes apart, re-checked for freshness first." count={queue.length} />
            {queue.length ? (
              <div className="space-y-3">
                {queue.map((r, i) => (
                  <DraftCard key={r.id} r={r} queued eta={eta[i]} onHold={() => hold(r.id)} delay={i * 60} />
                ))}
              </div>
            ) : (
              <Empty text="Nothing in line." />
            )}
          </section>

          <section>
            <SectionHead title="What Kite did" />
            <ul className="glass divide-y divide-black/5 px-4 py-1">
              {activity.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-baseline gap-3 py-2.5 text-[14px]">
                  <span className="w-12 flex-none text-[12.5px] text-ink-3 tnum">{ago(a.at)}</span>
                  <span className={cx('min-w-0 flex-1', a.result === 'warning' && 'text-coral-ink')}>{a.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  )
}

export function SectionHead({ title, note, count }: { title: string; note?: string; count?: number }) {
  return (
    <div className="mb-2.5 flex items-baseline gap-2 px-1">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {count != null && count > 0 && <span className="chip tnum">{count}</span>}
      {note && <span className="ml-auto hidden text-right text-[13px] text-ink-3 sm:block">{note}</span>}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="glass glass-soft px-5 py-6 text-center text-[14.5px] text-ink-2">{text}</div>
}
