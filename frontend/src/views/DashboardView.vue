<template>
  <div class="page">
    <div class="page-header">
      <h1>📊 Dashboard</h1>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="font-size:12px;color:var(--text-muted)">ForgeHook v3.0.0</div>
        <a :href="`${apiBase}/admin/backup`" class="btn-secondary" style="font-size:12px" title="Télécharger un backup SQLite" download>💾 Backup DB</a>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">🔗</div><div class="stat-body"><div class="stat-value">{{ counts.webhooks }}</div><div class="stat-label">Webhooks</div></div></div>
      <div class="stat-card"><div class="stat-icon">🤖</div><div class="stat-body"><div class="stat-value">{{ counts.bots }}</div><div class="stat-label">Bots</div></div></div>
      <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-body"><div class="stat-value">{{ counts.templates }}</div><div class="stat-label">Templates</div></div></div>
      <div class="stat-card"><div class="stat-icon">📰</div><div class="stat-body"><div class="stat-value">{{ counts.rss }}</div><div class="stat-label">Flux RSS</div></div></div>
      <div class="stat-card"><div class="stat-icon">⏰</div><div class="stat-body"><div class="stat-value">{{ counts.jobs }}</div><div class="stat-label">Jobs planifiés</div></div></div>
      <div class="stat-card success-card">
        <div class="stat-icon">✅</div>
        <div class="stat-body">
          <div class="stat-value">{{ msgStats.success }}</div>
          <div class="stat-label">Envois réussis</div>
        </div>
      </div>
      <div class="stat-card error-card" v-if="msgStats.errors > 0">
        <div class="stat-icon">❌</div>
        <div class="stat-body">
          <div class="stat-value">{{ msgStats.errors }}</div>
          <div class="stat-label">Erreurs</div>
        </div>
      </div>
    </div>

    <!-- Bot Discord status -->
    <div class="bot-status-bar mt-4" v-if="botStatus !== null">
      <div class="bot-status-icon">🤖</div>
      <div class="bot-status-body">
        <span class="bot-status-name">Bot Discord</span>
        <span :class="['bot-badge', botStatus.online ? 'badge-online' : 'badge-offline']">
          {{ botStatus.online ? '● En ligne' : '● Hors ligne' }}
        </span>
        <template v-if="botStatus.online">
          <span class="bot-stat">🏠 {{ botStatus.guilds }} serveur{{ botStatus.guilds !== 1 ? 's' : '' }}</span>
          <span class="bot-stat">👥 {{ botStatus.users }} utilisateurs</span>
          <span class="bot-stat">⚡ {{ botStatus.commands_today }} cmds/jour</span>
          <span class="bot-stat">⏱ {{ botStatus.uptime }}</span>
        </template>
        <span v-else class="bot-error">{{ botStatus.error }}</span>
      </div>
    </div>

    <!-- Chart 7 jours + Top webhooks -->
    <div class="dashboard-grid mt-4">
      <div class="card">
        <h3>📈 Activité (7 derniers jours)</h3>
        <div class="chart" v-if="msgStats.byDay.length">
          <div v-for="day in msgStats.byDay" :key="day.day" class="bar-wrap">
            <div class="bar" :style="{ height: Math.max(4, Math.round((day.n / maxDayN) * 80)) + 'px' }" :title="`${day.n} envoi(s)`"></div>
            <div class="bar-label">{{ shortDay(day.day) }}</div>
          </div>
        </div>
        <div v-else class="empty-hint">Aucun envoi cette semaine</div>
      </div>

      <div class="card">
        <h3>🏆 Top Webhooks</h3>
        <div v-for="wh in msgStats.topWebhooks" :key="wh.webhook_name" class="top-webhook-row">
          <span class="wh-name">{{ wh.webhook_name }}</span>
          <div class="wh-bar-wrap">
            <div class="wh-bar" :style="{ width: Math.round((wh.n / (msgStats.topWebhooks[0]?.n || 1)) * 100) + '%' }"></div>
          </div>
          <span class="wh-count">{{ wh.n }}</span>
        </div>
        <div v-if="!msgStats.topWebhooks.length" class="empty-hint">Aucun envoi enregistré</div>
      </div>
    </div>

    <!-- Accès rapide + Derniers envois -->
    <div class="dashboard-grid mt-4">
      <div class="card quick-actions">
        <h3>⚡ Accès rapide</h3>
        <div class="quick-grid">
          <router-link to="/embed" class="quick-card">⚡<span>Embed Builder</span></router-link>
          <router-link to="/webhooks" class="quick-card">🔗<span>Webhooks</span></router-link>
          <router-link to="/templates" class="quick-card">📋<span>Templates</span></router-link>
          <router-link to="/bots" class="quick-card">🤖<span>Bots</span></router-link>
          <router-link to="/rss" class="quick-card">📰<span>RSS Feeds</span></router-link>
          <router-link to="/scheduler" class="quick-card">⏰<span>Planificateur</span></router-link>
          <router-link to="/media" class="quick-card">🖼️<span>Médias</span></router-link>
          <router-link to="/fonts" class="quick-card">🔤<span>Fonts</span></router-link>
        </div>
      </div>

      <div class="card">
        <h3>📜 Derniers envois</h3>
        <div v-for="h in recentHistory" :key="h.id" class="history-row">
          <span :class="['badge', h.status < 300 ? 'badge-success' : 'badge-error']">{{ h.status }}</span>
          <span v-if="h.send_type === 'bot'" class="badge badge-info" style="font-size:10px">Bot</span>
          <span class="wh-name-small">{{ h.webhook_name }}</span>
          <span class="history-time">{{ fmtDate(h.sent_at) }}</span>
        </div>
        <div v-if="!recentHistory.length" class="empty-hint">Aucun envoi récent</div>
        <router-link to="/history" class="btn-secondary mt-2" style="display:inline-block">Voir tout →</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../api/client'
