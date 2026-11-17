/* Onboarding: five screens, about four minutes. Each step is saved, so a reload
   picks up where they left off. Kite can't read X until they sign in, so pasted
   handles are saved straight away, and "find people" and "learn my voice" start the
   moment the sign-in lands. It ends by switching on their own clock. */

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, LogIn, ShieldCheck, Sparkles, X as XIcon } from 'lucide-react'
import { Kite } from '../components/Kite'
import { addMembers, createList, getState, patchProfile, useStore } from '../lib/store'
import { parseHandles } from '../app/Lists'
import type { Business, Profile } from '../lib/types'
import { cx } from '../lib/ui'
import * as live from '../lib/live'
import { lemma } from '../lemma-client'

const STEPS = ['hello', 'business', 'list', 'connect', 'deal'] as const
type Step = (typeof STEPS)[number]

const isDemo = () => getState().demo

export function Onboarding({ onDone }: { onDone: () => void }) {
  const p = useStore((s) => s.profile)!
  const saved = (STEPS as readonly string[]).includes(p.onboarding_step) ? (p.onboarding_step as Step) : 'hello'
  const [step, setStepLocal] = useState<Step>(saved)
  const i = STEPS.indexOf(step)
  const setStep = (s: Step) => {
    setStepLocal(s)
    void patchProfile({ onboarding_step: s })
  }
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, i + 1)])
  const back = () => i > 0 && setStep(STEPS[i - 1])
  const [wantFind, setWantFind] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pt-6 pb-10 sm:pt-10">
      <div className="glass glass-soft mb-6 flex w-full max-w-[560px] items-center gap-2 px-3 py-2" style={{ borderRadius: 999 }}>
        <button className="btn-quiet !min-h-8 !px-2" onClick={back} disabled={i === 0} aria-label="Back">
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div className="flex flex-1 gap-1.5" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((s, j) => (
            <span key={s} className={cx('h-1.5 flex-1 rounded-full transition-colors', j <= i ? 'bg-blue' : 'bg-black/10')} />
          ))}
        </div>
        <span className="px-2 text-[12.5px] font-medium text-ink-3 tnum">
          {i + 1}/{STEPS.length}
        </span>
      </div>

      <div key={step} className="rise w-full max-w-[560px]">
        {step === 'hello' && <Hello next={next} />}
        {step === 'business' && <BusinessStep p={p} next={next} />}
        {step === 'list' && <ListStep p={p} next={next} wantFind={wantFind} setWantFind={setWantFind} />}
        {step === 'connect' && <Connect p={p} next={next} wantFind={wantFind} />}
        {step === 'deal' && <Deal p={p} onDone={onDone} />}
      </div>
    </div>
  )
}

function Hello({ next }: { next: () => void }) {
  return (
    <Screen
      kite={112}
      eyebrow="Twitter Engagement"
      title="Hi, I'm Kite."
      lead="I find the conversations on X where your work fits, draft replies in your voice, and answer people who answer you. At a human pace, and nothing goes out until you say so."
    >
      <ul className="space-y-2 text-[14.5px] text-ink-2">
        {['Replies to fresh posts from people worth knowing', 'Answers for everyone who replies to you, within 2 hours', 'One summary a day: who warmed up, what to do next'].map((t) => (
          <li key={t} className="flex gap-2">
            <Check size={17} className="mt-0.5 flex-none text-blue" aria-hidden /> {t}
          </li>
        ))}
      </ul>
      <Primary onClick={next}>Begin</Primary>
    </Screen>
  )
}

