/* Lists: their X Lists, each a custom feed, with Lemma's settings for it. Mode,
   share of the daily cap, voice notes, and whether their business may be mentioned.
   Kite suggests who to add or drop; nobody joins or leaves without them. */

import { useState } from 'react'
import { Check, ChevronDown, ExternalLink, Plus, Sparkles, UserMinus, X as XIcon } from 'lucide-react'
import { acceptMember, addMembers, createList, declineMember, patchList, removeMember, todaysCap, useStore } from '../lib/store'
import type { ListMember, ListMode, XList } from '../lib/types'
import { Avatar } from '../components/DraftCard'
import { ago, cx, k } from '../lib/ui'
import { SectionHead } from './Today'

export const MODES: { key: ListMode; label: string; note: string }[] = [
  { key: 'auto', label: 'Auto-reply', note: 'Replies go out on their own when auto-post is on' },
  { key: 'drafts', label: 'Drafts only', note: 'Every reply waits for your tap' },
  { key: 'like', label: 'Like only', note: 'Kite likes fresh posts, never replies' },
  { key: 'ideas', label: 'Ideas only', note: 'Read for your daily post idea; no replies, no likes' },
]

export function parseHandles(text: string) {
  return [
    ...new Set(
      text
        .split(/[\s,]+/)
        .map((h) => h.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '').split(/[/?]/)[0].trim())
        .filter((h) => /^[A-Za-z0-9_]{2,15}$/.test(h)),
    ),
  ]
}

