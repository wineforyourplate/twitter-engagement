import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarDays, ListChecks, MessagesSquare, ScrollText, SlidersHorizontal, Users, Undo2 } from 'lucide-react'
import { Dock, type DockItem } from './components/Dock'
import { AskKite } from './components/AskKite'
import { Kite } from './components/Kite'
import { Today } from './app/Today'
import { Replies } from './app/Replies'
import { People } from './app/People'
import { Lists } from './app/Lists'
import { Summary } from './app/Summary'
import { You } from './app/You'
import { Onboarding } from './onboarding/Onboarding'
import { getState, setState, useStore } from './lib/store'
import { demoActivity, demoLessons, demoLists, demoMembers, demoPeople, demoProfile, demoReplies, demoSearches, demoSummaries } from './lib/demo'
import { cx } from './lib/ui'
import { ask, startLive } from './lib/live'
import './styles.css'

type Page = 'today' | 'replies' | 'lists' | 'people' | 'summary' | 'you' | 'onboarding'
const PAGES: Page[] = ['today', 'replies', 'lists', 'people', 'summary', 'you', 'onboarding']
const parse = (): Page => {
  const p = location.hash.replace(/^#\/?/, '').split('?')[0] as Page
  return PAGES.includes(p) ? p : 'today'
}
const go = (p: Page) => (location.hash = `/${p}`)

const DEMO = new URLSearchParams(location.search).has('demo')

function Toast() {
  const t = useStore((s) => s.toast)
  if (!t) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        key={t.id}
        className="rise pointer-events-auto flex items-center gap-3 rounded-full py-2 pr-2 pl-4 text-[14px] text-white"
        style={{ background: 'rgb(18 20 28 / .78)', backdropFilter: 'blur(20px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .2), 0 14px 30px -12px rgb(0 0 0 / .5)' }}
        role="status"
      >
        {t.text}
        {t.undo && (
          <button
            className="press inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/25"
            onClick={() => {
              t.undo?.()
              setState({ toast: null })
            }}
          >
            <Undo2 size={14} aria-hidden /> Undo
          </button>
        )}
      </div>
    </div>
  )
}

/** Demo only: flip the states worth seeing (stopped, week 1) without real data. */
function DemoBar({ page }: { page: Page }) {
  const p = useStore((s) => s.profile)
  if (!p) return null
  const stopped = p.state === 'stopped'
  const week1 = p.started_at && Date.now() - new Date(p.started_at).getTime() < 7 * 86_400_000
  const set = (patch: object) => setState({ profile: { ...p, ...patch } })
  return (
    <div className="sticky top-0 z-20 flex justify-center px-3 pt-2">
      <div className="glass glass-soft no-bar flex max-w-full items-center gap-1 overflow-x-auto px-2 py-1 text-[12.5px] whitespace-nowrap" style={{ borderRadius: 999 }}>
        <span className="px-2 font-semibold text-ink-3">Example data</span>
        <button className={cx('rounded-full px-2.5 py-1', page === 'onboarding' ? 'bg-white' : 'hover:bg-white/60')} onClick={() => go(page === 'onboarding' ? 'today' : 'onboarding')}>
          Onboarding
        </button>
        <button
          className={cx('rounded-full px-2.5 py-1', stopped ? 'bg-white' : 'hover:bg-white/60')}
          onClick={() =>
            set(
              stopped
                ? { state: 'running', stop_reason: null, stopped_at: null }
                : {
                    state: 'stopped',
                    stopped_at: new Date(Date.now() - 18 * 60000).toISOString(),
                    stop_reason:
                      'Your last 10 replies have 5 views or fewer each, which usually means X is hiding them. Post one reply by hand, check it from a logged-out browser, then press Resume. Kite restarts slowly.',
                  },
            )
          }
        >
          Reach stop
        </button>
        <button
          className={cx('rounded-full px-2.5 py-1', week1 ? 'bg-white' : 'hover:bg-white/60')}
          onClick={() => set({ started_at: new Date(Date.now() - (week1 ? 19 : 2) * 86_400_000).toISOString(), auto_post: !!week1 })}
        >
          Week 1
        </button>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>(parse)
  useEffect(() => {
    const f = () => {
      setPage(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const replies = useStore((s) => s.replies)
  const people = useStore((s) => s.people)
  const waiting = replies.filter((r) => r.status === 'waiting').length + people.filter((p) => p.status === 'open' && p.tier === 'hot').length
  const suggest = useStore((s) => s.members.filter((m) => m.status === 'suggested' || m.status === 'drop_suggested').length)

  const items: DockItem[] = [
    { key: 'today', label: 'Today', icon: CalendarDays, dot: waiting > 0 && page !== 'today' },
    { key: 'replies', label: 'Replies', icon: MessagesSquare },
    { key: 'lists', label: 'Lists', icon: ListChecks, dot: suggest > 0 && page !== 'lists' },
    { key: 'people', label: 'People', icon: Users },
    { key: 'summary', label: 'Summary', icon: ScrollText },
    { key: 'you', label: 'You', icon: SlidersHorizontal },
  ]

  const profile = useStore((s) => s.profile)
  if (profile && (page === 'onboarding' || (!DEMO && profile.onboarding_step !== 'done')))
    return (
      <div className="sky min-h-dvh">
        {DEMO && <DemoBar page={page} />}
        <Onboarding onDone={() => go('today')} />
        <Toast />
      </div>
    )

  return (
    <div className="sky min-h-dvh">
      {DEMO && <DemoBar page={page} />}
      <main className="pb-32">
        {page === 'today' && <Today />}
        {page === 'replies' && <Replies />}
        {page === 'lists' && <Lists />}
        {page === 'people' && <People />}
        {page === 'summary' && <Summary />}
        {page === 'you' && <You />}
      </main>
      <Dock items={items} active={page} onChange={(k) => go(k as Page)} />
      <AskKite page={page} send={DEMO ? undefined : ask} />
      <Toast />
    </div>
  )
}

function Boot() {
  const ready = useStore((s) => s.ready)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!DEMO) {
      startLive().catch((e) => setErr(String((e as Error)?.message || e)))
      return
    }
    if (DEMO && !getState().ready)
      setState({
        ready: true,
        demo: true,
        profile: demoProfile(),
        replies: demoReplies(),
        people: demoPeople(),
        lists: demoLists(),
        members: demoMembers(),
        searches: demoSearches(),
        activity: demoActivity(),
        summaries: demoSummaries(),
        lessons: demoLessons(),
      })
  }, [])
  if (!ready)
    return (
      <div className="sky grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex justify-center">
            <Kite size={64} mood={err ? 'still' : 'busy'} />
          </div>
          <p className="text-ink-2">{err ? `Couldn't load your teammate: ${err}` : 'Getting your day ready…'}</p>
          {err && (
            <button className="btn-ink press mt-4" onClick={() => location.reload()}>
              Try again
            </button>
          )}
        </div>
      </div>
    )
  return <App />
}

const w = window as unknown as { __xtRoot?: ReturnType<typeof createRoot> }
w.__xtRoot ??= createRoot(document.getElementById('root')!)
w.__xtRoot.render(
  <React.StrictMode>
    <Boot />
  </React.StrictMode>,
)
