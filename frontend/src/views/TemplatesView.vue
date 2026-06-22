<template>
  <div class="page">
    <div class="page-header">
      <h1>📋 Templates</h1>
      <button @click="openForm()" class="btn-primary">+ Nouveau template</button>
    </div>

    <!-- Barre filtres/tri -->
    <div class="filters-bar">
      <input v-model="search" placeholder="🔍 Rechercher..." class="fh-input filter-search" />
      <select v-model="sortBy" class="fh-select">
        <option value="name">Trier par nom</option>
        <option value="category">Trier par catégorie</option>
        <option value="date">Trier par date</option>
      </select>
      <div class="cat-pills">
        <button v-for="c in allCategories" :key="c"
          :class="['pill', { active: filterCat === c }]"
          @click="filterCat = filterCat === c ? '' : c">
          {{ c }}
        </button>
      </div>
    </div>

    <div v-if="!filteredTemplates.length" class="empty-state">
      {{ templates.length ? 'Aucun résultat pour ce filtre.' : 'Aucun template. Créez-en depuis l\'Embed Builder (bouton "Sauver comme template").' }}
    </div>

    <div v-for="(group, cat) in groupedFiltered" :key="cat" class="category-group">
      <div class="category-label">📁 {{ cat }}</div>
      <div class="grid-3">
        <div v-for="t in group" :key="t.id" class="card template-card">
          <div class="tpl-accent" :style="{ background: t.preview_color || '#5865F2' }" />
          <div class="tpl-header">
            <div class="tpl-name">{{ t.name }}</div>
            <div v-if="vars(t).length" class="vars-badge" :title="vars(t).join(', ')">
              {{ vars(t).length }} var{{ vars(t).length > 1 ? 's' : '' }}
            </div>
          </div>
          <p v-if="t.description" class="tpl-desc">{{ t.description }}</p>
          <div v-if="vars(t).length" class="vars-chips">
            <span v-for="v in vars(t).slice(0, 4)" :key="v" class="var-chip" v-text="'{{' + v + '}}'"></span>
            <span v-if="vars(t).length > 4" class="var-chip muted">+{{ vars(t).length - 4 }}</span>
          </div>
          <div class="tpl-actions" @click.stop>
            <button @click="use(t)" class="btn-primary" style="font-size:12px;padding:4px 10px">⚡ Utiliser</button>
            <button @click="openPreview(t)" class="btn-secondary" style="font-size:12px;padding:4px 10px">👁 Preview</button>
            <button @click="duplicate(t)" class="btn-secondary" style="font-size:12px;padding:4px 10px">⎘ Dupliquer</button>
            <button @click="openEdit(t)" class="btn-secondary" style="font-size:12px;padding:4px 10px">✏️</button>
            <button @click="remove(t.id)" class="btn-danger-sm">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Variables Fill-in -->
    <div v-if="varsModal" class="modal-overlay" @click.self="varsModal = null">
      <div class="modal" style="max-width:480px">
        <h3>🔤 Remplir les variables</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
          Template : <strong>{{ varsModal.tpl.name }}</strong>
        </p>
        <div v-for="v in varsModal.vars" :key="v" class="section">
          <label class="fh-label">{{ v }}</label>
          <input v-model="varsModal.values[v]" :placeholder="`Valeur pour {{${v}}}`" class="fh-input" />
        </div>
        <div class="modal-actions">
          <button @click="applyVars" class="btn-primary">⚡ Utiliser</button>
          <button @click="varsModal = null" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal Preview -->
    <div v-if="previewTarget" class="modal-overlay" @click.self="previewTarget = null">
      <div class="modal" style="max-width:620px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>👁 Preview — {{ previewTarget.name }}</h3>
          <button @click="previewTarget = null" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer">✕</button>
        </div>
        <div class="discord-preview-wrap">
          <div v-if="previewPayload(previewTarget).content" class="preview-content">
            {{ previewPayload(previewTarget).content }}
          </div>
          <div v-for="(embed, i) in previewPayload(previewTarget).embeds ?? []" :key="i"
            class="preview-embed"
            :style="{ borderLeftColor: embed.color ? '#' + embed.color.toString(16).padStart(6,'0') : '#5865F2' }">
            <div v-if="embed.author?.name" class="pe-author">{{ embed.author.name }}</div>
            <div v-if="embed.title" class="pe-title">{{ embed.title }}</div>
            <div v-if="embed.description" class="pe-desc">{{ embed.description }}</div>
            <div v-if="embed.fields?.length" class="pe-fields">
              <div v-for="f in embed.fields" :key="f.name" class="pe-field" :class="{ inline: f.inline }">
                <div class="pe-fname">{{ f.name }}</div>
                <div class="pe-fval">{{ f.value }}</div>
              </div>
            </div>
            <div v-if="embed.footer?.text" class="pe-footer">{{ embed.footer.text }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="use(previewTarget!); previewTarget = null" class="btn-primary">⚡ Utiliser</button>
          <button @click="previewTarget = null" class="btn-secondary">Fermer</button>
        </div>
      </div>
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
          <input v-model="form.category" placeholder="general" class="fh-input" list="tpl-categories" />
          <datalist id="tpl-categories">
            <option v-for="c in allCategories" :key="c" :value="c" />
          </datalist>
        </div>
        <div class="section">
          <label class="fh-label">Couleur preview (hex)</label>
          <input v-model="form.preview_color" placeholder="#5865F2" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Payload JSON Discord *</label>
          <textarea v-model="form.payloadStr" placeholder='{"content":"...","embeds":[...]}' class="fh-textarea" rows="8" />
          <div v-if="formVars.length" class="vars-detected">
            Variables détectées : <span v-for="v in formVars" :key="v" class="var-chip" v-text="'{{' + v + '}}'"></span>
          </div>
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
const search = ref('')
const sortBy = ref<'name' | 'category' | 'date'>('name')
const filterCat = ref('')
const previewTarget = ref<Template | null>(null)
const varsModal = ref<{ tpl: Template; vars: string[]; values: Record<string, string> } | null>(null)

const allCategories = computed(() => [...new Set(templates.value.map(t => t.category))])

const formVars = computed(() => extractVars(form.value.payloadStr))

const filteredTemplates = computed(() => {
  let list = templates.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
  }
  if (filterCat.value) list = list.filter(t => t.category === filterCat.value)
  if (sortBy.value === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  else if (sortBy.value === 'category') list = [...list].sort((a, b) => a.category.localeCompare(b.category))
  return list
})

const groupedFiltered = computed(() =>
  filteredTemplates.value.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, Template[]>)
)

