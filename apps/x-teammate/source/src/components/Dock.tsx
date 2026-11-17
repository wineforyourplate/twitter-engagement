/* The floating glass pill: the only navigation, on every screen size. A lens of
   clearer glass slides to the page you pick. Written for this pod; the idea of one
   liquid pill comes from Piecework (see DESIGN.md). */

import { useLayoutEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface DockItem {
  key: string
  label: string
  icon: LucideIcon
  dot?: boolean
}

export function Dock({ items, active, onChange }: { items: DockItem[]; active: string; onChange: (key: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [lens, setLens] = useState({ left: 6, width: 0 })
  useLayoutEffect(() => {
    const place = () => {
      const el = ref.current?.querySelector<HTMLButtonElement>(`[data-k="${active}"]`)
      if (el) setLens({ left: el.offsetLeft, width: el.offsetWidth })
    }
    place()
    // fonts and the viewport change the buttons' widths after the first paint
    void document.fonts?.ready.then(place)
    const ro = new ResizeObserver(place)
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [active, items.length])
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(14px,env(safe-area-inset-bottom))]" aria-label="Main">
      <div ref={ref} className="dock pointer-events-auto">
        <span className="dock-lens" style={{ left: lens.left, width: lens.width }} aria-hidden />
        {items.map(({ key, label, icon: Icon, dot }) => (
          <button key={key} data-k={key} className="press" aria-current={key === active ? 'page' : undefined} onClick={() => onChange(key)}>
            <Icon size={19} strokeWidth={1.9} aria-hidden />
            <span>{label}</span>
            {dot && <span className="dot" aria-label="needs you" />}
          </button>
        ))}
      </div>
    </nav>
  )
}
