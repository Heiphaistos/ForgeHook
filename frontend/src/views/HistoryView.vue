<template>
  <div class="page">
    <div class="page-header">
      <h1>📜 Historique</h1>
      <button @click="clearAll" class="btn-danger">🗑 Tout effacer</button>
    </div>

    <div class="history-list">
      <div v-for="h in history" :key="h.id" class="history-item">
        <span :class="['badge', h.status < 300 ? 'badge-success' : 'badge-error']">{{ h.status }}</span>
        <div class="history-body">
          <div class="history-webhook">{{ h.webhook_name }}</div>
          <div class="history-preview">{{ previewPayload(h.payload) }}</div>
          <div v-if="h.error" class="error" style="font-size:12px">{{ h.error }}</div>
        </div>
        <div class="history-right">
          <div class="history-time">{{ fmtDate(h.sent_at) }}</div>
          <button @click="reuse(h)" class="btn-secondary" style="font-size:11px;padding:3px 8px">↺ Réutiliser</button>
          <button @click="remove(h.id)" class="btn-danger-sm">✕</button>
        </div>
      </div>
      <div v-if="!history.length" class="empty-state">Aucun message envoyé pour l'instant.</div>
    </div>

    <div v-if="hasMore" class="load-more">
      <button @click="loadMore" class="btn-secondary">Charger plus</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'
import type { HistoryEntry } from '../types/app'
import { useUiStore } from '../stores/ui'
import { useEmbedStore } from '../stores/embed'
import { useRouter } from 'vue-router'

const ui = useUiStore()
const embedStore = useEmbedStore()
const router = useRouter()
const history = ref<HistoryEntry[]>([])
const offset = ref(0)
const hasMore = ref(false)
const LIMIT = 50

onMounted(() => load())

async function load(reset = true) {
  if (reset) { offset.value = 0; history.value = [] }
  const { data } = await api.get(`/history?limit=${LIMIT + 1}&offset=${offset.value}`)
  hasMore.value = data.length > LIMIT
  history.value.push(...data.slice(0, LIMIT))
  offset.value += LIMIT
}

async function loadMore() {
  await load(false)
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

function reuse(h: HistoryEntry) {
  try {
    const payload = JSON.parse(h.payload)
    embedStore.loadTemplate(payload)
    router.push('/embed')
    ui.notify('Payload chargé dans l\'éditeur')
  } catch {
    ui.notify('Impossible de charger ce payload', 'error')
  }
}

async function remove(id: number) {
  await api.delete(`/history/${id}`)
  history.value = history.value.filter(h => h.id !== id)
}

async function clearAll() {
  await api.delete('/history')
  history.value = []
  ui.notify('Historique effacé')
}
</script>

<style scoped>
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-item {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--border);
}
.history-body { flex: 1; min-width: 0; }
.history-webhook { font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 2px; }
.history-preview { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.history-time { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.load-more { text-align: center; margin-top: 16px; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; }
</style>