function extractVars(str: string): string[] {
  const matches = str.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

function vars(t: Template): string[] {
  const payload = typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload)
  return extractVars(payload)
}

function previewPayload(t: Template): any {
  try {
    return typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload
  } catch { return {} }
}

onMounted(async () => {
  const { data } = await api.get('/templates')
  templates.value = data
})

function openPreview(t: Template) { previewTarget.value = t }

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
    payloadStr: typeof t.payload === 'string' ? t.payload : JSON.stringify(JSON.parse(t.payload as any), null, 2),
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
    if (editing.value) await api.put(`/templates/${editing.value.id}`, { ...form.value, payload })
    else await api.post('/templates', { ...form.value, payload })
    const { data } = await api.get('/templates')
    templates.value = data
    showForm.value = false
    ui.notify(editing.value ? 'Template modifié' : 'Template créé !')
  } catch (e: any) {
    formError.value = e.response?.data?.error ?? 'Erreur'
  }
}

function use(t: Template) {
  const vs = vars(t)
  if (vs.length) {
    varsModal.value = { tpl: t, vars: vs, values: Object.fromEntries(vs.map(v => [v, ''])) }
    return
  }
  loadTemplate(t, {})
}

function applyVars() {
  if (!varsModal.value) return
  loadTemplate(varsModal.value.tpl, varsModal.value.values)
  varsModal.value = null
}

function loadTemplate(t: Template, values: Record<string, string>) {
  try {
    let raw = typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload)
    for (const [k, v] of Object.entries(values)) {
      raw = raw.replaceAll(`{{${k}}}`, v)
    }
    embedStore.loadTemplate(JSON.parse(raw))
    router.push('/embed')
    ui.notify(`Template "${t.name}" chargé`)
  } catch {
    ui.notify('Impossible de charger ce template', 'error')
  }
}

async function duplicate(t: Template) {
  try {
    const payload = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload
    await api.post('/templates', {
      name: `${t.name} (copie)`,
      description: t.description,
      category: t.category,
      preview_color: t.preview_color,
      payload,
    })
    const { data } = await api.get('/templates')
    templates.value = data
    ui.notify('Template dupliqué')
  } catch {
    ui.notify('Erreur lors de la duplication', 'error')
  }
}

async function remove(id: number) {
  await api.delete(`/templates/${id}`)
  templates.value = templates.value.filter(t => t.id !== id)
  ui.notify('Template supprimé')
}
</script>

<style scoped>
.filters-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.filter-search { flex: 1; min-width: 200px; }
.cat-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--text-muted); cursor: pointer; }
.pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.template-card { cursor: default; transition: transform 0.1s; }
.template-card:hover { transform: translateY(-2px); }
.tpl-accent { height: 4px; border-radius: 4px 4px 0 0; margin: -16px -16px 12px -16px; }
.tpl-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tpl-name { font-weight: 700; font-size: 15px; color: #fff; flex: 1; }
.vars-badge { background: rgba(88,101,242,.25); color: var(--accent); border: 1px solid rgba(88,101,242,.4); border-radius: 12px; padding: 2px 8px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.tpl-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.vars-chips { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.var-chip { background: rgba(88,101,242,.15); border: 1px solid rgba(88,101,242,.3); border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #b5bfe2; font-family: monospace; }
.var-chip.muted { background: var(--bg-tertiary); border-color: var(--border); color: var(--text-muted); }
.tpl-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.vars-detected { margin-top: 8px; font-size: 12px; color: var(--text-muted); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.discord-preview-wrap { background: #36393f; border-radius: 6px; padding: 16px; }
.preview-content { color: #dcddde; font-size: 14px; margin-bottom: 8px; white-space: pre-wrap; }
.preview-embed { background: #2f3136; border-left: 4px solid #5865F2; border-radius: 4px; padding: 12px 16px; margin-bottom: 6px; }
.pe-author { font-size: 12px; font-weight: 600; color: #b9bbbe; margin-bottom: 4px; }
.pe-title { font-weight: 700; color: #fff; margin-bottom: 6px; }
.pe-desc { font-size: 14px; color: #dcddde; white-space: pre-wrap; margin-bottom: 8px; }
.pe-fields { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.pe-field { flex: 1; min-width: 40%; }
.pe-fname { font-size: 12px; font-weight: 600; color: #dcddde; margin-bottom: 2px; }
.pe-fval { font-size: 14px; color: #dcddde; }
.pe-footer { font-size: 12px; color: #72767d; border-top: 1px solid #40444b; padding-top: 6px; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; }
</style>
