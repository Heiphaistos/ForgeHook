import Parser from 'rss-parser'
import { getDb } from '../db/index.js'
import { sendWebhook } from './discord.js'
import { isSafeUrl } from '../utils/ssrf.js'

const parser = new Parser()

export async function checkFeed(feed: any): Promise<void> {
  const db = getDb()
  // Re-valider l'URL au moment du fetch (défense en profondeur : lignes héritées
  // d'avant la garde SSRF, ou DB altérée).
  if (!isSafeUrl(feed.url)) {
    console.warn(`[rss] Feed "${feed.name}" ignoré : URL non autorisée (${feed.url})`)
    return
  }
  try {
    const parsed = await parser.parseURL(feed.url)
    if (!parsed.items.length) return
    const latest = parsed.items[0]
    if (latest.guid && latest.guid === feed.last_guid) return
    if (latest.link && latest.link === feed.last_guid) return

    const webhook = db.prepare('SELECT * FROM webhooks WHERE id=?').get(feed.webhook_id) as any
    if (!webhook) return

    let payload: object
    if (feed.template) {
      const tpl = feed.template
        .replace(/\{\{title\}\}/g, latest.title ?? '')
        .replace(/\{\{link\}\}/g, latest.link ?? '')
        .replace(/\{\{content\}\}/g, (latest.contentSnippet ?? '').slice(0, 300))
        .replace(/\{\{author\}\}/g, latest.creator ?? '')
      try { payload = JSON.parse(tpl) } catch { payload = { content: tpl } }
    } else {
      payload = {
        embeds: [{
          title: (latest.title ?? 'New article').slice(0, 256),
          url: latest.link,
          description: (latest.contentSnippet ?? '').slice(0, 350) || undefined,
          color: 0x5865f2,
          author: latest.creator ? { name: latest.creator } : undefined,
          footer: { text: `📰 ${feed.name}` },
          timestamp: latest.isoDate ?? new Date().toISOString(),
        }],
      }
    }

    await sendWebhook(webhook.url, payload as any)
    const guid = latest.guid ?? latest.link ?? ''
    db.prepare('UPDATE rss_feeds SET last_checked=datetime("now"), last_guid=? WHERE id=?').run(guid, feed.id)
  } catch (e) {
    console.error(`[rss] Feed "${feed.name}" error:`, e)
    db.prepare('UPDATE rss_feeds SET last_checked=datetime("now") WHERE id=?').run(feed.id)
  }
}

export function startRssPoller(): void {
  setInterval(() => {
    const db = getDb()
    const feeds = db.prepare('SELECT * FROM rss_feeds WHERE enabled=1').all() as any[]
    const due = feeds.filter(feed => {
      const lastChecked = feed.last_checked ? new Date(feed.last_checked).getTime() : 0
      return Date.now() - lastChecked >= feed.check_interval * 1000
    })
    if (due.length) Promise.all(due.map(checkFeed)).catch(() => {})
  }, 60_000)
}
