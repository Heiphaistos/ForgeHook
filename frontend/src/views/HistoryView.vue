<template>
  <div class="page">
    <div class="page-header">
      <h1>📜 Historique</h1>
      <div class="header-actions">
        <a :href="csvUrl" class="btn-secondary" download="forgehook-history.csv">📥 CSV</a>
        <button v-if="selected.size > 0" @click="deleteSelected" class="btn-danger">
          🗑 Supprimer ({{ selected.size }})
        </button>
        <button @click="clearAll" class="btn-danger">🗑 Tout effacer</button>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-pill success">✅ {{ histStats.success }} succès</div>
      <div class="stat-pill error">❌ {{ histStats.errors }} erreurs</div>
      <div class="stat-pill neutral">📊 Total : {{ histStats.total }}</div>
      <div class="stat-pill neutral" v-if="histStats.total > 0">
        Taux : {{ Math.round(histStats.success / histStats.total * 100) }}%
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-bar">
      <input v-model="searchQ" @input="debouncedLoad" placeholder="🔍 Rechercher..." class="fh-input filter-search" />
      <select v-model="filterStatus" @change="loadHistory()" class="fh-select filter-select">
        <option value="">Tous les statuts</option>
        <option value="ok">✅ Succès</option>
        <option value="error">❌ Erreurs</option>
      </select>
      <input type="date" v-model="filterFrom" @change="loadHistory()" class="fh-input filter-date" title="Depuis" />
      <input type="date" v-model="filterTo" @change="loadHistory()" class="fh-input filter-date" title="Jusqu'au" />
      <button v-if="searchQ || filterStatus || filterFrom || filterTo" @click="resetFilters" class="btn-secondary">✕ Reset</button>
    </div>

    <!-- Liste -->
    <div class="history-list">
      <div v-for="h in history" :key="h.id" class="history-item" :class="{ selected: selected.has(h.id) }">
        <input type="checkbox" :checked="selected.has(h.id)" @change="toggleSelect(h.id)" class="hist-check" />
        <span :class="['badge', h.status < 300 ? 'badge-success' : 'badge-error']">{{ h.status }}</span>
        <span v-if="h.send_type === 'bot'" class="badge badge-info" style="font-size:10px">Bot</span>
        <div class="history-body">
          <div class="history-webhook">{{ h.webhook_name }}</div>
          <div class="history-preview">{{ previewPayload(h.payload) }}</div>
          <div v-if="h.error" class="error" style="font-size:12px">{{ h.error }}</div>
        </div>
        <div class="history-right">
          <div class="history-time">{{ fmtDate(h.sent_at) }}</div>
          <div class="history-actions">
            <button @click="viewPayload(h)" class="btn-icon-sm" title="Voir payload">👁</button>
            <button @click="reuse(h)" class="btn-icon-sm" title="Réutiliser">↺</button>
            <button @click="remove(h.id)" class="btn-icon-sm danger" title="Supprimer">✕</button>
          </div>
        </div>
      </div>
      <div v-if="!history.length" class="empty-state">
        {{ searchQ || filterStatus ? 'Aucun résultat pour ce filtre.' : 'Aucun message envoyé pour l\'instant.' }}
      </div>
    </div>

    <div v-if="hasMore" class="load-more">
      <button @click="loadMore" class="btn-secondary">Charger plus</button>
    </div>

    <!-- Modal payload -->
    <div v-if="payloadModal" class="modal-overlay" @click.self="payloadModal = null">
      <div class="modal" style="max-width:600px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>📄 Payload</h3>
          <button @click="payloadModal = null" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer">✕</button>
        </div>
        <pre class="json-block" style="max-height:400px;overflow:auto">{{ JSON.stringify(JSON.parse(payloadModal.payload), null, 2) }}</pre>
        <div class="modal-actions">
          <button @click="reuse(payloadModal); payloadModal = null" class="btn-primary">↺ Réutiliser</button>
          <button @click="payloadModal = null" class="btn-secondary">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../api/client'
import type { HistoryEntry } from '../types/app'
import { useUiStore } from '../stores/ui'
import { useEmbedStore } from '../stores/embed'
import { useRouter } from 'vue-router'

const ui = useUiStore()
const embedStore = useEmbedStore()
const router = useRouter()

