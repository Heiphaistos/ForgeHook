<template>
  <div class="page">
    <div class="page-header">
      <h1>🔗 Webhooks</h1>
      <button @click="openForm()" class="btn-primary">+ Ajouter</button>
    </div>

    <div v-if="!store.webhooks.length" class="empty-state">
      Aucun webhook configuré. Ajoutez-en un pour commencer.
    </div>

    <div v-for="(group, cat) in grouped" :key="cat" class="category-group">
      <div class="category-label">📁 {{ cat }}</div>
      <div class="grid-2">
        <div v-for="w in group" :key="w.id" class="card webhook-card">
          <div class="wh-header">
            <img v-if="w.avatar_url" :src="w.avatar_url" class="wh-avatar" alt="" @error="($event.target as HTMLImageElement).style.display='none'" />
            <div v-else class="wh-avatar-placeholder">🤖</div>
            <div class="wh-info">
              <div class="wh-name">{{ w.name }}</div>
              <div v-if="w.username" class="wh-username">@{{ w.username }}</div>
            </div>
          </div>
          <div class="wh-url" :title="w.url">
            {{ w.url.slice(0, 55) }}...
          </div>
          <div class="wh-stats-row">
            <span class="stat-chip">📨 {{ (w as any).send_count ?? 0 }} envois</span>
            <span v-if="(w as any).last_sent" class="stat-chip">🕐 {{ relTime((w as any).last_sent) }}</span>
            <span v-if="(w as any).send_count > 0"
              :class="['stat-chip', successRate(w) >= 90 ? 'chip-ok' : successRate(w) >= 70 ? 'chip-warn' : 'chip-err']">
              ✓ {{ successRate(w) }}%
            </span>
          </div>
          <div class="wh-actions">
            <button @click="test(w)" class="btn-secondary">🧪 Tester</button>
            <button @click="useInBuilder(w.id)" class="btn-primary">⚡ Utiliser</button>
            <button @click="openForm(w)" class="btn-secondary">✏️</button>
            <button @click="remove(w)" class="btn-danger-sm">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editing ? 'Modifier webhook' : 'Ajouter un webhook' }}</h3>
        <div class="section">
          <label class="fh-label">Nom *</label>
          <input v-model="form.name" placeholder="Ex: #général, Alertes prod" class="fh-input" autofocus />
        </div>
        <div class="section">
          <label class="fh-label">URL Webhook Discord *</label>
          <input v-model="form.url" placeholder="https://discord.com/api/webhooks/..." class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Username override</label>
          <input v-model="form.username" placeholder="Nom affiché (laisser vide = défaut)" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Avatar override (URL)</label>
          <input v-model="form.avatar_url" placeholder="https://... (laisser vide = défaut)" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Catégorie</label>
          <input v-model="form.category" placeholder="default" class="fh-input" list="categories" />
          <datalist id="categories">
            <option v-for="c in existingCategories" :key="c" :value="c" />
          </datalist>
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button @click="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Sauvegarde...' : (editing ? 'Modifier' : 'Ajouter') }}
          </button>
          <button @click="closeForm" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWebhooksStore } from '../stores/webhooks'
import { useEmbedStore } from '../stores/embed'
import { useUiStore } from '../stores/ui'
import { useRouter } from 'vue-router'
import type { Webhook } from '../types/app'

const store = useWebhooksStore()
const embedStore = useEmbedStore()
const ui = useUiStore()
const router = useRouter()

const showForm = ref(false)
const editing = ref<Webhook | null>(null)
const submitting = ref(false)
const formError = ref('')
const form = ref({ name: '', url: '', username: '', avatar_url: '', category: 'default' })

const grouped = computed(() => {
  return store.webhooks.reduce((acc, w) => {
    if (!acc[w.category]) acc[w.category] = []
    acc[w.category].push(w)
    return acc
  }, {} as Record<string, Webhook[]>)
})

const existingCategories = computed(() => [...new Set(store.webhooks.map(w => w.category))])

function successRate(w: any): number {
  if (!w.send_count) return 0
  return Math.round(((w.success_count ?? 0) / w.send_count) * 100)
}

function relTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

onMounted(() => store.load())

function openForm(w?: Webhook) {
  editing.value = w ?? null
  form.value = w
    ? { name: w.name, url: w.url, username: w.username ?? '', avatar_url: w.avatar_url ?? '', category: w.category }
    : { name: '', url: '', username: '', avatar_url: '', category: 'default' }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function submit() {
  formError.value = ''
  if (!form.value.name || !form.value.url) { formError.value = 'Nom et URL requis'; return }
  submitting.value = true
  try {
    if (editing.value) {
      await store.update(editing.value.id, form.value as any)
      ui.notify('Webhook modifié')
    } else {
      await store.create(form.value as any)
      ui.notify('Webhook ajouté !')
    }
    closeForm()
  } catch (e: any) {
    formError.value = e.response?.data?.error ?? 'Erreur'
  } finally {
    submitting.value = false
  }
}

async function test(w: Webhook) {
  const r = await store.test(w.id)
  ui.notify(r.ok ? `✅ ${w.name} — OK` : `❌ Test échoué: ${r.error}`, r.ok ? 'success' : 'error')
}

function useInBuilder(id: number) {
  embedStore.selectedWebhookId = id
  router.push('/embed')
}

async function remove(w: Webhook) {
  if (!confirm(`Supprimer le webhook "${w.name}" ?`)) return
  await store.remove(w.id)
  ui.notify(`Webhook "${w.name}" supprimé`)
}
</script>

<style scoped>
.wh-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.wh-avatar { width: 40px; height: 40px; border-radius: 50%; }
.wh-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background: #40444b; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.wh-name { font-weight: 700; font-size: 15px; color: #fff; }
.wh-username { font-size: 12px; color: var(--text-muted); }
.wh-url { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; word-break: break-all; font-family: monospace; }
.wh-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.wh-stats-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.stat-chip { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 12px; padding: 2px 9px; font-size: 11px; color: var(--text-muted); }
.chip-ok { background: rgba(87,242,135,.1); color: #57f287; border-color: rgba(87,242,135,.3); }
.chip-warn { background: rgba(255,163,67,.1); color: #ffa343; border-color: rgba(255,163,67,.3); }
.chip-err { background: rgba(237,66,69,.1); color: #ed4245; border-color: rgba(237,66,69,.3); }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; }
</style>
