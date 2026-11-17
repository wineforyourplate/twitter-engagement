import { LemmaClient } from 'lemma-sdk'

// One client for the app. Pod, API and auth URLs come from the host-injected
// window.__LEMMA_CONFIG__ when served; `vite dev` falls back to .env.local.
export const lemma = new LemmaClient()
