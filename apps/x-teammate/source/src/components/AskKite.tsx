/* Kite in the corner: a chat about whatever is on screen. Live, each message goes
   to the pod's `kite` agent with what you're looking at; the demo shows a canned
   exchange. */

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, X } from 'lucide-react'
import { Kite } from './Kite'
import { cx } from '../lib/ui'

export interface Msg {
  role: 'you' | 'kite'
  text: string
}

export function AskKite({ page, send }: { page: string; send?: (text: string, viewing: string) => Promise<string> }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'kite', text: 'Ask me about anything on this page. "Why this post?", "make the second one shorter", "who should I add to my list?"' },
  ])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs, open])

  async function go() {
    const t = text.trim()
    if (!t || busy) return
    setText('')
    setMsgs((m) => [...m, { role: 'you', text: t }])
    setBusy(true)
    try {
      const reply = send
        ? await send(t, page)
        : await new Promise<string>((r) =>
            setTimeout(
              () => r("Done - I cut the first line on Inês's reply (it repeated her question) and kept the 2 hrs detail. It's 31 chars shorter now. I'll do the same on drafts like it."),
              900,
            ),
          )
      setMsgs((m) => [...m, { role: 'kite', text: reply }])
    } catch (e) {
      setMsgs((m) => [...m, { role: 'kite', text: `I couldn't answer that just now (${String((e as Error)?.message || e)}). Try again in a minute.` }])
    } finally {
      setBusy(false)
    }
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass press fixed right-4 bottom-[92px] z-30 flex items-center gap-2 py-1.5 pr-4 pl-1.5 text-[14px] font-semibold lg:right-6 lg:bottom-6"
        style={{ borderRadius: 999 }}
      >
        <Kite size={34} mood="still" /> Ask Kite
      </button>
    )

  return (
    <div className="glass glass-strong rise fixed inset-x-2 bottom-2 z-40 flex h-[min(540px,calc(100dvh-80px))] flex-col overflow-hidden sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[400px]">
      <header className="flex items-center gap-2.5 border-b border-black/5 px-4 py-3">
        <Kite size={34} mood={busy ? 'busy' : 'still'} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Kite</div>
          <div className="text-[12px] text-ink-3">Looking at {page}</div>
        </div>
        <button className="btn-quiet !min-h-9 !px-2" onClick={() => setOpen(false)} aria-label="Close">
          <X size={18} aria-hidden />
        </button>
      </header>
      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {msgs.map((m, i) => (
          <div key={i} className={cx('max-w-[86%] rounded-[18px] px-3.5 py-2.5 text-[14.5px] leading-relaxed', m.role === 'you' ? 'ml-auto bg-ink text-white' : 'bg-white/80 shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgb(18_20_40/.05)]')}>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-[13px] text-ink-3">Kite is thinking…</div>}
        <div ref={end} />
      </div>
      <form
        className="flex items-end gap-2 border-t border-black/5 p-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          void go()
        }}
      >
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void go()
            }
          }}
          placeholder="Ask Kite…"
          className="field max-h-28 min-h-11 flex-1 resize-none !py-2.5"
        />
        <button className="btn-ink press !h-11 !min-h-11 !w-11 !px-0" disabled={!text.trim() || busy} aria-label="Send">
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
    </div>
  )
}
