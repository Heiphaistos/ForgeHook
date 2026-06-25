import cron, { type ScheduledTask } from 'node-cron'
import { getDb } from '../db/index.js'
import { sendWebhook } from './discord.js'

const activeTasks = new Map<number, ScheduledTask>()

function scheduleJob(job: any): void {
  if (activeTasks.has(job.id)) {
    activeTasks.get(job.id)!.stop()
    activeTasks.delete(job.id)
  }
  if (!job.enabled || !cron.validate(job.cron_expr)) return
  const task = cron.schedule(job.cron_expr, async () => {
    try {
      const db = getDb()
      const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(job.webhook_id) as any
      if (!webhook) return
      const payload = JSON.parse(job.payload)
      const embeds: any[] = payload.embeds ?? []
      for (let i = 0; i < Math.max(1, Math.ceil(embeds.length / 10)); i++) {
        const chunk = embeds.length ? embeds.slice(i * 10, i * 10 + 10) : []
        const chunkPayload = { ...payload, content: i === 0 ? payload.content : undefined, embeds: chunk.length ? chunk : undefined }
        const result = await sendWebhook(webhook.url, chunkPayload)
        db.prepare('INSERT INTO history (webhook_id, webhook_name, payload, status, error) VALUES (?,?,?,?,?)')
          .run(webhook.id, webhook.name, i === 0 ? job.payload : JSON.stringify(chunkPayload), result.status, result.error ?? null)
      }
      db.prepare("UPDATE scheduled_jobs SET last_run=datetime('now') WHERE id=?").run(job.id)
      console.log(`[scheduler] Job "${job.name}" envoyé`)
    } catch (err) {
      console.error(`[scheduler] Job "${job.name}" erreur:`, err)
    }
  })
  activeTasks.set(job.id, task)
}

export function startScheduler(): void {
  const db = getDb()
  const jobs = db.prepare('SELECT * FROM scheduled_jobs WHERE enabled=1').all() as any[]
  for (const job of jobs) scheduleJob(job)
  console.log(`[scheduler] ${jobs.length} job(s) loaded`)
}

export async function runJobNow(jobId: number): Promise<{ ok: boolean; status?: number }> {
  const db = getDb()
  const job = db.prepare('SELECT * FROM scheduled_jobs WHERE id=?').get(jobId) as any
  if (!job) return { ok: false }
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(job.webhook_id) as any
  if (!webhook) return { ok: false }
  const payload = JSON.parse(job.payload)
  const result = await sendWebhook(webhook.url, payload)
  db.prepare('UPDATE scheduled_jobs SET last_run=datetime("now") WHERE id=?').run(job.id)
  db.prepare('INSERT INTO history (webhook_id, webhook_name, payload, status, error) VALUES (?,?,?,?,?)')
    .run(webhook.id, webhook.name, job.payload, result.status, result.error ?? null)
  return { ok: result.ok, status: result.status }
}

export function reloadJob(jobId: number): void {
  const job = getDb().prepare('SELECT * FROM scheduled_jobs WHERE id=?').get(jobId) as any
  if (!job) { activeTasks.get(jobId)?.stop(); activeTasks.delete(jobId); return }
  scheduleJob(job)
}
