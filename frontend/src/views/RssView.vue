<template>
  <div class="page">
    <div class="page-header">
      <h1>📰 Flux RSS</h1>
      <div style="display:flex;gap:8px">
        <button @click="openRssdi" class="btn-secondary rssdi-btn" title="Importer depuis RSSDI">
          🔗 Accès RSSDI
        </button>
        <button @click="openForm()" class="btn-primary">+ Ajouter un flux</button>
      </div>
    </div>

    <!-- Onglets -->
    <div class="tabs mb-4">
      <button :class="['tab', activeTab === 'feeds' ? 'tab-active' : '']" @click="activeTab = 'feeds'">
        📡 Mes flux ({{ feeds.length }})
      </button>
      <button :class="['tab', activeTab === 'rssdi' ? 'tab-active' : '']" @click="activeTab = 'rssdi'; loadRssdi()">
        🌐 RSSDI — Flux publics
      </button>
    </div>

    <!-- Tab : Mes flux locaux -->
    <div v-if="activeTab === 'feeds'">
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
        <div v-if="!feeds.length" class="empty-state">
          Aucun flux RSS configuré.<br />
          <span style="font-size:12px">Utilisez "Accès RSSDI" pour importer des flux existants de votre instance RSSDI.</span>
        </div>
      </div>
    </div>

    <!-- Tab : RSSDI -->
    <div v-if="activeTab === 'rssdi'">
      <div class="rssdi-banner">
        <div class="rssdi-info">
          <span class="rssdi-icon">🌐</span>
          <div>
            <strong>RSSDI — Votre instance RSS</strong>
            <p>Importez directement vos flux RSS depuis votre instance RSSDI.</p>
          </div>
        </div>
        <a :href="rssdiUrl" target="_blank" rel="noopener" class="btn-secondary">
          Ouvrir RSSDI ↗
        </a>
      </div>

      <div v-if="rssdiLoading" class="rssdi-loading">
        <div class="spinner" />
        Chargement des flux RSSDI...
      </div>
      <div v-else-if="rssdiError" class="rssdi-error">
        ⚠️ {{ rssdiError }}
        <button @click="loadRssdi" class="btn-secondary ml-2">Réessayer</button>
      </div>
      <div v-else>
        <div v-if="rssdiFeeds.length" class="rssdi-grid">
          <div v-for="f in rssdiFeeds" :key="f.id" class="rssdi-card">
            <div class="rssdi-card-top">
              <div class="rssdi-card-name">{{ f.name }}</div>
              <span :class="['badge', f.enabled ? 'badge-success' : 'badge-error']" style="font-size:10px">
                {{ f.enabled ? 'Actif' : 'Inactif' }}
              </span>
            </div>
            <div class="rssdi-card-url">{{ f.url }}</div>
            <div class="rssdi-card-meta" v-if="f.last_checked">
              Dernier check: {{ fmtDate(f.last_checked) }}
            </div>
            <div class="rssdi-card-actions">
              <button @click="importFromRssdi(f)" class="btn-primary" style="font-size:12px;padding:5px 10px">
                ⬇ Importer dans ForgeHook
              </button>
              <a :href="`${rssdiUrl}/feed/${f.id}`" target="_blank" rel="noopener" class="btn-secondary" style="font-size:12px;padding:5px 10px">
                Voir ↗
              </a>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          Aucun flux trouvé sur RSSDI.<br />
          <a :href="rssdiUrl" target="_blank" rel="noopener" style="color:var(--accent)">Ouvrir RSSDI pour en créer →</a>
        </div>
      </div>

      <!-- Articles récents RSSDI -->
      <div v-if="rssdiFeeds.length && rssdiArticles.length" class="mt-4">
        <h3 class="section-title-sm">📄 Derniers articles RSSDI</h3>
        <div class="articles-list">
          <a v-for="art in rssdiArticles.slice(0, 20)" :key="art.id"
            :href="art.link" target="_blank" rel="noopener" class="article-row">
            <div class="article-feed-name">{{ art.feed_name }}</div>
            <div class="article-title">{{ art.title }}</div>
            <div class="article-date">{{ fmtDate(art.published_at) }}</div>
          </a>
        </div>
      </div>
    </div>

    <!-- Modal ajouter/modifier flux -->
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
            Variables: <code>&#123;&#123;title&#125;&#125;</code>, <code>&#123;&#123;link&#125;&#125;</code>,
            <code>&#123;&#123;content&#125;&#125;</code>, <code>&#123;&#123;author&#125;&#125;</code>
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
const activeTab = ref<'feeds' | 'rssdi'>('feeds')

