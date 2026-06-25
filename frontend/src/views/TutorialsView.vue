<template>
  <div class="page">
    <div class="page-header">
      <h1>📖 Tutoriaux</h1>
      <div style="display:flex;gap:8px">
        <button @click="openImport" class="btn-secondary">📥 Importer Discord</button>
        <router-link to="/tutorials/new" class="btn-primary">+ Nouveau tutoriel</router-link>
      </div>
    </div>

    <div class="grid-2">
      <div v-for="t in tutorials" :key="t.id" class="card tutorial-card">
        <div class="tut-header">
          <span :class="['badge', t.published ? 'badge-success' : 'badge-info']">
            {{ t.published ? '🌐 Publié' : '📝 Brouillon' }}
          </span>
          <div class="tut-date">{{ fmtDate(t.created_at ?? '') }}</div>
        </div>
        <h3 class="tut-title">{{ t.title }}</h3>
        <p v-if="t.description" class="tut-desc">{{ t.description }}</p>
        <div class="tut-blocks">{{ blockCount(t) }}</div>
        <div class="tut-actions">
          <router-link :to="`/tutorials/${t.id}`" class="btn-primary" style="font-size:12px;padding:5px 12px">✏️ Éditer</router-link>
          <button @click="remove(t.id)" class="btn-danger-sm">🗑</button>
        </div>
      </div>
      <div v-if="!tutorials.length" class="empty-state">
        Aucun tutoriel. Créez-en un avec l'éditeur de blocs.
      </div>
    </div>

    <!-- Modal Import Discord -->
    <div v-if="showImport" class="modal-overlay" @click.self="showImport = false">
      <div class="modal import-modal">
        <h3>📥 Importer depuis Discord</h3>

        <!-- Onglets mode -->
        <div class="import-tabs">
          <button :class="['import-tab', { active: importMode === 'paste' }]" @click="switchMode('paste')">📝 Coller du texte</button>
          <button :class="['import-tab', { active: importMode === 'bot' }]" @click="switchMode('bot')">🤖 Via Bot Discord</button>
        </div>

        <!-- MODE PASTE -->
        <template v-if="importMode === 'paste'">
          <p class="import-hint">Colle ici le contenu d'un tutoriel Discord (texte markdown, images, blocs de code…) ou un export JSON DiscordChatExporter.</p>

          <div v-if="importStep === 'paste'" class="section">
            <label class="fh-label">Titre du tutoriel *</label>
            <input v-model="importTitle" placeholder="Mon tutoriel importé" class="fh-input" />
            <label class="fh-label mt-8">Contenu Discord à coller *</label>
            <textarea v-model="importRaw" placeholder="Colle ici le message Discord complet…" class="fh-textarea import-ta" rows="14" spellcheck="false" />
            <p v-if="importError" class="error">{{ importError }}</p>
            <div class="modal-actions">
              <button @click="analyseImport" class="btn-primary" :disabled="!importRaw.trim()">🔍 Analyser</button>
              <button @click="showImport = false" class="btn-secondary">Annuler</button>
            </div>
          </div>

          <div v-else-if="importStep === 'preview'" class="section">
            <div class="import-preview-header">
              <span class="badge badge-success">{{ importBlocks.length }} bloc{{ importBlocks.length > 1 ? 's' : '' }} détecté{{ importBlocks.length > 1 ? 's' : '' }}</span>
            </div>
            <div class="import-blocks-preview">
              <div v-for="(b, i) in importBlocks" :key="i" class="import-block-row">
                <span class="iblk-type">{{ blockIcon(b.type) }} {{ b.type }}</span>
                <span class="iblk-preview">{{ blockPreviewText(b) }}</span>
              </div>
            </div>
            <p v-if="importError" class="error">{{ importError }}</p>
            <div class="modal-actions">
              <button @click="saveImport" class="btn-primary" :disabled="importing">
                {{ importing ? '⏳ Sauvegarde…' : '💾 Créer le tutoriel' }}
              </button>
              <button @click="importStep = 'paste'" class="btn-secondary">← Corriger</button>
              <button @click="showImport = false" class="btn-secondary">Annuler</button>
            </div>
          </div>
        </template>

        <!-- MODE BOT -->
        <template v-else>
          <p class="import-hint">Récupère les messages directement depuis un salon Discord via un bot.</p>

          <div v-if="botStep === 1" class="section">
            <label class="fh-label">Titre du tutoriel *</label>
            <input v-model="importTitle" placeholder="Mon tutoriel importé" class="fh-input" />
            <label class="fh-label mt-8">Bot</label>
            <select v-model="botImportBotId" class="fh-select" @change="botImportChannelId = ''">
              <option :value="null" disabled>— Choisir un bot —</option>
              <option v-for="b in botList" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <div v-if="botImportBotId" class="mt-8">
              <label class="fh-label">Salon / Post de forum</label>
              <BotChannelPicker :bot-id="botImportBotId" @select="onBotChannelSelect" />
            </div>
            <p v-if="importError" class="error mt-8">{{ importError }}</p>
            <div class="modal-actions">
              <button @click="fetchBotMessages" class="btn-primary"
                :disabled="!botImportChannelId || !botImportBotId || botFetching">
                {{ botFetching ? '⏳ Récupération...' : '🔍 Récupérer les messages' }}
              </button>
              <button @click="showImport = false" class="btn-secondary">Annuler</button>
            </div>
          </div>

          <div v-else-if="botStep === 2" class="section">
            <div class="import-preview-header">
              <span class="badge badge-success">{{ importBlocks.length }} bloc{{ importBlocks.length > 1 ? 's' : '' }} détecté{{ importBlocks.length > 1 ? 's' : '' }}</span>
            </div>
            <div class="import-blocks-preview">
              <div v-for="(b, i) in importBlocks" :key="i" class="import-block-row">
                <span class="iblk-type">{{ blockIcon(b.type) }} {{ b.type }}</span>
                <span class="iblk-preview">{{ blockPreviewText(b) }}</span>
              </div>
            </div>
            <p v-if="importError" class="error">{{ importError }}</p>
            <div class="modal-actions">
              <button @click="saveImport" class="btn-primary" :disabled="importing">
                {{ importing ? '⏳ Sauvegarde…' : '💾 Créer le tutoriel' }}
              </button>
              <button @click="botStep = 1" class="btn-secondary">← Retour</button>
              <button @click="showImport = false" class="btn-secondary">Annuler</button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/client'
