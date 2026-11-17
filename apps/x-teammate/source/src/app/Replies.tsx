/* Replies: everything Kite drafted and posted, by state, with what each one drew. */

import { useState } from 'react'
import { ArrowUpRight, Eye, Heart, MessageCircle, Reply as ReplyIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Reply } from '../lib/types'
import { DraftCard, Avatar } from '../components/DraftCard'
import { LANE, ago, cx, k } from '../lib/ui'
import { Empty } from './Today'

const TABS = [
  { key: 'waiting', label: 'Waiting', match: (r: Reply) => r.status === 'waiting' },
  { key: 'queue', label: 'Going out', match: (r: Reply) => r.status === 'approved' || r.status === 'posting' },
  { key: 'posted', label: 'Posted', match: (r: Reply) => r.status === 'posted' },
  { key: 'other', label: 'Skipped', match: (r: Reply) => ['skipped', 'expired', 'failed'].includes(r.status) },
] as const

export function Replies() {
  const replies = useStore((s) => s.replies)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('posted')
  const t = TABS.find((x) => x.key === tab)!
  const rows = replies.filter(t.match).sort((a, b) => String(b.posted_at || b.created_at).localeCompare(String(a.posted_at || a.created_at)))
  const posted = replies.filter((r) => r.status === 'posted' && r.readout?.views != null)
  const views = posted.map((r) => r.readout!.views!).sort((a, b) => a - b)
  const median = views.length ? views[Math.floor(views.length / 2)] : 0
  const authors = posted.filter((r) => r.readout?.author_replied).length

  return (
    <div className="mx-auto max-w-[860px] px-4 pt-6 sm:px-6 sm:pt-9">
      <h1 className="font-serif text-[38px] leading-none">Replies</h1>
      <p className="mt-2 text-[14.5px] text-ink-2">
        Read back an hour after posting and again the next day. Median <b className="tnum">{median}</b> views over the last {posted.length} read · {authors} author{authors === 1 ? '' : 's'} replied.
      </p>

      <div className="glass mt-5 inline-flex gap-1 p-1.5" role="tablist" style={{ borderRadius: 999 }}>
        {TABS.map((x) => {
          const n = replies.filter(x.match).length
          return (
            <button
              key={x.key}
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={cx('press rounded-full px-4 py-2 text-[14px] font-medium', tab === x.key ? 'bg-white text-ink shadow-[0_4px_12px_-6px_rgb(20_24_60/.45)]' : 'text-ink-2 hover:text-ink')}
            >
              {x.label} <span className="tnum text-ink-3">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-3 pb-6">
        {!rows.length && <Empty text="Nothing here yet." />}
        {tab === 'waiting' && rows.map((r) => <DraftCard key={r.id} r={r} />)}
        {tab === 'queue' && rows.map((r) => <DraftCard key={r.id} r={r} queued />)}
        {(tab === 'posted' || tab === 'other') && (
          <ul className="glass divide-y divide-black/5">
            {rows.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Row({ r }: { r: Reply }) {
  const listName = useStore((s) => s.lists.find((l) => l.id === r.list_id)?.name)
  const lane = r.lane === 'list' && listName ? { label: listName, cls: 'chip-blue' } : LANE[r.lane] || LANE.topic
  const o = r.readout
  return (
    <li className="flex gap-3 px-4 py-3.5">
      <Avatar name={r.author_name} handle={r.author_handle} size={34} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-[13.5px]">
          <span className="font-semibold">{r.author_name}</span>
          <span className="text-ink-3">
            @{r.author_handle} · {k(r.author_followers)}
          </span>
          <span className={cx('chip !h-5 !text-[11.5px]', lane.cls)}>{lane.label}</span>
          {r.approved_by === 'auto' && <span className="chip !h-5 !text-[11.5px] chip-blue">Auto</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-[14.5px]">{r.text || r.draft}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3.5 text-[12.5px] text-ink-3">
          {r.status === 'posted' ? (
            <>
              <span>{ago(r.posted_at)} ago</span>
              {o?.views != null ? (
                <>
                  <span className={cx('inline-flex items-center gap-1', o.views <= 5 && 'font-semibold text-coral-ink')}>
                    <Eye size={13} aria-hidden /> {o.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart size={13} aria-hidden /> {o.likes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={13} aria-hidden /> {o.replies ?? 0}
                  </span>
                  {o.author_replied && (
                    <span className="chip chip-mint !h-5 !text-[11.5px]">
                      <ReplyIcon size={11} aria-hidden /> Author replied
                    </span>
                  )}
                </>
              ) : (
                <span>Not read yet</span>
              )}
            </>
          ) : (
            <span>{r.status === 'expired' ? 'Expired: the post got too old before it could go out' : r.status === 'failed' ? r.error || 'Failed' : 'Skipped'}</span>
          )}
        </div>
      </div>
      {r.reply_url && (
        <a href={r.reply_url} target="_blank" rel="noreferrer" className="btn-quiet !min-h-9 !px-2.5 self-start" aria-label="Open the reply on X">
          <ArrowUpRight size={16} aria-hidden />
        </a>
      )}
    </li>
  )
}
