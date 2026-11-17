/* People: everyone who answered you, hottest first, with the next step. Who Kite
   reads all day lives on Lists. */

import { useStore } from '../lib/store'
import { PersonCard } from '../components/PersonCard'
import { Avatar } from '../components/DraftCard'
import { TIER } from '../components/PersonCard'
import { ago, cx, k } from '../lib/ui'
import { Empty, SectionHead } from './Today'

const ORDER = ['hot', 'question', 'pushback', 'agreement', 'ack', 'ignore']

export function People() {
  const people = useStore((s) => s.people)
  const rank = (t?: string | null) => ORDER.indexOf(t || 'ack')
  const open = people.filter((p) => p.status === 'open').sort((a, b) => rank(a.tier) - rank(b.tier))
  const done = people.filter((p) => p.status !== 'open' && p.tier).slice(0, 30)

  return (
    <div className="mx-auto max-w-[860px] px-4 pt-6 sm:px-6 sm:pt-9">
      <h1 className="font-serif text-[38px] leading-none">People</h1>
      <p className="mt-2 max-w-[620px] text-[14.5px] text-ink-2">
        Everyone who answered you. They're worth more than anything else Kite does, so they come first: a like, one plain answer, and a DM drafted for your tap when someone wants to try what you offer.
      </p>

      <section className="mt-6">
        <SectionHead title="Open" note="Hot first, then questions." count={open.length} />
        {open.length ? (
          <div className="space-y-3">
            {open.map((p, i) => (
              <PersonCard key={p.id} p={p} delay={i * 50} />
            ))}
          </div>
        ) : (
          <Empty text="Nobody waiting on you." />
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-8 pb-6">
          <SectionHead title="Handled" />
          <ul className="glass divide-y divide-black/5">
            {done.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={p.name} handle={p.handle} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold">{p.name}</div>
                  <div className="truncate text-[12.5px] text-ink-3">
                    @{p.handle}
                    {p.followers ? ` · ${k(p.followers)}` : ''}
                    {p.said ? ` · "${p.said}"` : ''}
                  </div>
                </div>
                <span className={cx('chip', TIER[p.tier || 'ack']?.cls)}>{TIER[p.tier || 'ack']?.label}</span>
                <span className="w-10 text-right text-[12.5px] text-ink-3">{ago(p.said_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
