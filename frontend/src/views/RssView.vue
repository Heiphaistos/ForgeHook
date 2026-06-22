<template>
  <div class="page">
    <div class="page-header">
      <h1>📰 Flux RSS</h1>
      <button @click="openForm()" class="btn-primary">+ Ajouter un flux</button>
    </div>

    <div class="grid-2">
      <div v-for="f in feeds" :key="f.id" class="card">
        <div class="feed-header">
          <span :class="['badge', f.enabled ? 'badge-success' : 'badge-error']">
            {{ f.enabled ? '▶ Actif' : '⏸ Pausé' }}
          </span>
          <span class="feed-name">{{ f.name }}</span>
        </div>
        <div class="feed-url">{{ f.url }}</div>
        <div class="feed-meta">
          <span>Webhook: {{ webhookName(f.webhook_id) }}</span>
          <span>Intervalle: {{ f.check_interval / 60 }} min</span>
          <span v-if="f.last_checked">Dernier check: {{ fmtDate(f.last_checked) }}</span>
        </div>
        <div class="feed-actions">
          <button @click="toggle(f)" :class="f.enabled ? 'btn-secondary' : 'btn-primary'">
            {{ f.enabled ? '⏸ Pause' : '▶ Activer' }}
          </button>
          <button @click="openForm(f)" class="btn-secondary">✏️ Modifier</button>
          <button @click="remove(f.id)" class="btn-danger-sm">🗑</button>
        </div>
      </div>
      <div v-if="!feeds.length" class="empty-state">Aucun flux RSS configuré.</div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h3>{{ editing ? 'Modifier flux' : 'Ajouter un flux RSS' }}</h3>
        <div class="section">
          <label class="fh-label">Nom *</label>
          <input v-model="form.name" placeholder="Ex: Blog Anthropic" class="fh-input" autofocus />
        </div>
        <div class="section">
          <label class="fh-label">URL du flux RSS *</label>
          <input v-model="form.url" placeholder="https://exemple.com/feed.xml" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Webhook cible *</label>
          <select v-model="form.webhook_id" class="fh-select w-full">
            <option :value="0" disabled>Choisir un webhook</option>
            <option v-for="w in webhooks" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div class="section">
          <label class="fh-label">Intervalle de vérification (secondes)</label>
          <input v-model.number="form.check_interval" type="number" min="60" class="fh-input" />
          <p style="font-size:11px;color:var(--text-muted);margin-top:2px">Min: 60s | Recommandé: 3600s (1h)</p>
        </div>
        <div class="section">
          <label class="fh-label">Template Discord JSON (optionnel)</label>
          <textarea v-model="form.template"
            placeholder='{"embeds":[{"title":"{{title}}","url":"{{link}}","description":"{{content}}"}]}'
            class="fh-textarea" rows="4" />
          <p style="font-size:11px;color:var(--text-muted);margin-top:2px">
            Variables: <code>&#123;&#123;title&#125;&#125;</code>, <code>&#123;&#123;link&#125;&#125;</code>, <code>&#123;&#123;content&#125;&#125;</code>, <code>&#123;&#123;author&#125;&#125;</code>
          </p>
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button @click="submit" class="btn-primary">{{ editing ? 'Modifier' : 'Ajouter' }}</button>
          <button @click="showForm = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'
import type { RssFeed, Webhook } from '../types/app'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const feeds = ref<RssFeed[]>([])
const webhooks = ref<Webhook[]>([])
const showForm = ref(false)
const editing = ref<RssFeed | null>(null)
const formError = ref('')
const form = ref({ name: '', url: '', webhook_id: 0, check_interval: 3600, template: '', enabled: true })

onMounted(async () => {
  const [f, w] = await Promise.all([api.get('/rss'), api.get('/webhooks')])
  feeds.value = f.data
  webhooks.value = w.data
})

function webhookName(id: number): string {
  return webhooks.value.find(w => w.id === id)?.name ?? `#${id}`
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function openForm(f?: RssFeed) {
  editing.value = f ?? null
  form.value = f
    ? { name: f.name, url: f.url, webhook_id: f.webhook_id, check_interval: f.check_interval, template: '', enabled: !!f.enabled }
    : { name: '', url: '', webhook_id: 0, check_interval: 3600, template: '', enabled: true }
  formError.value = ''
  showForm.value = true
}

async function submit() {
  formError.value = ''
  if (!form.value.name || !form.value.url || !form.value.webhook_id) { formError.value = 'Nom, URL et webhook requis'; return }
  try {
    if (editing.value) await api.put(`/rss/${editing.value.id}`, form.value)
    else await api.post('/rss', form.value)
    const { data } = await api.get('/rss')
    feeds.value = data
    showForm.value = false
    ui.notify(editing.value ? 'Flux modifié' : 'Flux ajouté !')
  } catch (e: any) {
    formError.value = e.response?.data?.error ?? 'Erreur'
  }
}

async function toggle(f: RssFeed) {
  await api.patch(`/rss/${f.id}/toggle`)
  f.enabled = f.enabled ? 0 : 1
  ui.notify(f.enabled ? 'Flux activé' : 'Flux mis en pause')
}

async function remove(id: number) {
  await api.delete(`/rss/${id}`)
  feeds.value = feeds.value.filter(f => f.id !== id)
  ui.notify('Flux supprimé')
}
</script>

<style scoped>
.feed-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.feed-name { font-weight: 700; font-size: 15px; color: #fff; }
.feed-url { font-size: 11px; color: var(--text-muted); font-family: monospace; margin-bottom: 8px; word-break: break-all; }
.feed-meta { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.feed-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.empty-state { color: var(--text-muted); padding: 48px; text-align: center; grid-column: 1 / -1; }
</style>
