/**
 * Encodes/decodes a shareable configuration into the URL hash so a user
 * can send a link that reconstructs someone else's stream list without
 * any backend. The payload is base64url-encoded JSON (kept dependency-free).
 */
import { PersistedState } from '@/types/stream'

const HASH_PREFIX = '#share='

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export interface ShareableConfig {
  streams: PersistedState['streams']
  layout: PersistedState['settings']['layout']
  featuredStreamId: PersistedState['settings']['featuredStreamId']
}

export function encodeShareLink(config: ShareableConfig): string {
  const json = JSON.stringify(config)
  const encoded = toBase64Url(json)
  const url = new URL(window.location.href)
  url.hash = `${HASH_PREFIX}${encoded}`
  return url.toString()
}

export function decodeShareHash(hash: string): ShareableConfig | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const encoded = hash.slice(HASH_PREFIX.length)
    const json = fromBase64Url(encoded)
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed.streams)) return null
    return parsed as ShareableConfig
  } catch {
    return null
  }
}
