/* Kite, from Lemma's cast. The art is served by lemma.work (not bundled); the
   eyes sit where the cast's rig puts them in the 1254×1254 portrait. If the
   art can't load, a glass diamond stands in. */

import { useState } from 'react'
import { cx } from '../lib/ui'

const ART = 'https://lemma.work/teammates/extended/kite-sm.webp'
const EYES: [number, number][] = [
  [677, 430],
  [790, 455],
]
const PORTRAIT = 1254

export function Kite({ size = 56, mood = 'idle', className }: { size?: number; mood?: 'idle' | 'busy' | 'still'; className?: string }) {
  const [ok, setOk] = useState(true)
  return (
    <div
      className={cx('kite', mood === 'idle' && 'kite-bob', mood === 'busy' && 'kite-busy', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {ok ? (
        <>
          <img src={ART} alt="" onError={() => setOk(false)} draggable={false} />
          {EYES.map(([x, y], i) => (
            <span key={i} className="eye" style={{ left: `${(x / PORTRAIT) * 100}%`, top: `${(y / PORTRAIT) * 100}%` }} />
          ))}
        </>
      ) : (
        <div className="h-full w-full rotate-45 scale-[.7] rounded-[22%]" style={{ background: 'linear-gradient(90deg,#426cf5 50%,#fc707e 50%)' }} />
      )}
    </div>
  )
}
