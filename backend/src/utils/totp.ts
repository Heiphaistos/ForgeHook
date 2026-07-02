// TOTP (RFC 6238) sans dépendance externe — HMAC-SHA1, pas de supply chain.
// Compatible Google Authenticator / Authy / etc.

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP_SECONDS = 30
const DIGITS = 6

/** Générer un secret aléatoire encodé en Base32 (160 bits par défaut). */
export function generateTotpSecret(bytes = 20): string {
  const buf = randomBytes(bytes)
  return base32Encode(buf)
}

/** Encoder un buffer en Base32 (RFC 4648, sans padding). */
function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

/** Décoder une chaîne Base32 en buffer (tolère espaces et minuscules). */
function base32Decode(input: string): Buffer {
  const clean = input.replace(/[\s=]/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/** Calculer le code TOTP à 6 chiffres pour un secret Base32 et un compteur de pas. */
function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  // counter sur 64 bits big-endian (les 32 bits hauts restent 0 avant ~an 10000)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, '0')
}

/**
 * Vérifier un code TOTP fourni par l'utilisateur.
 * Fenêtre de tolérance ±1 pas (30 s) pour absorber le décalage d'horloge.
 * Comparaison à temps constant.
 */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  if (!/^\d{6}$/.test(token ?? '')) return false
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS)
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const expected = hotp(secret, counter + errorWindow)
    const a = Buffer.from(expected)
    const b = Buffer.from(token)
    if (a.length === b.length && timingSafeEqual(a, b)) return true
  }
  return false
}

/** Construire l'URI otpauth:// à encoder dans un QR code d'enrôlement. */
export function buildOtpAuthUri(secret: string, account: string, issuer = 'ForgeHook'): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}