import { useUiStore } from '../stores/ui'
import BotChannelPicker from '../components/bots/BotChannelPicker.vue'
import type { TutorialBlock } from '../types/app'

const ui = useUiStore()
const router = useRouter()
const tutorials = ref<any[]>([])

// ─── Import Discord ──────────────────────────────────────────────
const showImport = ref(false)
const importMode = ref<'paste' | 'bot'>('paste')
const importStep = ref<'paste' | 'preview'>('paste')
const importRaw = ref('')
const importTitle = ref('')
const importBlocks = ref<TutorialBlock[]>([])
const importError = ref('')
const importing = ref(false)

// Bot import
const botList = ref<{ id: number; name: string }[]>([])
const botImportBotId = ref<number | null>(null)
const botImportChannelId = ref('')
const botFetching = ref(false)
const botStep = ref<1 | 2>(1)

function onBotChannelSelect(sel: { channelId: string } | null) {
  botImportChannelId.value = sel?.channelId ?? ''
}

function switchMode(mode: 'paste' | 'bot') {
  importMode.value = mode
  importError.value = ''
  importBlocks.value = []
  importStep.value = 'paste'
  botStep.value = 1
}

function openImport() {
  importRaw.value = ''
  importTitle.value = ''
  importBlocks.value = []
  importError.value = ''
  importStep.value = 'paste'
  botStep.value = 1
  botImportBotId.value = null
  botImportChannelId.value = ''
  showImport.value = true
  if (!botList.value.length) api.get('/bots').then(r => { botList.value = r.data })
}

async function fetchBotMessages() {
  if (!botImportBotId.value || !botImportChannelId.value) return
  botFetching.value = true
  importError.value = ''
  try {
    const { data } = await api.get(`/bots/${botImportBotId.value}/channels/${botImportChannelId.value}/messages`, {
      params: { limit: 100 },
    })
    const msgs: any[] = data
    if (!msgs.length) { importError.value = 'Aucun message trouvé dans ce canal'; return }

    const blocks: TutorialBlock[] = []
    for (const m of msgs) {
      if (m.content?.trim()) {
        const parsed = parseDiscordMarkdown(m.content.trim())
        blocks.push(...parsed.blocks)
      }
      for (const att of m.attachments ?? []) {
        const url: string = att.url ?? ''
        if (/\.(png|jpg|jpeg|gif|webp)$/i.test(url)) {
          blocks.push(mkBlock('image', { url, caption: att.filename ?? '' }))
        }
      }
      for (const url of m.embed_images ?? []) {
        if (url) blocks.push(mkBlock('image', { url, caption: '' }))
      }
    }

    if (!blocks.length) { importError.value = 'Aucun contenu exploitable trouvé'; return }
    if (!importTitle.value) importTitle.value = 'Tutoriel importé'
    importBlocks.value = blocks
    botStep.value = 2
  } catch (e: any) {
    importError.value = e?.response?.data?.detail ?? e?.response?.data?.error ?? 'Erreur de récupération'
  } finally {
    botFetching.value = false
  }
}

