<template>
  <div class="page">
    <div class="page-header">
      <h1>📋 Templates</h1>
      <button @click="openForm()" class="btn-primary">+ Nouveau template</button>
    </div>

    <div v-for="(group, cat) in grouped" :key="cat" class="category-group">
      <div class="category-label">📁 {{ cat }}</div>
      <div class="grid-3">
        <div v-for="t in group" :key="t.id" class="card template-card" @click="use(t)">
          <div class="tpl-accent" :style="{ background: t.preview_color }" />
          <div class="tpl-name">{{ t.name }}</div>
          <p v-if="t.description" class="tpl-desc">{{ t.description }}</p>
          <div class="tpl-actions" @click.stop>
            <button @click="use(t)" class="btn-primary" style="font-size:12px;padding:4px 10px">⚡ Utiliser</button>
            <button @click="openEdit(t)" class="btn-secondary" style="font-size:12px;padding:4px 10px">✏️</button>
            <button @click="remove(t.id)" class="btn-danger-sm">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!templates.length" class="empty-state">
      Aucun template. Créez-en depuis l'Embed Builder (bouton "Sauver comme template").
    </div>

    <!-- Create/edit modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal" style="max-width:600px">
        <h3>{{ editing ? 'Modifier template' : 'Nouveau template' }}</h3>
        <div class="section">
          <label class="fh-label">Nom *</label>
          <input v-model="form.name" placeholder="Ex: Annonce mise à jour" class="fh-input" autofocus />
        </div>
        <div class="section">
          <label class="fh-label">Description</label>
          <input v-model="form.description" placeholder="Description courte..." class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Catégorie</label>
          <input v-model="form.category" placeholder="general" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Couleur preview (hex)</label>
          <input v-model="form.preview_color" placeholder="#5865F2" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Payload JSON Discord *</label>
          <textarea v-model="form.payloadStr" placeholder='{"content":"...","embeds":[...]}' class="fh-textarea" rows="8" />
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button @click="submit" class="btn-primary">{{ editing ? 'Modifier' : 'Créer' }}</button>
          <button @click="showForm = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../api/client'
import type { Template } from '../types/app'
import { useUiStore } from '../stores/ui'
import { useEmbedStore } from '../stores/embed'
import { useRouter } from 'vue-router'

const ui = useUiStore()
const embedStore = useEmbedStore()
const router = useRouter()
const templates = ref<Template[]>([])
const showForm = ref(false)
const editing = ref<Template | null>(null)
const formError = ref('')
const form = ref({ name: '', description: '', category: 'general', preview_color: '#5865F2', payloadStr: '{"content":"","embeds":[]}' })

const grouped = computed(() =>
  templates.value.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, Template[]>)
)

onMounted(async () => {
  const { data } = await api.get('/templates')
  templates.value = data
})

function openForm() {
  editing.value = null
  form.value = { name: '', description: '', category: 'general', preview_color: '#5865F2', payloadStr: '' }
  formError.value = ''
  showForm.value = true
}

function openEdit(t: Template) {
  editing.value = t
  form.value = {
    name: t.name,
    description: t.description ?? '',
    category: t.category,
    preview_color: t.preview_color,
    payloadStr: typeof t.payload === 'string' ? t.payload : JSON.stringify(JSON.parse(t.payload), null, 2),
  }
  formError.value = ''
  showForm.value = true
}

async function submit() {
  formError.value = ''
  if (!form.value.name || !form.value.payloadStr) { formError.value = 'Nom et payload requis'; return }
  let payload: object
  try { payload = JSON.parse(form.value.payloadStr) } catch { formError.value = 'JSON invalide'; return }
  try {
    if (editing.value) {
      await api.put(`/templates/${editing.value.id}`, { ...form.value, payload })
    } else {
      await api.post('/templates', { ...form.value, payload })
    }
    const { data } = await api.get('/templates')
    templates.value = data
    showForm.value = false
    ui.notify(editing.value ? 'Template modifié' : 'Template créé !')
  } catch (e: any) {
    formError.value = e.response?.data?.error ?? 'Erreur'
  }
}

function use(t: Template) {
  try {
    const payload = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload
    embedStore.loadTemplate(payload)
    router.push('/embed')
    ui.notify(`Template "${t.name}" chargé`)
  } catch {
    ui.notify('Impossible de charger ce template', 'error')
  }
}

async function remove(id: number) {
  await api.delete(`/templates/${id}`)
  templates.value = templates.value.filter(t => t.id !== id)
  ui.notify('Template supprimé')
}
</script>

<style scoped>
.template-card { cursor: pointer; transition: transform 0.1s; }
.template-card:hover { transform: translateY(-2px); }
.tpl-accent { height: 4px; border-radius: 4px 4px 0 0; margin: -16px -16px 12px -16px; }
.tpl-name { font-weight: 700; font-size: 15px; color: #fff; margin-bottom: 4px; }
.tpl-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.tpl-actions { display: flex; gap: 6px; align-items: center; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; }
</style>
