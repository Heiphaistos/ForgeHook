export interface Webhook {
  id: number
  name: string
  url: string
  avatar_url: string | null
  username: string | null
  category: string
  created_at?: string
  health_status?: 'ok' | 'dead' | null
  last_health_check?: string | null
}

export interface Bot {
  id: number
  name: string
  channel_id: string | null
  created_at?: string
}

export interface Template {
  id: number
  name: string
  description: string | null
  payload: string
  category: string
  preview_color: string
  favorited?: number
  created_at?: string
}

export interface ScheduledJob {
  id: number
  name: string
  webhook_id: number
  payload: string
  cron_expr: string
  enabled: number
  last_run: string | null
  created_at?: string
}

export interface RssFeed {
  id: number
  name: string
  url: string
  webhook_id: number
  check_interval: number
  last_checked: string | null
  enabled: number
}

export interface TutorialBlock {
  id: string
  type: 'text' | 'image' | 'video' | 'embed' | 'separator' | 'code' | 'callout'
  content: any
}

export interface Tutorial {
  id: number
  title: string
  description: string | null
  blocks: TutorialBlock[]
  published: number
  created_at?: string
}

export interface HistoryEntry {
  id: number
  webhook_id: number | null
  webhook_name: string
  payload: string
  status: number
  error: string | null
  sent_at: string
  send_type?: string
  bot_id?: number | null
  channel_id?: string | null
  message_id?: string | null
}
