import { clsx, type ClassValue } from 'clsx'

export const cx = (...a: ClassValue[]) => clsx(a)

export function ago(iso?: string | null) {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h${m % 60 && h < 6 ? ` ${m % 60}m` : ''}`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export function until(iso?: string | null) {
  if (!iso) return ''
  const m = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (m <= 0) return 'now'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60 ? `${m % 60}m` : ''}`.trim()
  return `${Math.floor(h / 24)}d`
}

export function k(n?: number | null) {
  if (n == null) return ''
  if (n >= 10_000) return `${Math.round(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** A stable soft gradient per handle, for avatars. */
export function hue(handle: string) {
  let h = 0
  for (const c of handle) h = (h * 31 + c.charCodeAt(0)) % 360
  return `linear-gradient(135deg, hsl(${h} 85% 78%), hsl(${(h + 40) % 360} 80% 66%))`
}

export const LANE: Record<string, { label: string; cls: string }> = {
  list: { label: 'List', cls: 'chip-blue' },
  ask: { label: 'Ask', cls: 'chip-coral' },
  topic: { label: 'Search', cls: '' },
  warm: { label: 'Warm', cls: 'chip-amber' },
  answer: { label: 'Answered you', cls: 'chip-amber' },
}

export const MENTION: Record<string, string> = {
  none: 'No link, no tag',
  tag: 'Your tag',
  link: 'Your link',
  offer: 'Your offer',
}

/** Local clock time in the person's zone, "13:05". */
export function clock(iso: string | Date, tz: string) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz })
}

export function addMinutes(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = (h * 60 + m + minutes) % (24 * 60)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
