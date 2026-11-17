/* You: your account, your business, how Kite writes, your searches, and the
   limits. Every limit says why it's set where it is. */

import { useState } from 'react'
import { BadgeCheck, Lock, Pause, Play, Search as SearchIcon } from 'lucide-react'
import { SignInButton } from '../components/SignIn'
import { patchProfile, pause, resume, setLimits, toggleSearch, todaysCap, useStore } from '../lib/store'
import type { Business } from '../lib/types'
import { addMinutes, ago, cx } from '../lib/ui'

const SOURCE: Record<string, string> = { edit: 'your edit', told: 'you told me', lab: 'the lab' }

function Card({ title, note, children, id }: { title: string; note?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="glass p-5 sm:p-6">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      {note && <p className="mt-0.5 text-[13.5px] text-ink-2">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Why({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{children}</p>
}

export function You() {
  const p = useStore((s) => s.profile)!
  const lessons = useStore((s) => s.lessons)
  const searches = useStore((s) => s.searches)
  const { cap, week } = todaysCap(p)
  const [biz, setBiz] = useState<Business>(p.business)
  const dirty = JSON.stringify(biz) !== JSON.stringify(p.business)
  const L = p.limits

  return (
    <div className="mx-auto max-w-[760px] space-y-4 px-4 pt-6 pb-6 sm:px-6 sm:pt-9">
      <h1 className="font-serif text-[38px] leading-none">You</h1>

      <Card title="Your X account" note="One person, one account. Kite works only in your own Lemma browser, signed in by you.">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cx('chip', p.browser_status === 'signed_in' ? 'chip-mint' : 'chip-coral')}>
            <BadgeCheck size={13} aria-hidden /> @{p.x_handle} · {p.browser_status === 'signed_in' ? `signed in, checked ${ago(p.browser_checked_at)} ago` : 'signed out'}
          </span>
          <SignInButton />
          <span className="ml-auto" />
          {p.state === 'running' ? (
            <button className="btn-quiet press" onClick={pause}>
              <Pause size={15} aria-hidden /> Pause X
            </button>
          ) : (
            <button className="btn-ink press !min-h-10" onClick={resume}>
              <Play size={15} aria-hidden /> Resume X
            </button>
          )}
        </div>
        <Why>You type your password in your browser; Kite never sees it. At any warning, captcha or "unusual activity" page, Kite stops everything on X and tells you once.</Why>
      </Card>

      <Card title="Your business" note="Kite reads this before every draft. It's how a reply knows what you offer and to whom.">
        <div className="grid gap-3">
          {(
            [
              ['what', 'What you do', 'One line, the way you\'d say it to a client'],
              ['who', 'Who you want to reach', 'The people whose posts matter to you'],
              ['offer', 'The one thing to try', 'What Kite points interested people to'],
              ['link', 'Your link', 'With tracking, so you can count clicks'],
              ['tag', 'Your company handle', 'Tagged in at most 1 reply in 3'],
            ] as const
          ).map(([key, label, ph]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[13px] font-semibold text-ink-2">{label}</span>
              <input className="field" value={(biz[key] as string) || ''} placeholder={ph} onChange={(e) => setBiz({ ...biz, [key]: e.target.value })} />
            </label>
          ))}
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Topics</span>
            <div className="flex flex-wrap gap-1.5">
              {biz.topics.map((t) => (
                <span key={t} className="chip chip-blue">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {dirty && (
            <div className="flex gap-2">
              <button className="btn-ink press" onClick={() => patchProfile({ business: biz })}>
                Save
              </button>
              <button className="btn-quiet press" onClick={() => setBiz(p.business)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card title="How Kite writes for you" note="Rules from your edits and what you told Kite. Locked ones are yours; Kite never changes them.">
        <ul className="space-y-1.5 text-[14.5px]">
          {p.voice.map((v) => (
            <li key={v} className="flex gap-2">
              <span className="text-ink-3">·</span> {v}
            </li>
          ))}
        </ul>
        <h3 className="mt-5 mb-2 text-[14px] font-semibold">What your edits taught Kite</h3>
        {!lessons.length && (
          <p className="rounded-2xl bg-white/50 px-3.5 py-3 text-[13.5px] text-ink-2">
            Nothing yet. When you edit or skip a draft, or tell Kite a rule, it writes down what it learned here. Lock one to make it yours for good.
          </p>
        )}
        <ul className="space-y-2.5">
          {lessons.map((l) => (
            <li key={l.id} className="rounded-2xl bg-white/55 px-3.5 py-3">
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1 text-[14.5px] font-medium">{l.rule}</span>
                {l.locked && <Lock size={14} className="mt-1 text-ink-3" aria-label="locked" />}
                <span className={cx('chip !h-5 !text-[11.5px]', l.source === 'lab' ? '' : 'chip-blue')}>{SOURCE[l.source] || l.source}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-ink-3">
                {[l.applies_to, l.why].filter(Boolean).join(' · ')}
              </p>
              {l.example && <p className="mt-1 text-[13px] text-ink-2">{l.example}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Your searches" note="Your list is read every 30–45 minutes. Searches run 2–3 times a day, asks first.">
        <ul className="divide-y divide-black/5">
          {searches.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <SearchIcon size={15} className="flex-none text-ink-3" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14.5px] font-medium">
                  {s.label} <span className={cx('chip !h-5 !text-[11.5px]', s.kind === 'ask' ? 'chip-coral' : '')}>{s.kind === 'ask' ? 'Ask' : 'Topic'}</span>
                </div>
                <div className="truncate text-[12.5px] text-ink-3">
                  {s.last_run_at ? `ran ${ago(s.last_run_at)} ago · found ${s.found_last ?? 0}` : 'not run yet'}
                </div>
              </div>
              <button role="switch" aria-checked={s.active} aria-label={`Search: ${s.label}`} className="lswitch scale-[.8]" onClick={() => toggleSearch(s.id, !s.active)} />
            </li>
          ))}
        </ul>
        <Why>In the lab, one answered ask outperformed topic replies 4 to 50 times, so asks run first in every search.</Why>
      </Card>

      <Card title="Limits" note="Checked by code before every action. They protect your account's reach.">
        <label className="block">
          <div className="flex items-baseline justify-between">
            <span className="text-[14.5px] font-semibold">Replies a day</span>
            <span className="font-serif text-[26px] leading-none tnum">{L.daily_cap}</span>
          </div>
          <input
            type="range"
            min={10}
            max={38}
            value={L.daily_cap}
            onChange={(e) => setLimits({ daily_cap: Number(e.target.value) })}
            className="lrange mt-3"
            style={{ ['--p' as string]: `${((L.daily_cap - 10) / 28) * 100}%` }}
          />
          <Why>
            About 38 a day reached people in the lab (about 38 views each). At 76–100 a day in bursts, views fell to 13 and X hid every reply. {week < 3 && `Your account is in week ${week}, so today's cap is ${cap}.`}
          </Why>
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink-2">Daily break</span>
            <select className="field" value={L.break_start} onChange={(e) => setLimits({ break_start: e.target.value })}>
              {['11:00', '12:00', '13:00', '14:00', '15:00'].map((t) => (
                <option key={t} value={t}>
                  {t}–{addMinutes(t, L.break_minutes)}
                </option>
              ))}
            </select>
            <Why>Two hours a day with nothing going out, like a person at lunch.</Why>
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink-2">Your summary</span>
            <select className="field" value={p.summary_time} onChange={(e) => patchProfile({ summary_time: e.target.value })}>
              {['07:00', '08:00', '09:00', '18:00', '21:00'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Why>One message a day, in the app and by email.</Why>
          </label>
        </div>

        <ul className="mt-5 grid gap-2 text-[13.5px] sm:grid-cols-2">
          {[
            ['3–4 minutes apart', 'Never a burst. Bursts drew 1–24 views; spaced replies 10–30.'],
            [`At most ${L.hour_cap} an hour`, 'And by any hour, 1.5 an hour from your start, plus 2.'],
            ['Posts under 2 hours (list) or 3 hours (search)', 'Later replies get little reach. Asks stay useful for a day.'],
            ['A link or tag in 1 reply in 3 at most', 'None in your first week. Every-reply links read as a bot.'],
            ['Reach check every 3 hours', 'If 10 replies in a row sit at 5 views or fewer, Kite stops and tells you.'],
            ['30 likes, 5 follows, 5 DMs a day', 'Likes only on replies to you. Follows and DMs only with your tap.'],
          ].map(([a, b]) => (
            <li key={a} className="rounded-2xl bg-white/50 px-3.5 py-2.5">
              <div className="font-semibold">{a}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{b}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
