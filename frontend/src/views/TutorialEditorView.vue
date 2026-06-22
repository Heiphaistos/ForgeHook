<template>
  <div class="tutorial-editor">
    <div class="editor-topbar">
      <input v-model="tutorial.title" placeholder="Titre du tutoriel..." class="fh-input title-input" />
      <div class="topbar-actions">
        <button @click="previewMode = !previewMode" class="btn-secondary">
          {{ previewMode ? '✏️ Éditer' : '👁 Aperçu' }}
        </button>
        <label class="publish-toggle">
          <input type="checkbox" :checked="!!tutorial.published" @change="tutorial.published = tutorial.published ? 0 : 1" />
          Publié
        </label>
        <button @click="save" class="btn-primary" :disabled="saving">
          {{ saving ? 'Sauvegarde...' : '💾 Sauvegarder' }}
        </button>
        <router-link to="/tutorials" class="btn-secondary">← Retour</router-link>
      </div>
    </div>

    <input v-model="tutorial.description" placeholder="Description courte (optionnel)" class="fh-input desc-input" />

    <!-- Éditeur de blocs -->
    <div v-if="!previewMode" class="blocks-area">
      <draggable v-model="tutorial.blocks" item-key="id" handle=".drag-handle" animation="150">
        <template #item="{ element: block, index: i }">
          <div class="block-wrapper">
            <div class="block-controls">
              <span class="drag-handle" title="Déplacer">⠿</span>
              <span class="block-type-label">{{ block.type }}</span>
              <div class="block-btns">
                <button @click="duplicate(i)" title="Dupliquer" class="ctrl-btn">⧉</button>
                <button @click="moveBlock(i, -1)" :disabled="i === 0" class="ctrl-btn">↑</button>
                <button @click="moveBlock(i, 1)" :disabled="i === tutorial.blocks.length - 1" class="ctrl-btn">↓</button>
                <button @click="removeBlock(i)" class="ctrl-btn danger">✕</button>
              </div>
            </div>

            <!-- Text block -->
            <div v-if="block.type === 'text'" class="block-content">
              <textarea v-model="block.content"
                placeholder="Texte — **gras**, *italique*, `code`, [lien](url), ~~barré~~"
                class="fh-textarea block-textarea" rows="5" />
            </div>

            <!-- Image block -->
            <div v-else-if="block.type === 'image'" class="block-content">
              <input v-model="block.content.url" placeholder="URL de l'image" class="fh-input" />
              <input v-model="block.content.caption" placeholder="Légende (optionnel)" class="fh-input mt-1" />
              <div v-if="block.content.url" class="img-preview">
                <img :src="block.content.url" alt="" @error="($event.target as HTMLImageElement).style.display='none'" />
              </div>
            </div>

            <!-- Video block -->
            <div v-else-if="block.type === 'video'" class="block-content">
              <input v-model="block.content.url" placeholder="URL vidéo (YouTube, MP4 direct...)" class="fh-input" />
              <input v-model="block.content.caption" placeholder="Légende (optionnel)" class="fh-input mt-1" />
              <div v-if="isYoutube(block.content.url)" class="video-embed-preview">
                <iframe :src="youtubeEmbed(block.content.url)" allowfullscreen width="480" height="270" />
              </div>
            </div>

            <!-- Code block -->
            <div v-else-if="block.type === 'code'" class="block-content">
              <div class="row mb-2">
                <input v-model="block.content.language" placeholder="js" class="fh-input" style="width:100px" />
                <input v-model="block.content.filename" placeholder="Nom du fichier (optionnel)" class="fh-input" />
              </div>
              <textarea v-model="block.content.code" placeholder="// Code ici" class="fh-textarea code-ta" rows="8" spellcheck="false" />
            </div>

            <!-- Embed block -->
            <div v-else-if="block.type === 'embed'" class="block-content embed-in-tutorial">
              <EmbedBuilder v-model="block.content" />
              <div class="embed-preview-inline">
                <EmbedPreview :embed="block.content" />
              </div>
            </div>

            <!-- Separator -->
            <div v-else-if="block.type === 'separator'" class="block-content separator-block">
              <hr />
              <span style="font-size:11px;color:var(--text-muted)">Séparateur</span>
            </div>

            <!-- Callout block -->
            <div v-else-if="block.type === 'callout'" class="block-content">
              <select v-model="block.content.type" class="fh-select mb-2">
                <option value="info">ℹ️ Info</option>
                <option value="warning">⚠️ Avertissement</option>
                <option value="success">✅ Succès</option>
                <option value="danger">❌ Danger</option>
              </select>
              <textarea v-model="block.content.text" placeholder="Contenu du callout..." class="fh-textarea" rows="3" />
            </div>
          </div>
        </template>
      </draggable>

      <!-- Add block palette -->
      <div class="add-palette">
        <span class="palette-label">+ Ajouter un bloc</span>
        <button v-for="bt in blockTypes" :key="bt.type" @click="addBlock(bt.type)" class="add-block-btn">
          {{ bt.icon }} {{ bt.label }}
        </button>
      </div>
    </div>

    <!-- Preview mode -->
    <div v-else class="preview-render">
      <article class="tutorial-article">
        <h1>{{ tutorial.title }}</h1>
        <p v-if="tutorial.description" class="article-desc">{{ tutorial.description }}</p>
        <hr />
        <div v-for="block in tutorial.blocks" :key="block.id" class="rendered-block">
          <div v-if="block.type === 'text'" class="text-render" v-html="renderText(block.content)" />
          <figure v-else-if="block.type === 'image'" class="img-render">
            <img :src="block.content.url" alt="" />
            <figcaption v-if="block.content.caption">{{ block.content.caption }}</figcaption>
          </figure>
          <div v-else-if="block.type === 'video'" class="video-render">
            <iframe v-if="isYoutube(block.content.url)" :src="youtubeEmbed(block.content.url)" allowfullscreen width="640" height="360" />
            <video v-else :src="block.content.url" controls style="max-width:100%" />
            <p v-if="block.content.caption" class="caption">{{ block.content.caption }}</p>
          </div>
          <div v-else-if="block.type === 'code'" class="code-render">
            <div class="code-header">
              <span v-if="block.content.filename">{{ block.content.filename }}</span>
              <span class="code-lang">{{ block.content.language }}</span>
            </div>
            <pre><code>{{ block.content.code }}</code></pre>
          </div>
          <EmbedPreview v-else-if="block.type === 'embed'" :embed="block.content" />
          <hr v-else-if="block.type === 'separator'" />
          <div v-else-if="block.type === 'callout'" :class="['callout', `callout-${block.content.type}`]" v-html="renderText(block.content.text)" />
        </div>
      </article>
    </div>

    <p v-if="saveMsg" class="success" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#57f287;color:#000;padding:10px 20px;border-radius:8px;font-weight:700">
      {{ saveMsg }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import EmbedPreview from '../components/preview/EmbedPreview.vue'
import api from '../api/client'
import { emptyEmbed } from '../types/discord'
import type { Tutorial, TutorialBlock } from '../types/app'

// Note: for drag-and-drop install: npm install vuedraggable@next
// Fallback: manual moveBlock works without it
let draggable: any
try { draggable = (await import('vuedraggable')).default } catch { draggable = { name: 'draggable', template: '<div><slot /><slot name="item" v-for="(el, i) in modelValue" :element="el" :index="i" /></div>', props: ['modelValue', 'itemKey', 'handle', 'animation'] } }

const route = useRoute()
const router = useRouter()
const previewMode = ref(false)
const saving = ref(false)
const saveMsg = ref('')

const tutorial = ref<Tutorial>({ id: 0, title: '', description: '', blocks: [], published: 0 })

const blockTypes = [
  { type: 'text', icon: '📝', label: 'Texte' },
  { type: 'image', icon: '🖼', label: 'Image' },
  { type: 'video', icon: '🎬', label: 'Vidéo' },
  { type: 'code', icon: '💻', label: 'Code' },
  { type: 'embed', icon: '📦', label: 'Embed Discord' },
  { type: 'callout', icon: '💡', label: 'Callout' },
  { type: 'separator', icon: '─', label: 'Séparateur' },
] as const

onMounted(async () => {
  const id = route.params.id
  if (id && id !== 'new') {
    const { data } = await api.get(`/tutorials/${id}`)
    tutorial.value = data
  }
})

function defaultContent(type: string): any {
  const map: Record<string, any> = {
    text: '',
    image: { url: '', caption: '' },
    video: { url: '', caption: '' },
    code: { language: 'js', code: '', filename: '' },
    embed: emptyEmbed(),
    callout: { type: 'info', text: '' },
    separator: null,
  }
  return map[type]
}

function addBlock(type: string) {
  tutorial.value.blocks.push({ id: crypto.randomUUID(), type: type as any, content: defaultContent(type) })
}

function removeBlock(i: number) { tutorial.value.blocks.splice(i, 1) }

function moveBlock(i: number, dir: -1 | 1) {
  const b = tutorial.value.blocks
  const j = i + dir
  if (j < 0 || j >= b.length) return
  ;[b[i], b[j]] = [b[j], b[i]]
}

function duplicate(i: number) {
  const copy = JSON.parse(JSON.stringify(tutorial.value.blocks[i]))
  copy.id = crypto.randomUUID()
  tutorial.value.blocks.splice(i + 1, 0, copy)
}

async function save() {
  saving.value = true
  try {
    if (tutorial.value.id) {
      await api.put(`/tutorials/${tutorial.value.id}`, tutorial.value)
    } else {
      const { data } = await api.post('/tutorials', tutorial.value)
      tutorial.value.id = data.id
      router.replace(`/tutorials/${data.id}`)
    }
    saveMsg.value = '✅ Tutoriel sauvegardé !'
    setTimeout(() => { saveMsg.value = '' }, 3000)
  } finally {
    saving.value = false
  }
}

function renderText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>')
}