function BusinessStep({ p, next }: { p: Profile; next: () => void }) {
  const [b, setB] = useState<Business>(() => ({ ...({ topics: [], what: '', who: '', offer: '' } as Business), ...(p.business || {}) }))
  const [topics, setTopics] = useState((b.topics || []).join(', '))
  const ready = (b.what || '').trim().length > 3 && (b.who || '').trim().length > 2 && topics.trim().length > 1
  const save = () => {
    void patchProfile({ business: { ...b, topics: topics.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8) } })
    next()
  }
  const f = (key: keyof Business, label: string, ph: string, hint?: string) => (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between text-[13px] font-semibold text-ink-2">
        {label}
        {hint && <span className="font-normal text-ink-3">{hint}</span>}
      </span>
      <input className="field" value={(b[key] as string) || ''} placeholder={ph} onChange={(e) => setB({ ...b, [key]: e.target.value })} />
    </label>
  )
  return (
    <Screen title="What do you do, and for whom?" lead="I use this in every reply. Once you sign in, I'll read your bio and recent posts and fill in anything you leave out.">
      <div className="space-y-3">
        {f('what', 'What you do', 'e.g. I run a studio that builds AI automations for agencies')}
        {f('who', 'Who you want to reach', 'e.g. agency owners and ops leads')}
        {f('offer', 'The one thing to try', 'e.g. a free 20-minute teardown of one workflow', 'For people who say they\'re interested')}
        <label className="block">
          <span className="mb-1 flex items-baseline justify-between text-[13px] font-semibold text-ink-2">
            Your topics <span className="font-normal text-ink-3">Comma-separated, 2 to 5</span>
          </span>
          <input className="field" value={topics} placeholder="client reporting, agency operations, AI agents at work" onChange={(e) => setTopics(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {f('link', 'Your link', 'yoursite.com', 'Optional')}
          {f('tag', 'Company handle', '@yourco', 'Optional')}
        </div>
      </div>
      <Primary onClick={save} disabled={!ready}>
        That's me
      </Primary>
    </Screen>
  )
}

function ListStep({ p, next, wantFind, setWantFind }: { p: Profile; next: () => void; wantFind: boolean; setWantFind: (v: boolean) => void }) {
  const lists = useStore((s) => s.lists)
  const topics = p.business?.topics || []
  const [name, setName] = useState(lists[0]?.name || (topics[0] ? topics[0].replace(/^./, (c) => c.toUpperCase()) : 'My field'))
  const [handles, setHandles] = useState('')
  const [hobby, setHobby] = useState(false)
  const [hobbyName, setHobbyName] = useState('')
  const [hobbyHandles, setHobbyHandles] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = parseHandles(handles)
  const save = async () => {
    setBusy(true)
    try {
      if (!lists.length) {
        const id = await createList({ name: name.trim() || 'My field', topic: topics.join(', ') || null, mode: 'auto', cap_share: 80, may_mention: true })
        if (parsed.length) await addMembers(id, parsed)
      } else if (parsed.length) await addMembers(lists[0].id, parsed)
      if (hobby && hobbyName.trim()) {
        const id = await createList({ name: hobbyName.trim(), mode: 'like', cap_share: 5, may_mention: false, voice: 'a fan, never work talk' })
        const hs = parseHandles(hobbyHandles)
        if (hs.length) await addMembers(id, hs)
      }
      next()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Screen title="Who should I read all day?" lead="Your lists are private X Lists: one page shows every member's new posts. About 7 in 10 replies come from them. Mid-size accounts in your world work best, because they answer back.">
      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-ink-2">Your first list</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Agency ops" />
      </label>
      <textarea className="field mt-2 min-h-[100px]" placeholder={'Paste handles or links, one per line\n@someone\n@someone_else'} value={handles} onChange={(e) => setHandles(e.target.value)} />
      <p className="mt-1.5 text-[12.5px] text-ink-3">{parsed.length ? `${parsed.length} to add` : 'Add 10 to 40 people. You can change this any time, on Lists.'}</p>
      <button className={cx('btn-glass press mt-3 w-full', wantFind && '!bg-white')} onClick={() => setWantFind(!wantFind)}>
        {wantFind ? <Check size={16} className="text-mint-ink" aria-hidden /> : <Sparkles size={16} className="text-blue" aria-hidden />}
        {wantFind ? "I'll suggest people right after you sign in" : 'Find people for me from my topics'}
      </button>
      <p className="mt-3 rounded-2xl bg-white/50 px-3.5 py-2.5 text-[13px] leading-snug text-ink-2">
        Why not the biggest names? In our tests, 114 replies to the biggest writers drew 1 reply back. They get hundreds of replies in the first hour.
      </p>

      <div className="mt-4 rounded-2xl bg-white/55 p-3.5">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold">Add an off-topic list</div>
            <p className="text-[12.5px] leading-snug text-ink-3">A sport, a hobby, a cause. I only like posts there and never mention your business. It keeps your account from looking like it only promotes.</p>
          </div>
          <button role="switch" aria-checked={hobby} aria-label="Add an off-topic list" className="lswitch scale-[.85]" onClick={() => setHobby(!hobby)} />
        </div>
        {hobby && (
          <div className="mt-3 space-y-2">
            <input className="field" placeholder="Name, e.g. Cricket" value={hobbyName} onChange={(e) => setHobbyName(e.target.value)} />
            <textarea className="field min-h-[70px]" placeholder="Handles (optional)" value={hobbyHandles} onChange={(e) => setHobbyHandles(e.target.value)} />
          </div>
        )}
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">I'll also search, 2–3 times a day</span>
        <div className="flex flex-wrap gap-1.5">
          <span className="chip chip-coral">People asking for help with what you do</span>
          {topics.map((t) => (
            <span key={t} className="chip chip-blue">
              {t}
            </span>
          ))}
        </div>
      </div>
      <Primary onClick={() => void save()} disabled={busy || (!parsed.length && !wantFind && !lists.length)}>
        {busy ? 'Saving…' : 'Use these'}
      </Primary>
    </Screen>
  )
}

function Connect({ p, next, wantFind }: { p: Profile; next: () => void; wantFind: boolean }) {
  const [conv, setConv] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const signedIn = p.browser_status === 'signed_in'

  // poll for Kite's sign-in hand-off and for the profile to say signed in
  useEffect(() => {
    if (!conv || signedIn || isDemo()) return
    const t = setInterval(async () => {
      try {
        setLink(await live.pendingSignIn(conv))
        await live.refresh('profile')
      } catch {
        /* keep polling */
      }
    }, 2500)
    return () => clearInterval(t)
  }, [conv, signedIn])

  // the moment they're in, start learning (and finding people, if they asked)
  useEffect(() => {
    if (!signedIn || isDemo() || sessionStorage.getItem('xt.learn')) return
    sessionStorage.setItem('xt.learn', '1')
    void live.task('[onboarding] learn')
    if (wantFind) void live.task('[onboarding] find-people')
  }, [signedIn, wantFind])

  const start = async () => {
    if (isDemo()) return void patchProfile({ browser_status: 'signed_in', x_handle: 'maya_automates' })
    setWaiting(true)
    try {
      setConv(await live.task('[onboarding] sign-in'))
    } catch {
      setWaiting(false)
    }
  }

  return (
    <Screen title="Sign in to X, in your own browser" lead="I work in a private Lemma browser that's yours alone. You type your password there; I never see it. Sign out any time.">
      <div className="glass glass-strong flex items-center gap-3 p-4">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-ink text-white">
          <XIcon size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{signedIn ? `@${p.x_handle || 'you'}` : link ? 'Your browser is ready' : waiting ? 'Opening your browser…' : 'Not signed in yet'}</div>
          <div className="text-[13px] text-ink-3">{signedIn ? 'Signed in. I can read your list and replies now.' : link ? 'Sign in there, then come back here.' : 'One account per person. Yours.'}</div>
        </div>
        {signedIn ? (
          <span className="chip chip-mint">
            <Check size={13} aria-hidden /> Done
          </span>
        ) : link ? (
          <a className="btn-ink press" href={link} target="_blank" rel="noreferrer">
            <ExternalLink size={16} aria-hidden /> Sign in to X
          </a>
        ) : (
          <button className="btn-ink press" onClick={() => void start()} disabled={waiting}>
            {waiting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <LogIn size={16} aria-hidden />} {waiting ? 'Opening' : 'Sign in'}
          </button>
        )}
      </div>
      <p className="mt-3 flex gap-2 text-[13px] leading-snug text-ink-2">
        <ShieldCheck size={16} className="mt-0.5 flex-none text-mint-ink" aria-hidden />
        If X ever shows a warning, a captcha or "unusual activity", I stop everything and tell you. I never try to get past it.
      </p>
      <Primary onClick={next} disabled={!signedIn}>
        Continue
      </Primary>
      {!signedIn && (
        <button className="btn-quiet mx-auto mt-2 flex" onClick={next}>
          Do it later
        </button>
      )}
    </Screen>
  )
}

function Deal({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [week1Auto, setWeek1Auto] = useState(!!p.week1_auto)
  const [busy, setBusy] = useState(false)
  const start = async () => {
    setBusy(true)
    await patchProfile({ onboarding_step: 'done', started_at: new Date().toISOString(), state: 'running', week1_auto: week1Auto, auto_post: false })
    if (!isDemo()) {
      await tuneSearches(p)
      if (!import.meta.env.DEV || new URLSearchParams(location.search).has('clock')) await live.ensureClock()
    }
    onDone()
  }
  return (
    <Screen title="How we'll work" lead="Slow and steady keeps your replies seen. Here's the deal.">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass glass-strong p-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-[.08em] text-ink-3">Your side</h3>
          <ul className="mt-2 space-y-1.5 text-[14px]">
            <li>About 5 minutes a day</li>
            <li>Approve, edit or skip drafts</li>
            <li>Tap Send on DMs you want to send</li>
          </ul>
        </div>
        <div className="glass glass-strong p-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-[.08em] text-ink-3">My side</h3>
          <ul className="mt-2 space-y-1.5 text-[14px]">
            <li>At most 10 replies a day this week, then 18, then up to 30</li>
            <li>3–4 minutes apart, never a burst</li>
            <li>A 2-hour break every day</li>
            <li>Only posts under 2–3 hours old</li>
            <li>I stop and tell you if your replies stop being seen</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white/55 p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold">Let me auto-post in week 1</div>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
              {week1Auto
                ? "You can switch auto-post on from today. The 10-a-day cap still applies, and search finds still wait for you."
                : "Recommended off: you approve everything this week while I learn your voice from what you approve. Auto-post unlocks next week."}
            </p>
          </div>
          <button role="switch" aria-checked={week1Auto} aria-label="Allow auto-post in week 1" className="lswitch" onClick={() => setWeek1Auto(!week1Auto)} />
        </div>
      </div>
      <Primary onClick={() => void start()} disabled={busy}>
        {busy ? 'Starting…' : 'Start'}
      </Primary>
    </Screen>
  )
}

/** Point the starter searches at their own topics. */
async function tuneSearches(p: Profile) {
  const topics = (p.business?.topics || []).map((t) => (t.includes(' ') ? `"${t}"` : t))
  if (!topics.length) return
  const words = topics.join(' OR ')
  for (const s of getState().searches) {
    if (s.query.includes('"AI agents" OR automation')) {
      await lemma.records.update('searches', s.id, { query: s.query.replace('"AI agents" OR automation', words) })
    }
  }
  void live.refresh('searches')
}

function Screen({ title, lead, kite = 64, eyebrow, children }: { title: string; lead: string; kite?: number; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex justify-center">
        <Kite size={kite} />
      </div>
      {eyebrow && <p className="mb-2 text-center text-[12.5px] font-semibold uppercase tracking-[.12em] text-blue-ink">{eyebrow}</p>}
      <h1 className="text-center font-serif text-[38px] leading-[1.05] sm:text-[44px]">{title}</h1>
      <p className="mx-auto mt-3 max-w-[480px] text-center text-[15.5px] leading-relaxed text-ink-2">{lead}</p>
      <div className="glass mt-6 p-5 sm:p-6">{children}</div>
    </div>
  )
}

function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="btn-ink press mt-5 w-full !min-h-12 text-[16px]" onClick={onClick} disabled={disabled}>
      {children} <ArrowRight size={17} aria-hidden />
    </button>
  )
}