function mkBlock(type: TutorialBlock['type'], content: any): TutorialBlock {
  return { id: crypto.randomUUID(), type, content }
}

function parseDiscordMarkdown(text: string): { title: string; blocks: TutorialBlock[] } {
  const lines = text.split('\n')
  let extractedTitle = ''
  const blocks: TutorialBlock[] = []
  let textBuf: string[] = []
  let i = 0

  function flushText() {
    const parts = textBuf.join('\n').split(/\n\n+/)
    for (const p of parts) {
      const t = p.trim()
      if (t) blocks.push(mkBlock('text', t))
    }
    textBuf = []
  }

  while (i < lines.length) {
    const line = lines[i]
    const trim = line.trim()

    // Code fence
    if (/^```/.test(trim)) {
      flushText()
      const lang = trim.slice(3).trim() || 'txt'
      const code: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        code.push(lines[i])
        i++
      }
      i++
      blocks.push(mkBlock('code', { language: lang, code: code.join('\n'), filename: '' }))
      continue
    }

    // H1 → title capture
    if (!extractedTitle && /^# /.test(line)) {
      extractedTitle = line.replace(/^# /, '').trim()
      i++; continue
    }

    // Separator
    if (/^(---|___|\*\*\*)$/.test(trim) && trim.length <= 3) {
      flushText()
      blocks.push(mkBlock('separator', null))
      i++; continue
    }

    // Blockquote → callout
    if (/^> /.test(line)) {
      flushText()
      const qLines: string[] = []
      while (i < lines.length && /^> /.test(lines[i])) {
        qLines.push(lines[i].replace(/^> ?/, ''))
        i++
      }
      const qText = qLines.join('\n')
      const calloutType = /⚠️|attention|warning/i.test(qText) ? 'warning'
        : /✅|success|réussi/i.test(qText) ? 'success'
        : /❌|danger|erreur|error/i.test(qText) ? 'danger'
        : 'info'
      blocks.push(mkBlock('callout', { type: calloutType, text: qText }))
      continue
    }

    // Standalone image URL
    const isImgUrl = /^https?:\/\/\S+\.(png|jpg|jpeg|gif|webp)(\?\S*)?$/i.test(trim)
    const isCdn = /^https?:\/\/cdn\.discordapp\.com\/attachments\/\S+$/.test(trim)
    const isMedia = /^https?:\/\/media\.discordapp\.net\/\S+$/.test(trim)
    if ((isImgUrl || isCdn || isMedia) && !trim.includes(' ')) {
      flushText()
      blocks.push(mkBlock('image', { url: trim, caption: '' }))
      i++; continue
    }

    // Standalone YouTube URL
    const ytMatch = trim.match(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+$/)
    if (ytMatch && !trim.includes(' ')) {
      flushText()
      blocks.push(mkBlock('video', { url: trim, caption: '' }))
      i++; continue
    }

    textBuf.push(line)
    i++
  }
  flushText()

  return { title: extractedTitle, blocks }
}

function parseDiscordJson(json: string): { title: string; blocks: TutorialBlock[] } {
  const data = JSON.parse(json)
  const messages: any[] = Array.isArray(data) ? data : (data.messages ?? [data])
  const blocks: TutorialBlock[] = []
  let title = data.guild?.name ?? data.channel?.name ?? ''

  for (const msg of messages) {
    if (msg.content) {
      const { title: t, blocks: b } = parseDiscordMarkdown(msg.content)
      if (t && !title) title = t
      blocks.push(...b)
    }
    for (const att of msg.attachments ?? []) {
      const url: string = att.url ?? att.proxyUrl ?? ''
      if (/\.(png|jpg|jpeg|gif|webp)$/i.test(url)) {
        blocks.push(mkBlock('image', { url, caption: att.filename ?? '' }))
      }
    }
  }

  return { title, blocks }
}

function analyseImport() {
  importError.value = ''
  const raw = importRaw.value.trim()
  if (!raw) { importError.value = 'Contenu vide'; return }

  try {
    let result: { title: string; blocks: TutorialBlock[] }
    if ((raw.startsWith('{') || raw.startsWith('[')) && raw.length > 10) {
      result = parseDiscordJson(raw)
    } else {
      result = parseDiscordMarkdown(raw)
    }

    if (!result.blocks.length) { importError.value = 'Aucun bloc détecté — vérifie le contenu collé'; return }

    if (!importTitle.value && result.title) importTitle.value = result.title
    if (!importTitle.value) importTitle.value = 'Tutoriel importé'
    importBlocks.value = result.blocks
    importStep.value = 'preview'
  } catch (e: any) {
    importError.value = `Erreur d'analyse : ${e?.message ?? 'format invalide'}`
  }
}

async function saveImport() {
  importError.value = ''
  if (!importTitle.value.trim()) { importError.value = 'Titre requis'; return }
  importing.value = true
  try {
    const { data } = await api.post('/tutorials', {
      title: importTitle.value.trim(),
      description: '',
      blocks: importBlocks.value,
      published: false,
    })
    showImport.value = false
    const { data: list } = await api.get('/tutorials')
    tutorials.value = list
    ui.notify('Tutoriel importé avec succès !')
    router.push(`/tutorials/${data.id}`)
  } catch (e: any) {
    importError.value = e?.response?.data?.error ?? 'Erreur lors de la sauvegarde'
  } finally {
    importing.value = false
  }
}

function blockIcon(type: string): string {
  const icons: Record<string, string> = {
    text: '📝', image: '🖼', video: '🎬', code: '💻', embed: '📦', callout: '💡', separator: '─'
  }
  return icons[type] ?? '■'
}

function blockPreviewText(b: TutorialBlock): string {
  if (b.type === 'text') return String(b.content).slice(0, 80).replace(/\n/g, ' ') + (String(b.content).length > 80 ? '…' : '')
  if (b.type === 'image') return b.content?.url?.slice(0, 60) ?? '(image)'
  if (b.type === 'video') return b.content?.url?.slice(0, 60) ?? '(vidéo)'
  if (b.type === 'code') return `${b.content?.language} — ${String(b.content?.code ?? '').slice(0, 50).replace(/\n/g, '↵')}…`
  if (b.type === 'callout') return `[${b.content?.type}] ${String(b.content?.text ?? '').slice(0, 60)}`
  if (b.type === 'separator') return '──────────'
  return ''
}

// ─── Liste ───────────────────────────────────────────────────────
onMounted(async () => {
  const { data } = await api.get('/tutorials')
  tutorials.value = data
})

function fmtDate(d: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function blockCount(t: any): string {
  const n = Array.isArray(t.blocks) ? t.blocks.length : 0
  return `${n} bloc${n > 1 ? 's' : ''}`
}

async function remove(id: number) {
  if (!confirm('Supprimer ce tutoriel ?')) return
  await api.delete(`/tutorials/${id}`)
  tutorials.value = tutorials.value.filter(t => t.id !== id)
  ui.notify('Tutoriel supprimé')
}
</script>

<style scoped>
.tut-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tut-date { font-size: 11px; color: var(--text-muted); }
.tut-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.tut-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
.tut-blocks { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
.tut-actions { display: flex; gap: 8px; align-items: center; }
.empty-state { color: var(--text-muted); padding: 48px; text-align: center; grid-column: 1 / -1; }

/* Import modal */
.import-modal { max-width: 680px; width: 100%; }
.import-tabs { display: flex; gap: 4px; margin-bottom: 14px; background: var(--bg-tertiary); border-radius: 8px; padding: 4px; }
.import-tab { flex: 1; padding: 7px; border: none; border-radius: 6px; background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
.import-tab.active { background: var(--accent); color: #fff; }
.import-tab:hover:not(.active) { color: #fff; }
.import-hint { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5; }
.import-ta { min-height: 220px; font-family: 'Consolas', monospace; font-size: 12px; }
.import-preview-header { margin-bottom: 10px; }
.import-blocks-preview { max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-tertiary); }
.import-block-row { display: flex; align-items: baseline; gap: 10px; padding: 7px 12px; border-bottom: 1px solid var(--border); font-size: 12px; }
.import-block-row:last-child { border-bottom: none; }
.iblk-type { color: var(--accent); font-weight: 700; white-space: nowrap; min-width: 100px; }
.iblk-preview { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.mt-8 { margin-top: 8px; }
.fh-select { width: 100%; }
</style>
