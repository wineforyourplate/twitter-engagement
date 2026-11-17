/* One draft: the post, why Kite picked it, the reply, and your three buttons.
   Waiting drafts get Approve / Edit / Skip. Queued ones (approved by you or by
   auto-post) show when they go out, with Hold and Edit. */

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Clock, Eye, Heart, MessageCircle, Pencil, Sparkles, X } from 'lucide-react'
import type { Reply } from '../lib/types'
import { approve, saveEdit, skip, useStore } from '../lib/store'
import { LANE, MENTION, ago, cx, hue, initials, k, until } from '../lib/ui'

export function Avatar({ name, handle, size = 40 }: { name: string; handle: string; size?: number }) {
  return (
    <div
      className="grid flex-none place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: hue(handle), fontSize: size * 0.36, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .6), 0 4px 10px -6px rgb(20 24 60 / .5)' }}
      aria-hidden
    >
      <span style={{ textShadow: '0 1px 2px rgb(0 0 0 / .18)' }}>{initials(name)}</span>
    </div>
  )
}

function Fresh({ r }: { r: Reply }) {
  if (!r.fresh_until) return null
  const left = (new Date(r.fresh_until).getTime() - Date.now()) / 60000
  const urgent = left < 45
  return (
    <span className={cx('chip', urgent ? 'chip-coral' : 'chip-mint')} title="Kite only replies while the post is fresh">
      <Clock size={12} strokeWidth={2.2} aria-hidden />
      fresh for {until(r.fresh_until)}
    </span>
  )
}

export function DraftCard({ r, queued, eta, onHold, delay = 0 }: { r: Reply; queued?: boolean; eta?: string; onHold?: () => void; delay?: number }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(r.text || r.draft)
  const box = useRef<HTMLTextAreaElement>(null)
  useEffect(() => setText(r.text || r.draft), [r.text, r.draft])
  useEffect(() => {
    if (editing && box.current) {
      box.current.focus()
      box.current.style.height = 'auto'
      box.current.style.height = box.current.scrollHeight + 'px'
    }
  }, [editing])
  const listName = useStore((s) => s.lists.find((l) => l.id === r.list_id)?.name)
  const lane = r.lane === 'list' && listName ? { label: listName, cls: 'chip-blue' } : LANE[r.lane] || LANE.topic
  const isDm = r.kind === 'dm'
  const body = r.text || r.draft
  const len = (editing ? text : body).length
  const firstLine = (editing ? text : body).split('\n')[0].length

  return (
    <article className="glass rise p-4 sm:p-5" style={{ animationDelay: `${delay}ms` }}>
      {/* who and when */}
      <header className="flex items-start gap-3">
        <Avatar name={r.author_name} handle={r.author_handle} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate font-semibold">{r.author_name}</span>
            <span className="truncate text-[13.5px] text-ink-3">
              @{r.author_handle}
              {r.author_followers ? ` · ${k(r.author_followers)}` : ''}
              {r.post_at ? ` · ${ago(r.post_at)}` : ''}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={cx('chip', lane.cls)}>{isDm ? 'DM' : lane.label}</span>
            {!isDm && <Fresh r={r} />}
            {queued && r.approved_by === 'auto' && <span className="chip chip-blue">Auto-post</span>}
          </div>
        </div>
        <a href={r.post_url} target="_blank" rel="noreferrer" className="btn-quiet -mr-2 -mt-1 !min-h-9 !px-2.5 text-[13px]" aria-label="Open the post on X">
          <ArrowUpRight size={16} aria-hidden />
        </a>
      </header>

      {/* their post */}
      <div className="well mt-3 px-3.5 py-3 text-[14.5px] leading-relaxed text-ink-2">
        {isDm && <span className="mb-1 block text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">They said</span>}
        <p className="line-clamp-4 whitespace-pre-line">{r.post_text}</p>
        {r.post_stats && (
          <div className="mt-2 flex gap-3.5 text-[12.5px] text-ink-3">
            {r.post_stats.views != null && (
              <span className="inline-flex items-center gap-1">
                <Eye size={13} aria-hidden /> {k(r.post_stats.views)}
              </span>
            )}
            {r.post_stats.likes != null && (
              <span className="inline-flex items-center gap-1">
                <Heart size={13} aria-hidden /> {k(r.post_stats.likes)}
              </span>
            )}
            {r.post_stats.replies != null && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={13} aria-hidden /> {r.post_stats.replies}
              </span>
            )}
          </div>
        )}
      </div>

      {/* why */}
      <p className="mt-2.5 flex items-start gap-2 text-[13.5px] text-ink-2">
        <Sparkles size={15} className="mt-0.5 flex-none text-blue" aria-hidden />
        <span>{r.why}</span>
      </p>

      {r.error && <p className="mt-2.5 rounded-2xl bg-amber-tint px-3 py-2 text-[13px] text-amber-ink">{r.error}</p>}

      {/* the reply */}
      <div className="bubble mt-3 px-4 py-3">
        <div className="mb-1 flex items-center justify-between text-[12.5px] font-semibold text-ink-3">
          <span>{isDm ? 'Your DM' : r.kind === 'answer' ? 'Your answer' : 'Your reply'}</span>
          <span className="tnum font-medium" title="X folds long replies after the first line">
            {MENTION[r.mention]} · {len} chars{!isDm && firstLine > 270 ? ' · first line long' : ''}
          </span>
        </div>
        {editing ? (
          <textarea
            ref={box}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            className="block w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none"
            rows={3}
            aria-label="Edit the reply"
          />
        ) : (
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{body}</p>
        )}
      </div>

      {/* actions */}
      <footer className="mt-3.5 flex flex-wrap items-center gap-2">
        {queued ? (
          <>
            <span className="mr-auto inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2">
              <span className="h-2 w-2 rounded-full bg-blue live-dot" aria-hidden />
              {eta ? `Goes out in ${eta}` : 'Next in line'}
            </span>
            {editing ? (
              <button className="btn-ink press" onClick={() => (saveEdit(r.id, text), setEditing(false))}>
                <Check size={17} aria-hidden /> Save
              </button>
            ) : (
              <button className="btn-quiet press" onClick={() => setEditing(true)}>
                <Pencil size={15} aria-hidden /> Edit
              </button>
            )}
            <button className="btn-glass press" onClick={onHold}>
              Hold
            </button>
          </>
        ) : (
          <>
            <button className="btn-ink press" onClick={() => approve(r.id, editing ? text : undefined)}>
              <Check size={17} aria-hidden /> {isDm ? 'Send it' : 'Approve'}
            </button>
            {editing ? (
              <button className="btn-quiet press" onClick={() => (setText(r.text || r.draft), setEditing(false))}>
                Cancel edit
              </button>
            ) : (
              <button className="btn-glass press" onClick={() => setEditing(true)}>
                <Pencil size={15} aria-hidden /> Edit
              </button>
            )}
            <button className="btn-quiet press ml-auto" onClick={() => skip(r.id)}>
              <X size={16} aria-hidden /> Skip
            </button>
          </>
        )}
      </footer>
    </article>
  )
}
