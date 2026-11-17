/* Today's ring: replies sent against today's cap, with a tick where the pace
   allows Kite to be right now. A liquid stroke (Kite's blue into coral) in a
   glass track. */

const R = 92
const C = 2 * Math.PI * R

export function Ring({ done, cap, pace, size = 220, children }: { done: number; cap: number; pace: number; size?: number; children?: React.ReactNode }) {
  const f = Math.min(1, cap ? done / cap : 0)
  const p = Math.min(1, cap ? pace / cap : 0)
  const a = p * 2 * Math.PI - Math.PI / 2
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 220 220" width={size} height={size} className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7d9bff" />
            <stop offset=".55" stopColor="#426cf5" />
            <stop offset="1" stopColor="#fc707e" />
          </linearGradient>
          <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        {/* glass track */}
        <circle cx="110" cy="110" r={R} fill="none" stroke="rgb(255 255 255 / .55)" strokeWidth="22" />
        <circle cx="110" cy="110" r={R + 11} fill="none" stroke="rgb(255 255 255 / .9)" strokeWidth="1" />
        <circle cx="110" cy="110" r={R - 11} fill="none" stroke="rgb(18 20 40 / .07)" strokeWidth="1" />
        {/* glow + stroke */}
        <g transform="rotate(-90 110 110)">
          <circle cx="110" cy="110" r={R} fill="none" stroke="url(#ring-g)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${f * C} ${C}`} filter="url(#ring-glow)" opacity=".55" />
          <circle cx="110" cy="110" r={R} fill="none" stroke="url(#ring-g)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${f * C} ${C}`} style={{ transition: 'stroke-dasharray 700ms cubic-bezier(.3,.7,.4,1)' }} />
          {/* specular highlight along the liquid */}
          <circle cx="110" cy="110" r={R - 3.5} fill="none" stroke="rgb(255 255 255 / .55)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${Math.max(0, f * C - 14)} ${C}`} strokeDashoffset={-6} />
        </g>
        {/* the pace tick */}
        {cap > 0 && p > 0 && p < 1 && (
          <g>
            <line
              x1={110 + (R - 15) * Math.cos(a)}
              y1={110 + (R - 15) * Math.sin(a)}
              x2={110 + (R + 15) * Math.cos(a)}
              y2={110 + (R + 15) * Math.sin(a)}
              stroke="#12141c"
              strokeOpacity=".55"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