import type { HistoryEntry } from '../types/app'

const apiBase = import.meta.env.VITE_API_URL ?? '/api'
const counts = ref({ webhooks: 0, bots: 0, templates: 0, rss: 0, jobs: 0 })
const botStatus = ref<{ online: boolean; guilds?: number; users?: number; commands_today?: number; uptime?: string; error?: string } | null>(null)
const msgStats = ref<{
  total: number; success: number; errors: number;
  byDay: { day: string; n: number }[];
  topWebhooks: { webhook_name: string; n: number }[];
}>({ total: 0, success: 0, errors: 0, byDay: [], topWebhooks: [] })
const recentHistory = ref<(HistoryEntry & { send_type?: string })[]>([])

const maxDayN = computed(() => Math.max(1, ...msgStats.value.byDay.map(d => d.n)))

onMounted(async () => {
  try {
    const [wh, bots, tpl, rss, jobs, hist, stats] = await Promise.all([
      api.get('/webhooks'),
      api.get('/bots'),
      api.get('/templates'),
      api.get('/rss'),
      api.get('/scheduler'),
      api.get('/history?limit=5'),
      api.get('/history/stats'),
    ])
    counts.value = { webhooks: wh.data.length, bots: bots.data.length, templates: tpl.data.length, rss: rss.data.length, jobs: jobs.data.length }
    msgStats.value = stats.data
    recentHistory.value = hist.data
  } catch {
    // Dashboard affiche les zéros si API indisponible
  }
  api.get('/bots/discord-bot/status').then(r => {
    botStatus.value = r.data
  }).catch(() => {
    botStatus.value = { online: false, error: 'Non configuré' }
  })
})

function fmtDate(d: string): string {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function shortDay(day: string): string {
  const d = new Date(day)
  return d.toLocaleDateString('fr-FR', { weekday: 'short' })
}
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.bot-status-bar { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.bot-status-icon { font-size: 22px; flex-shrink: 0; }
.bot-status-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
.bot-status-name { font-weight: 700; font-size: 14px; color: #fff; }
.bot-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.badge-online { background: rgba(87,242,135,.15); color: #57f287; }
.badge-offline { background: rgba(237,66,69,.15); color: #ed4245; }
.bot-stat { font-size: 12px; color: var(--text-muted); }
.bot-error { font-size: 12px; color: var(--text-muted); font-style: italic; }
.bot-link { font-size: 12px; margin-left: auto; flex-shrink: 0; text-decoration: none; }
.stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--border); }
.stat-card.success-card { border-color: rgba(87,242,135,.3); }
.stat-card.error-card { border-color: rgba(237,66,69,.3); }
.stat-icon { font-size: 26px; flex-shrink: 0; }
.stat-value { font-size: 22px; font-weight: 800; color: #fff; }
.stat-label { font-size: 11px; color: var(--text-muted); }
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
.chart { display: flex; align-items: flex-end; gap: 6px; height: 90px; padding: 8px 0; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar { background: var(--accent); border-radius: 3px 3px 0 0; width: 100%; min-height: 4px; transition: height .3s; }
.bar-label { font-size: 10px; color: var(--text-muted); text-transform: capitalize; }
.top-webhook-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.wh-name { font-size: 13px; width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.wh-bar-wrap { flex: 1; background: var(--bg-tertiary); border-radius: 3px; height: 8px; overflow: hidden; }
.wh-bar { height: 100%; background: var(--accent); border-radius: 3px; transition: width .3s; }
.wh-count { font-size: 12px; font-weight: 700; color: #fff; width: 30px; text-align: right; }
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.quick-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border-radius: 8px; background: var(--bg-tertiary); border: 1px solid var(--border); text-decoration: none; color: var(--text-muted); font-size: 22px; transition: all .15s; }
.quick-card span { font-size: 11px; font-weight: 600; text-align: center; }
.quick-card:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,101,242,.08); }
.history-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--border); }
.wh-name-small { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-time { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.empty-hint { color: var(--text-muted); font-size: 13px; padding: 8px 0; }
.mt-4 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }
</style>
