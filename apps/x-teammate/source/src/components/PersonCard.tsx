/* Someone who answered you, with the next step Kite suggests. */

import { ArrowUpRight, Check, UserPlus } from 'lucide-react'
import type { Person } from '../lib/types'
import { approveFollow, getState, markDone } from '../lib/store'
import { ago, cx, k } from '../lib/ui'
import { Avatar } from './DraftCard'

export const TIER: Record<string, { label: string; cls: string }> = {
  hot: { label: 'Wants to try it', cls: 'chip-coral' },
  question: { label: 'Asked a question', cls: 'chip-amber' },
  pushback: { label: 'Pushed back', cls: '' },
  agreement: { label: 'Agreed, added a point', cls: 'chip-blue' },
  ack: { label: 'Said thanks', cls: '' },
  ignore: { label: 'Ignored', cls: '' },
}

export function PersonCard({ p, delay = 0 }: { p: Person; delay?: number }) {
  const t = TIER[p.tier || 'ack']
  return (
    <article className="glass rise flex gap-3 p-4" style={{ animationDelay: `${delay}ms` }}>
      <Avatar name={p.name} handle={p.handle} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="font-semibold">{p.name}</span>
          <span className="text-[13.5px] text-ink-3">
            @{p.handle}
            {p.followers ? ` · ${k(p.followers)}` : ''}
            {p.said_at ? ` · ${ago(p.said_at)}` : ''}
          </span>
        </div>
        <span className={cx('chip mt-1.5', t.cls)}>{t.label}</span>
        {p.said && <p className="mt-2 text-[14.5px] leading-relaxed">“{p.said}”</p>}
        {p.next_step && (
          <p className="mt-2 text-[13.5px] text-ink-2">
            <span className="font-semibold text-ink">Next · </span>
            {p.next_step}
          </p>
        )}
        {p.follow === 'suggested' && (
          <button className="btn-glass press mt-2.5 !min-h-9 text-[13.5px]" onClick={() => approveFollow(p.id)}>
            <UserPlus size={15} aria-hidden /> Follow them
          </button>
        )}
        {p.follow === 'approved' && <span className="chip chip-blue mt-2.5">Follow on the next run</span>}
      </div>
      <div className="flex flex-none flex-col gap-1">
        <a href={getState().demo ? '#' : p.said_url || `https://x.com/${p.handle}`} target="_blank" rel="noreferrer" className="btn-quiet !min-h-9 !px-2.5" aria-label={`Open ${p.name} on X`}>
          <ArrowUpRight size={16} aria-hidden />
        </a>
        <button className="btn-quiet !min-h-9 !px-2.5" onClick={() => markDone(p.id)} aria-label="Mark done">
          <Check size={16} aria-hidden />
        </button>
      </div>
    </article>
  )
}