// RSSDI integration
const rssdiUrl = import.meta.env.VITE_RSSDI_URL ?? 'https://rssdi.heiphaistos.org'
const rssdiLoading = ref(false)
const rssdiError = ref('')
const rssdiFeeds = ref<any[]>([])
const rssdiArticles = ref<any[]>([])

onMounted(async () => {
  const [f, w] = await Promise.all([api.get('/rss'), api.get('/webhooks')])
  feeds.value = f.data
  webhooks.value = w.data
})

function openRssdi() {
  activeTab.value = 'rssdi'
  loadRssdi()
}

async function loadRssdi() {
  rssdiLoading.value = true
  rssdiError.value = ''
  try {
    const [feedsRes, articlesRes] = await Promise.allSettled([
      fetch(`${rssdiUrl}/api/feeds`, { credentials: 'include' }),
      fetch(`${rssdiUrl}/api/articles?limit=20`, { credentials: 'include' }),
    ])
    if (feedsRes.status === 'fulfilled' && feedsRes.value.ok) {
      const data = await feedsRes.value.json()
      rssdiFeeds.value = Array.isArray(data) ? data : (data.feeds ?? data.items ?? [])
    } else {
      rssdiError.value = 'Impossible d\'accéder à RSSDI. Assurez-vous d\'être connecté à votre instance.'
    }
    if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
      const data = await articlesRes.value.json()
      rssdiArticles.value = Array.isArray(data) ? data : (data.articles ?? data.items ?? [])
    }
  } catch {
    rssdiError.value = 'Erreur de connexion à RSSDI. Vérifiez que l\'instance est accessible.'
  } finally {
    rssdiLoading.value = false
  }
}

function importFromRssdi(rssdiF: any) {
  form.value = {
    name: rssdiF.name ?? rssdiF.title ?? 'Flux importé',
    url: rssdiF.url ?? rssdiF.feed_url ?? '',
    webhook_id: webhooks.value[0]?.id ?? 0,
    check_interval: 3600,
    template: '',
    enabled: true,
  }
  formError.value = ''
  activeTab.value = 'feeds'
  showForm.value = true
}

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
  if (!form.value.name || !form.value.url || !form.value.webhook_id) {
    formError.value = 'Nom, URL et webhook requis'
    return
  }
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
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.ml-2 { margin-left: 8px; }

.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); padding-bottom: 0; }
.tab { background: none; border: none; color: var(--text-muted); padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; font-size: 13px; font-weight: 500; margin-bottom: -1px; }
.tab:hover { color: #fff; }
.tab-active { color: #fff; border-bottom-color: var(--accent); }

.feed-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.feed-name { font-weight: 700; font-size: 15px; color: #fff; }
.feed-url { font-size: 11px; color: var(--text-muted); font-family: monospace; margin-bottom: 8px; word-break: break-all; }
.feed-meta { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.feed-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.empty-state { color: var(--text-muted); padding: 48px; text-align: center; grid-column: 1 / -1; line-height: 1.8; }
.rssdi-btn { border-color: #5865f2; color: #5865f2; }
.rssdi-btn:hover { background: rgba(88,101,242,.15); }

/* RSSDI tab */
.rssdi-banner { display: flex; align-items: center; justify-content: space-between; background: rgba(88,101,242,.1); border: 1px solid rgba(88,101,242,.3); border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; }
.rssdi-info { display: flex; align-items: center; gap: 12px; }
.rssdi-icon { font-size: 28px; }
.rssdi-info strong { font-size: 14px; color: #fff; }
.rssdi-info p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.rssdi-loading { display: flex; align-items: center; gap: 10px; color: var(--text-muted); padding: 32px; }
.spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.rssdi-error { color: var(--danger); padding: 16px; background: rgba(237,66,69,.1); border-radius: 8px; border: 1px solid rgba(237,66,69,.3); }
.rssdi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.rssdi-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
.rssdi-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.rssdi-card-name { font-weight: 700; font-size: 14px; color: #fff; flex: 1; }
.rssdi-card-url { font-size: 11px; color: var(--text-muted); font-family: monospace; margin-bottom: 6px; word-break: break-all; }
.rssdi-card-meta { font-size: 11px; color: var(--text-muted); margin-bottom: 8px; }
.rssdi-card-actions { display: flex; gap: 6px; }

/* Articles */
.section-title-sm { font-size: 14px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.articles-list { display: flex; flex-direction: column; gap: 2px; }
.article-row { display: grid; grid-template-columns: 120px 1fr auto; align-items: center; gap: 12px; padding: 8px 12px; background: var(--bg-secondary); border-radius: 6px; text-decoration: none; color: inherit; border: 1px solid transparent; transition: border-color .15s; }
.article-row:hover { border-color: var(--accent); }
.article-feed-name { font-size: 11px; color: var(--accent); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.article-title { font-size: 13px; color: #dcddde; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.article-date { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
</style>
