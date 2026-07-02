import { getDb } from '../db/index.js'
import { sendWebhook } from './discord.js'

// Intervalle de vérification de santé des webhooks (défaut : 30 min)
const CHECK_INTERVAL_MS = Number(process.env.WEBHOOK_MONITOR_INTERVAL_MS ?? 30 * 60 * 1000)

export type HealthStatus = 'ok' | 'dead'

interface WebhookRow {
  id: number
  name: string
  url: string
  health_status: string | null
}

/**
 * Vérifier la santé d'un webhook : un GET sur l'URL renvoie 200 (+ JSON) si le
 * webhook Discord existe encore, 401/404 s'il a été supprimé ou invalidé.
 */
async function pingWebhook(url: string): Promise<HealthStatus> {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10_000) })
    return res.ok ? 'ok' : 'dead'
  } catch {
    return 'dead'
  }
}

/**
 * Vérifier tous les webhooks, mettre à jour leur statut, et alerter (si
 * `ALERT_WEBHOOK_URL` est configuré) lors d'une bascule ok → dead.
 * Retourne le résumé { total, ok, dead }.
 */
export async function checkAllWebhooks(): Promise<{ total: number; ok: number; dead: number }> {
  const db = getDb()
  const rows = db.prepare('SELECT id, name, url, health_status FROM webhooks').all() as WebhookRow[]
  const update = db.prepare('UPDATE webhooks SET health_status=?, last_health_check=datetime(\'now\') WHERE id=?')

  let okCount = 0
  const newlyDead: WebhookRow[] = []

  for (const w of rows) {
    const status = await pingWebhook(w.url)
    if (status === 'ok') okCount++
    else if (w.health_status !== 'dead') newlyDead.push(w) // bascule ok/unknown → dead
    update.run(status, w.id)
  }

  await alertNewlyDead(newlyDead)

  return { total: rows.length, ok: okCount, dead: rows.length - okCount }
}

/** Envoyer une alerte Discord pour les webhooks qui viennent de tomber. */
async function alertNewlyDead(dead: WebhookRow[]): Promise<void> {
  const alertUrl = process.env.ALERT_WEBHOOK_URL
  if (!alertUrl || dead.length === 0) return
  await sendWebhook(alertUrl, {
    username: 'ForgeHook Monitor',
    embeds: [{
      title: '⚠️ Webhook(s) hors service',
      description: dead.map(w => `• **${w.name}** ne répond plus`).join('\n'),
      color: 0xed4245,
      footer: { text: 'ForgeHook • monitoring' },
      timestamp: new Date().toISOString(),
    }],
  }).catch(() => {})
}

/** Démarrer la surveillance périodique en tâche de fond. */
export function startWebhookMonitor(): void {
  // Premier passage différé de 60 s (laisse le backend démarrer)
  setTimeout(() => { checkAllWebhooks().catch(() => {}) }, 60_000)
  setInterval(() => { checkAllWebhooks().catch(() => {}) }, CHECK_INTERVAL_MS)
}
