/* The daily summary: the day in one page, plus one post idea from what Kite read. */

import { useState } from 'react'
import { Copy, Lightbulb } from 'lucide-react'
import { toast, useStore } from '../lib/store'
import { cx } from '../lib/ui'

/** A small, safe markdown reader: ## headings, - and 1. lists, **bold**. */
function Md({ text }: { text: string }) {
  const out: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const L = list.ordered ? 'ol' : 'ul'
    out.push(
      <L key={out.length}>
        {list.items.map((t, i) => (
          <li key={i}>{inline(t)}</li>
        ))}
      </L>,
    )
    list = null
  }
  for (const line of text.split('\n')) {
    const h = line.match(/^##\s+(.*)/)
    const b = line.match(/^\s*-\s+(.*)/)
    const n = line.match(/^\s*\d+\.\s+(.*)/)
    if (h) {
      flush()
      out.push(<h2 key={out.length}>{h[1]}</h2>)
    } else if (b || n) {
      const ordered = !!n
      if (!list || list.ordered !== ordered) {
        flush()
        list = { ordered, items: [] }
      }
      list.items.push((b || n)![1])
    } else if (line.trim()) {
      flush()
      out.push(<p key={out.length}>{inline(line)}</p>)
    }
  }
  flush()
  return <div className="doc">{out}</div>
}
function inline(t: string) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part))
}

export function Summary() {
  const summaries = useStore((s) => s.summaries)
  const [i, setI] = useState(0)
  const s = summaries[i]
  if (!s)
    return (
      <div className="mx-auto max-w-[760px] px-4 pt-9">
        <h1 className="font-serif text-[38px]">Summary</h1>
        <p className="text-ink-2">Your first summary arrives at your summary time tomorrow.</p>
      </div>
    )
  const date = new Date(s.day + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="mx-auto max-w-[760px] px-4 pt-6 sm:px-6 sm:pt-9">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[.08em] text-ink-3">{i === 0 ? 'Today' : date}</p>
          <h1 className="mt-1 font-serif text-[34px] leading-[1.05] sm:text-[40px]">{s.headline}</h1>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Replies', s.numbers.replies],
          ['Views', s.numbers.views.toLocaleString()],
          ['Authors replied', s.numbers.author_replies],
          ['People to act on', s.numbers.people],
        ].map(([l, v]) => (
          <div key={l as string} className="glass px-4 py-3">
            <div className="font-serif text-[30px] leading-none tnum">{v}</div>
            <div className="mt-1 text-[12.5px] text-ink-3">{l}</div>
          </div>
        ))}
      </div>

      {s.idea && (
        <section className="glass mt-4 p-5" style={{ background: 'linear-gradient(135deg, rgb(255 255 255 / .7), rgb(227 233 255 / .6))' }}>
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.08em] text-blue-ink">
            <Lightbulb size={15} aria-hidden /> A post for today
          </div>
          <p className="mt-2 text-[17px] leading-relaxed">{s.idea.take}</p>
          <p className="mt-2 text-[13.5px] text-ink-2">Why now: {s.idea.why}</p>
          {s.idea.backups?.length ? (
            <ul className="mt-3 space-y-1 text-[14px] text-ink-2">
              {s.idea.backups.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              className="btn-ink press"
              onClick={() => {
                void navigator.clipboard?.writeText(s.idea!.take)
                toast('Copied. Post it yourself; Kite never posts your own posts.')
              }}
            >
              <Copy size={15} aria-hidden /> Copy
            </button>
          </div>
        </section>
      )}

      <article className="glass glass-strong mt-4 p-5 sm:p-7">
        <Md text={s.body} />
      </article>

      {summaries.length > 1 && (
        <section className="mt-6 pb-6">
          <h2 className="mb-2 px-1 text-[15px] font-semibold">Earlier</h2>
          <div className="flex flex-wrap gap-2">
            {summaries.map((x, j) => (
              <button key={x.id} onClick={() => setI(j)} className={cx('btn-glass press !min-h-9 text-[13.5px]', j === i && '!bg-white')}>
                {j === 0 ? 'Today' : new Date(x.day + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {x.numbers.replies}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