function isYoutube(url: string): boolean {
  return !!url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

function youtubeEmbed(url: string): string {
  const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
  return `https://www.youtube.com/embed/${id}`
}
</script>

<style scoped>
.tutorial-editor { display: flex; flex-direction: column; height: 100%; gap: 12px; }
.editor-topbar { display: flex; gap: 12px; align-items: center; }
.title-input { flex: 1; font-size: 18px; font-weight: 700; }
.topbar-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.desc-input { max-width: 600px; }
.publish-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--text-muted); }
.publish-toggle input { accent-color: #57f287; }

.blocks-area { flex: 1; overflow-y: auto; padding-bottom: 24px; }
.block-wrapper { background: var(--bg-secondary); border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border); overflow: hidden; }
.block-controls { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); }
.drag-handle { cursor: grab; font-size: 16px; color: var(--text-muted); user-select: none; }
.block-type-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent); letter-spacing: 0.5px; flex: 1; }
.block-btns { display: flex; gap: 4px; }
.ctrl-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 13px; }
.ctrl-btn:hover { color: #fff; border-color: var(--text-muted); }
.ctrl-btn.danger:hover { color: var(--danger); border-color: var(--danger); }
.ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.block-content { padding: 14px; }
.block-textarea { min-height: 100px; }
.code-ta { font-family: 'Consolas', monospace; font-size: 13px; }
.img-preview { margin-top: 10px; }
.img-preview img { max-width: 100%; max-height: 300px; border-radius: 6px; object-fit: cover; }
.video-embed-preview { margin-top: 10px; }
.video-embed-preview iframe { border: none; border-radius: 6px; }
.separator-block { display: flex; align-items: center; gap: 12px; }
.embed-in-tutorial { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.embed-preview-inline { background: #36393f; border-radius: 8px; padding: 12px; }

.add-palette { background: var(--bg-secondary); border-radius: 8px; padding: 14px; border: 1px dashed var(--border); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.palette-label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-right: 4px; }
.add-block-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-primary); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 12px; transition: all 0.12s; }
.add-block-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Preview render */
.preview-render { flex: 1; overflow-y: auto; }
.tutorial-article { max-width: 800px; margin: 0 auto; line-height: 1.7; }
.tutorial-article h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
.article-desc { color: var(--text-muted); font-size: 16px; margin-bottom: 16px; }
.rendered-block { margin-bottom: 24px; }
.text-render { font-size: 16px; color: var(--text-primary); }
.text-render :deep(strong) { font-weight: 700; }
.text-render :deep(code) { background: #202225; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 14px; }
.text-render :deep(a) { color: var(--accent); }
.img-render img { max-width: 100%; border-radius: 8px; }
.img-render figcaption { font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 6px; }
.video-render iframe, .video-render video { border-radius: 8px; border: none; max-width: 100%; }
.caption { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.code-render { background: #1e2127; border-radius: 8px; overflow: hidden; }
.code-header { display: flex; justify-content: space-between; padding: 8px 14px; background: #171a1f; font-size: 12px; }
.code-lang { color: var(--accent); font-weight: 700; font-size: 11px; text-transform: uppercase; }
.code-render pre { padding: 16px; overflow-x: auto; font-family: 'Consolas', monospace; font-size: 13px; color: #abb2bf; }
.callout { padding: 14px 18px; border-radius: 8px; border-left: 4px solid; margin: 8px 0; font-size: 15px; }
.callout-info { background: rgba(88,101,242,.12); border-color: var(--accent); }
.callout-warning { background: rgba(254,231,92,.1); border-color: var(--warning); }
.callout-success { background: rgba(87,242,135,.1); border-color: var(--success); }
.callout-danger { background: rgba(237,66,69,.1); border-color: var(--danger); }
</style>