const history = ref<HistoryEntry[]>([])
const histStats = ref({ total: 0, success: 0, errors: 0, byDay: [], topWebhooks: [] })
const offset = ref(0)
const hasMore = ref(false)
const LIMIT = 50

const searchQ = ref('')
const filterStatus = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const selected = ref<Set<number>>(new Set())
const payloadModal = ref<HistoryEntry | null>(null)

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadHistory(), 300)
}

const csvUrl = computed(() => `${import.meta.env.VITE_API_URL ?? '/api'}/history/export.csv`)

onMounted(async () => {
  await Promise.all([loadStats(), loadHistory()])
})

async function loadStats() {
  const { data } = await api.get('/history/stats')
  histStats.value = data
}

async function loadHistory(reset = true) {
  if (reset) { offset.value = 0; history.value = []; selected.value = new Set() }
  const params = new URLSearchParams()
  params.set('limit', String(LIMIT + 1))
  params.set('offset', String(offset.value))
  if (searchQ.value) params.set('q', searchQ.value)
  if (filterStatus.value) params.set('status', filterStatus.value)
  if (filterFrom.value) params.set('from', filterFrom.value)
  if (filterTo.value) params.set('to', filterTo.value)
  const { data } = await api.get(`/history?${params}`)
  hasMore.value = data.length > LIMIT
  history.value.push(...data.slice(0, LIMIT))
  offset.value += LIMIT
}

async function loadMore() { await loadHistory(false) }

function resetFilters() {
  searchQ.value = ''
  filterStatus.value = ''
  filterFrom.value = ''
  filterTo.value = ''
  loadHistory()
}

function toggleSelect(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
  selected.value = new Set(selected.value)
}

async function deleteSelected() {
  await api.delete('/history/bulk', { data: { ids: [...selected.value] } })
  history.value = history.value.filter(h => !selected.value.has(h.id))
  selected.value = new Set()
  await loadStats()
}

function previewPayload(payloadStr: string): string {
  try {
    const p = JSON.parse(payloadStr)
    if (p.content) return p.content.slice(0, 80)
    if (p.embeds?.[0]?.title) return `[Embed] ${p.embeds[0].title}`
    return 'Message Discord'
  } catch { return 'Payload invalide' }
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function viewPayload(h: HistoryEntry) { payloadModal.value = h }

function reuse(h: HistoryEntry) {
  try {
    embedStore.loadTemplate(JSON.parse(h.payload))
    router.push('/embed')
    ui.notify("Payload chargé dans l'éditeur")
  } catch { ui.notify('Impossible de charger ce payload', 'error') }
}

async function remove(id: number) {
  await api.delete(`/history/${id}`)
  history.value = history.value.filter(h => h.id !== id)
  histStats.value.total = Math.max(0, histStats.value.total - 1)
}

async function clearAll() {
  await api.delete('/history')
  history.value = []
  await loadStats()
  ui.notify('Historique effacé')
}
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; align-items: center; }
.stats-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.stat-pill { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
.stat-pill.success { background: rgba(87,242,135,.15); color: #57f287; border: 1px solid rgba(87,242,135,.3); }
.stat-pill.error { background: rgba(237,66,69,.15); color: #ed4245; border: 1px solid rgba(237,66,69,.3); }
.stat-pill.neutral { background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--border); }
.filters-bar { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
.filter-search { flex: 1; min-width: 200px; }
.filter-select { min-width: 140px; }
.filter-date { width: 140px; }
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-item { background: var(--bg-secondary); border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); }
.history-item.selected { border-color: var(--accent); background: rgba(88,101,242,.08); }
.hist-check { accent-color: var(--accent); cursor: pointer; }
.history-body { flex: 1; min-width: 0; }
.history-webhook { font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 2px; }
.history-preview { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.history-time { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.history-actions { display: flex; gap: 4px; }
.btn-icon-sm { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 4px; color: var(--text-muted); cursor: pointer; padding: 3px 6px; font-size: 12px; }
.btn-icon-sm:hover { color: #fff; background: var(--bg-secondary); }
.btn-icon-sm.danger:hover { color: #ed4245; border-color: #ed4245; }
.load-more { text-align: center; margin-top: 16px; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; }
</style>
