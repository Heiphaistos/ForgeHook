<template>
  <div class="page">
    <div class="page-header">
      <h1>📊 Dashboard</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🔗</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.webhooks }}</div>
          <div class="stat-label">Webhooks</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🤖</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.bots }}</div>
          <div class="stat-label">Bots</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.templates }}</div>
          <div class="stat-label">Templates</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📰</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.rss }}</div>
          <div class="stat-label">Flux RSS</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.jobs }}</div>
          <div class="stat-label">Jobs planifiés</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📜</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.history }}</div>
          <div class="stat-label">Messages envoyés</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid mt-4">
      <div class="quick-actions card">
        <h3>⚡ Accès rapide</h3>
        <div class="quick-btns">
          <router-link to="/embed" class="btn-primary">Créer un embed</router-link>
          <router-link to="/webhooks" class="btn-secondary">Gérer webhooks</router-link>
          <router-link to="/templates" class="btn-secondary">Templates</router-link>
          <router-link to="/tutorials/new" class="btn-secondary">Nouveau tutoriel</router-link>
        </div>
      </div>

      <div class="recent-history card">
        <h3>📜 Derniers envois</h3>
        <div v-for="h in recentHistory" :key="h.id" class="history-row">
          <span :class="['badge', h.status < 300 ? 'badge-success' : 'badge-error']">
            {{ h.status }}
          </span>
          <span class="wh-name-small">{{ h.webhook_name }}</span>
          <span class="history-time">{{ fmtDate(h.sent_at) }}</span>
        </div>
        <div v-if="!recentHistory.length" class="empty-hint">Aucun envoi récent</div>
        <router-link to="/history" class="btn-secondary mt-2" style="display:inline-block">Voir tout</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'
import type { HistoryEntry } from '../types/app'

const stats = ref({ webhooks: 0, bots: 0, templates: 0, rss: 0, jobs: 0, history: 0 })
const recentHistory = ref<HistoryEntry[]>([])

onMounted(async () => {
  const [wh, bots, tpl, rss, jobs, hist] = await Promise.all([
    api.get('/webhooks'),
    api.get('/bots'),
    api.get('/templates'),
    api.get('/rss'),
    api.get('/scheduler'),
    api.get('/history?limit=5'),
  ])
  stats.value = {
    webhooks: wh.data.length,
    bots: bots.data.length,
    templates: tpl.data.length,
    rss: rss.data.length,
    jobs: jobs.data.length,
    history: hist.data.length,
  }
  recentHistory.value = hist.data
})

function fmtDate(d: string): string {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 14px; border: 1px solid var(--border); }
.stat-icon { font-size: 28px; }
.stat-value { font-size: 24px; font-weight: 800; color: #fff; }
.stat-label { font-size: 12px; color: var(--text-muted); }
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.quick-actions h3, .recent-history h3 { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
.quick-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.history-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.wh-name-small { flex: 1; font-size: 13px; }
.history-time { font-size: 11px; color: var(--text-muted); }
.empty-hint { color: var(--text-muted); font-size: 13px; padding: 8px 0; }
</style>
