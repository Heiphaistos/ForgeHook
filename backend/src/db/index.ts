import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? join(__dirname, '../../data/forgehook.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('secure_delete = ON')
    db.pragma('busy_timeout = 5000')
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
    db.exec(schema)
    const migrations = [
      'ALTER TABLE history ADD COLUMN bot_id INTEGER',
      'ALTER TABLE history ADD COLUMN channel_id TEXT',
      "ALTER TABLE history ADD COLUMN send_type TEXT DEFAULT 'webhook'",
      'ALTER TABLE history ADD COLUMN message_id TEXT',
      'ALTER TABLE templates ADD COLUMN favorited INTEGER DEFAULT 0',
      "ALTER TABLE tutorials ADD COLUMN category TEXT DEFAULT ''",
      "ALTER TABLE tutorials ADD COLUMN tags TEXT DEFAULT ''",
      // 2FA TOTP (feature v3.2.0)
      'ALTER TABLE users ADD COLUMN totp_secret TEXT',
      'ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0',
      // Monitoring webhooks (feature v3.2.0)
      'ALTER TABLE webhooks ADD COLUMN health_status TEXT',
      'ALTER TABLE webhooks ADD COLUMN last_health_check TEXT',
    ]
    for (const m of migrations) {
      try { db.exec(m) } catch { /* column already exists */ }
    }
  }
  return db
}
