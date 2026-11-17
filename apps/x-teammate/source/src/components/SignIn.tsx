/* Sign in to X again: Kite opens the person's own browser and hands them the sign-in
   page (browser_sign_in). They type their password there; Kite never sees it. */

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, LogIn } from 'lucide-react'
import { getState, toast } from '../lib/store'
import * as live from '../lib/live'

export function SignInButton() {
  const [conv, setConv] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!conv) return
    const t = setInterval(async () => {
      try {
        setLink(await live.pendingSignIn(conv))
        await live.refresh('profile')
        if (getState().profile?.browser_status === 'signed_in' && !link) {
          clearInterval(t)
          setConv(null)
          setBusy(false)
        }
      } catch {
        /* keep polling */
      }
    }, 2500)
    return () => clearInterval(t)
  }, [conv, link])
  if (link)
    return (
      <a className="btn-ink press !min-h-10" href={link} target="_blank" rel="noreferrer">
        <ExternalLink size={15} aria-hidden /> Open your browser
      </a>
    )
  return (
    <button
      className="btn-glass press !min-h-10"
      disabled={busy}
      onClick={async () => {
        if (getState().demo) return toast('In the example, you are signed in already.')
        setBusy(true)
        try {
          setConv(await live.task('[onboarding] sign-in'))
        } catch {
          setBusy(false)
        }
      }}
    >
      {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <LogIn size={15} aria-hidden />} {busy ? 'Opening…' : 'Sign in again'}
    </button>
  )
}