export function Lists() {
  const lists = useStore((s) => s.lists)
  const members = useStore((s) => s.members)
  const p = useStore((s) => s.profile)!
  const { cap } = todaysCap(p)
  const total = lists.filter((l) => l.active).reduce((n, l) => n + (l.mode === 'like' || l.mode === 'ideas' ? 0 : l.cap_share), 0)
  const suggestions = members.filter((m) => m.status === 'suggested' || m.status === 'drop_suggested')
  const [adding, setAdding] = useState(false)

  return (
    <div className="mx-auto max-w-[860px] px-4 pt-6 sm:px-6 sm:pt-9">
      <h1 className="font-serif text-[38px] leading-none">Lists</h1>
      <p className="mt-2 max-w-[640px] text-[14.5px] text-ink-2">
        Each list is a private X List: one page shows every member's new posts. Kite reads one at a time, the one furthest behind its share. A mix matters: an off-topic list (a sport, a cause) keeps your account from looking like it only promotes.
      </p>

      {suggestions.length > 0 && (
        <section className="mt-6">
          <SectionHead title="Kite suggests" note="Nobody joins or leaves without you." count={suggestions.length} />
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((m) => (
              <Suggestion key={m.id} m={m} list={lists.find((l) => l.id === m.list_id)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 pb-6">
        <SectionHead
          title="Your lists"
          note={`Replying lists use ${total}% of today's ${cap}${total > 100 ? ": over 100%, the day's cap still wins" : ''}.`}
          count={lists.length}
        />
        <div className="space-y-3">
          {[...lists].sort((a, b) => Number(b.active) - Number(a.active) || b.cap_share - a.cap_share).map((l) => (
            <ListCard key={l.id} l={l} cap={cap} members={members.filter((m) => m.list_id === l.id && m.status === 'member')} />
          ))}
          {adding ? (
            <NewList onDone={() => setAdding(false)} />
          ) : (
            <button className="btn-glass press w-full" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden /> New list
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function Suggestion({ m, list }: { m: ListMember; list?: XList }) {
  const drop = m.status === 'drop_suggested'
  return (
    <article className="glass rise p-4">
      <div className="flex items-center gap-3">
        <Avatar name={m.name || m.handle} handle={m.handle} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{m.name || m.handle}</div>
          <div className="text-[13px] text-ink-3">
            @{m.handle}
            {m.followers ? ` · ${k(m.followers)}` : ''}
          </div>
        </div>
        <span className={cx('chip', drop ? 'chip-amber' : 'chip-blue')}>{drop ? `Drop from ${list?.name || 'list'}` : `Add to ${list?.name || 'list'}`}</span>
      </div>
      {m.why && <p className="mt-2.5 text-[13.5px] text-ink-2">{m.why}</p>}
      <div className="mt-3 flex gap-2">
        <button className="btn-ink press !min-h-10" onClick={() => acceptMember(m.id)}>
          {drop ? <UserMinus size={16} aria-hidden /> : <Plus size={16} aria-hidden />} {drop ? 'Drop' : 'Add'}
        </button>
        <button className="btn-quiet press" onClick={() => declineMember(m.id)}>
          {drop ? 'Keep' : 'Not now'}
        </button>
      </div>
    </article>
  )
}

function ListCard({ l, cap, members }: { l: XList; cap: number; members: ListMember[] }) {
  const [open, setOpen] = useState(false)
  const [voice, setVoice] = useState(l.voice || '')
  const [handles, setHandles] = useState('')
  const replies = l.mode === 'auto' || l.mode === 'drafts'
  const perDay = Math.ceil((cap * l.cap_share) / 100)
  const pending = members.filter((m) => !m.on_x).length
  return (
    <article className={cx('glass p-4 sm:p-5', !l.active && 'opacity-60')}>
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-semibold">{l.name}</h3>
            <span className={cx('chip', l.mode === 'auto' ? 'chip-blue' : l.mode === 'drafts' ? '' : 'chip-amber')}>{MODES.find((x) => x.key === l.mode)?.label}</span>
            {!l.may_mention && <span className="chip">Never mentions your business</span>}
            {l.x_status === 'to_create' && <span className="chip chip-amber">Kite makes it on X next</span>}
            {l.x_status === 'needs_you' && <span className="chip chip-coral">Needs you</span>}
          </div>
          <p className="mt-1 text-[13.5px] text-ink-2">
            {members.length} member{members.length === 1 ? '' : 's'}{pending ? ` (${pending} being added on X)` : ''}
            {replies ? ` · up to ${perDay} replies a day` : ''}
            {l.last_read_at ? ` · read ${ago(l.last_read_at)} ago` : ''}
          </p>
        </div>
        {l.x_list_id && (
          <a className="btn-quiet !min-h-9 !px-2.5" href={l.x_list_url || `https://x.com/i/lists/${l.x_list_id}`} target="_blank" rel="noreferrer" aria-label={`Open the ${l.name} list on X`}>
            <ExternalLink size={15} aria-hidden />
          </a>
        )}
        <button className="btn-quiet !min-h-9 !px-2.5" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Settings for ${l.name}`}>
          <ChevronDown size={17} className={cx('transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </header>

      {open && (
        <div className="mt-4 space-y-4 border-t border-black/5 pt-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">What Kite does here</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="Mode">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  role="radio"
                  aria-checked={l.mode === m.key}
                  onClick={() => patchList(l.id, { mode: m.key })}
                  className={cx('press rounded-2xl px-3 py-2 text-left text-[13.5px]', l.mode === m.key ? 'bg-white font-semibold shadow-[0_4px_12px_-6px_rgb(20_24_60/.45)]' : 'bg-white/40 text-ink-2 hover:bg-white/70')}
                >
                  {m.label}
                  <span className="mt-0.5 block text-[11.5px] font-normal leading-snug text-ink-3">{m.note}</span>
                </button>
              ))}
            </div>
          </div>

          {replies && (
            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-ink-2">Share of the daily cap</span>
                <span className="text-[13.5px] font-semibold tnum">
                  {l.cap_share}% · {perDay} a day
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={l.cap_share}
                onChange={(e) => patchList(l.id, { cap_share: Number(e.target.value) })}
                className="lrange mt-2"
                style={{ ['--p' as string]: `${((l.cap_share - 5) / 95) * 100}%` }}
              />
            </label>
          )}

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">May mention your business</div>
              <p className="text-[12.5px] text-ink-3">Your link, tag or offer, in at most 1 reply in 3. Keep it off for a sport or a cause.</p>
            </div>
            <button role="switch" aria-checked={l.may_mention} aria-label="May mention your business" className="lswitch scale-[.85]" onClick={() => patchList(l.id, { may_mention: !l.may_mention })} />
          </div>

          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink-2">Voice notes for this list</span>
            <textarea
              className="field min-h-[64px]"
              value={voice}
              placeholder="e.g. a fan, never work talk"
              onChange={(e) => setVoice(e.target.value)}
              onBlur={() => voice !== (l.voice || '') && patchList(l.id, { voice })}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Members</span>
            <ul className="divide-y divide-black/5 rounded-2xl bg-white/45">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 px-3 py-2">
                  <Avatar name={m.name || m.handle} handle={m.handle} size={28} />
                  <div className="min-w-0 flex-1 text-[13.5px]">
                    <span className="font-medium">{m.name || m.handle}</span>
                    <span className="text-ink-3">
                      {' '}
                      @{m.handle}
                      {m.signals?.our_replies ? ` · ${m.signals.our_replies} replies from you` : ''}
                      {m.signals?.best_views ? ` · best ${m.signals.best_views} views` : ''}
                    </span>
                  </div>
                  {!m.on_x && <span className="chip !h-5 !text-[11px]">adding</span>}
                  <button className="btn-quiet !min-h-8 !px-2" onClick={() => removeMember(m.id)} aria-label={`Remove ${m.handle}`}>
                    <XIcon size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input className="field !py-2.5" placeholder="Add handles: @someone @someone_else" value={handles} onChange={(e) => setHandles(e.target.value)} />
              <button
                className="btn-ink press !min-h-11 flex-none"
                disabled={!parseHandles(handles).length}
                onClick={() => {
                  void addMembers(l.id, parseHandles(handles))
                  setHandles('')
                }}
              >
                Add
              </button>
            </div>
          </div>

          <button className="btn-quiet" onClick={() => patchList(l.id, { active: !l.active })}>
            {l.active ? 'Pause this list' : 'Turn this list back on'}
          </button>
        </div>
      )}
    </article>
  )
}

function NewList({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<ListMode>('drafts')
  const [handles, setHandles] = useState('')
  const offTopic = mode === 'like' || mode === 'ideas'
  return (
    <article className="glass rise p-4 sm:p-5">
      <h3 className="text-[17px] font-semibold">A new list</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Name, e.g. Cricket" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" placeholder="What it's about" value={topic} onChange={(e) => setTopic(e.target.value)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="Mode">
        {MODES.map((m) => (
          <button key={m.key} role="radio" aria-checked={mode === m.key} onClick={() => setMode(m.key)} className={cx('press rounded-2xl px-3 py-2 text-[13.5px]', mode === m.key ? 'bg-white font-semibold' : 'bg-white/40 text-ink-2')}>
            {m.label}
          </button>
        ))}
      </div>
      <textarea className="field mt-3 min-h-[70px]" placeholder="Handles, one per line (or leave it for Kite to suggest)" value={handles} onChange={(e) => setHandles(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <button
          className="btn-ink press"
          disabled={!name.trim()}
          onClick={async () => {
            const id = await createList({ name: name.trim(), topic: topic.trim() || null, mode, cap_share: offTopic ? 5 : 20, may_mention: !offTopic && mode !== 'drafts' ? true : false })
            const hs = parseHandles(handles)
            if (hs.length) await addMembers(id, hs)
            onDone()
          }}
        >
          <Check size={16} aria-hidden /> Make it
        </button>
        <button className="btn-quiet" onClick={onDone}>
          Cancel
        </button>
      </div>
      <p className="mt-2 flex gap-1.5 text-[12.5px] text-ink-3">
        <Sparkles size={13} className="mt-0.5 flex-none" aria-hidden /> Kite makes it as a private List on X on its next run and adds people about 20 a day.
      </p>
    </article>
  )
}
