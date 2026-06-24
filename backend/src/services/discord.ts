export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  timestamp?: string
  footer?: { text: string; icon_url?: string }
  image?: { url: string }
  thumbnail?: { url: string }
  author?: { name: string; url?: string; icon_url?: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

export interface DiscordPayload {
  content?: string
  username?: string
  avatar_url?: string
  tts?: boolean
  embeds?: DiscordEmbed[]
  thread_id?: string
}

export async function sendWebhook(
  url: string,
  payload: DiscordPayload,
  threadId?: string
): Promise<{ ok: boolean; status: number; error?: string; message_id?: string }> {
  const target = threadId ? `${url}?thread_id=${encodeURIComponent(threadId)}&wait=true` : `${url}?wait=true`
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  })
  if (res.ok) {
    const data = await res.json().catch(() => ({})) as any
    return { ok: true, status: res.status, message_id: data?.id }
  }
  const text = await res.text().catch(() => 'Unknown Discord error')
  return { ok: false, status: res.status, error: text }
}

export async function editWebhookMessage(
  webhookUrl: string,
  messageId: string,
  payload: Partial<DiscordPayload>
): Promise<{ ok: boolean; error?: string }> {
  const match = webhookUrl.match(/\/webhooks\/(\d+)\/([\w-]+)/)
  if (!match) return { ok: false, error: 'URL webhook invalide' }
  const [, wId, wToken] = match
  const res = await fetch(
    `https://discord.com/api/v10/webhooks/${wId}/${wToken}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    }
  )
  if (res.ok) return { ok: true }
  return { ok: false, error: await res.text().catch(() => 'Discord error') }
}
