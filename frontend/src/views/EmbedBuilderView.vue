<template>
  <div class="builder-layout">
    <!-- Panneau gauche : éditeur -->
    <div class="editor-panel">
      <div class="panel-header">
        <h2>⚡ Constructeur d'embed</h2>
        <div class="actions">
          <button @click="showExport = true" class="btn-secondary" title="Exporter l'embed">📤 Export</button>
          <button @click="showFonts = true" class="btn-secondary" title="Convertisseur de polices">🔤 Fonts</button>
          <button @click="showTemplates = true" class="btn-secondary" title="Charger un template">📋 Templates</button>
          <button @click="saveAsTemplate" class="btn-secondary" title="Sauver comme template">💾</button>
        </div>
      </div>

      <!-- SECTION 1 : Message de base -->
      <div class="editor-section">
        <div class="section-title">
          <span class="section-num">1</span>
          <span>Message de base</span>
          <span class="section-hint">Texte envoyé au-dessus des embeds</span>
        </div>
        <div class="section">
          <label class="fh-label">
            Contenu du message
            <span class="field-hint">Texte libre, @everyone, @here, mentions, markdown Discord</span>
          </label>
          <textarea v-model="embedStore.message.content"
            placeholder="Ex: @everyone Nouvelle annonce ! 🎉  ← Ce texte apparaît AVANT l'embed"
            class="fh-textarea" rows="2" />
        </div>
      </div>

      <!-- SECTION 2 : Identité du webhook -->
      <div class="editor-section">
        <div class="section-title">
          <span class="section-num">2</span>
          <span>Identité du webhook</span>
          <span class="section-hint">Personnaliser le nom et l'avatar affiché</span>
        </div>
        <div class="section row">
          <div class="half">
            <label class="fh-label">
              Nom affiché
              <span class="field-hint">Remplace le nom par défaut du webhook</span>
            </label>
            <input v-model="embedStore.message.username" placeholder="Ex: Bot Annonces" class="fh-input" />
          </div>
          <div class="half">
            <label class="fh-label">
              Avatar
              <span class="field-hint">URL ou importer une image</span>
            </label>
            <div class="avatar-row">
              <input v-model="embedStore.message.avatar_url" placeholder="https://..." class="fh-input" />
              <button @click="triggerAvatarUpload" class="btn-secondary avatar-upload-btn" title="Importer une image">📤</button>
              <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="uploadAvatar" />
            </div>
            <img v-if="embedStore.message.avatar_url" :src="embedStore.message.avatar_url"
              class="avatar-preview" alt="avatar" @error="($event.target as HTMLImageElement).style.display='none'" />
          </div>
        </div>
        <div class="section">
          <label class="inline-toggle fh-label">
            <input type="checkbox" v-model="embedStore.message.tts" style="accent-color:#5865f2" />
            TTS (Text-to-Speech) — lire le message à voix haute
          </label>
        </div>
      </div>

      <!-- SECTION 3 : Embeds -->
      <div class="editor-section">
        <div class="section-title">
          <span class="section-num">3</span>
          <span>Embeds Discord</span>
          <span class="section-hint">Cartes visuelles richement formatées</span>
        </div>

        <div v-for="(_, i) in embedStore.message.embeds" :key="i" class="embed-section">
          <div class="embed-header">
            <h3>Embed {{ i + 1 }}/{{ embedStore.message.embeds.length }}</h3>
            <div class="flex gap-2">
              <button @click="duplicateEmbed(i)" class="btn-secondary" title="Dupliquer">⧉</button>
              <button @click="embedStore.removeEmbed(i)" class="btn-danger-sm">✕ Supprimer</button>
            </div>
          </div>
          <EmbedBuilder v-model="embedStore.message.embeds[i]" />
        </div>

        <button @click="embedStore.addEmbed()" class="btn-add"
          :disabled="embedStore.message.embeds.length >= 10">
          + Ajouter un embed ({{ embedStore.message.embeds.length }}/10)
        </button>
      </div>

      <!-- SECTION 4 : Envoyer -->
      <div class="editor-section send-section">
        <div class="section-title">
          <span class="section-num">4</span>
          <span>Envoyer</span>
        </div>

        <!-- Mode toggle -->
        <div class="send-mode-tabs">
          <button :class="{ active: sendMode === 'webhook' }" @click="sendMode = 'webhook'">🔗 Webhook</button>
          <button :class="{ active: sendMode === 'bot' }" @click="sendMode = 'bot'">🤖 Bot Discord</button>
        </div>

        <!-- Mode Webhook -->
        <div v-if="sendMode === 'webhook'" class="send-area">
          <select v-model="embedStore.selectedWebhookId" class="fh-select">
            <option :value="null" disabled>Choisir un webhook</option>
            <option v-for="w in webhookStore.webhooks" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
          <input v-model="threadId" placeholder="Thread ID (optionnel)" class="fh-input" style="width:160px" />
          <button @click="sendWebhook" class="btn-primary send-btn"
            :disabled="embedStore.sending || !embedStore.selectedWebhookId">
            {{ embedStore.sending ? '⏳ Envoi...' : '🚀 Envoyer' }}
          </button>
          <button @click="embedStore.reset()" class="btn-secondary">🗑</button>
        </div>

        <!-- Mode Bot -->
        <div v-else class="send-bot-area">
          <div class="bot-select-row">
            <label class="fh-label" style="margin-bottom:4px">Bot</label>
            <select v-model="selectedBotId" class="fh-select">
              <option :value="null" disabled>Choisir un bot</option>
              <option v-for="b in bots" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <BotChannelPicker v-if="selectedBotId" :bot-id="selectedBotId" @select="onChannelSelect" />
          <div class="send-area" style="margin-top:10px">
            <button @click="sendViaBot" class="btn-primary send-btn"
              :disabled="botSending || !selectedBotId || !selectedChannelId">
              {{ botSending ? '⏳ Envoi...' : '🤖 Envoyer via bot' }}
            </button>
            <button @click="embedStore.reset()" class="btn-secondary">🗑</button>
          </div>
        </div>

        <p v-if="sendMode === 'webhook' && !embedStore.selectedWebhookId" class="send-hint">⚠️ Sélectionnez un webhook</p>
        <p v-if="sendMode === 'bot' && selectedBotId && !selectedChannelId" class="send-hint">⚠️ Sélectionnez un serveur et un channel</p>
        <p v-if="embedStore.lastError || botError" class="error mt-2">⚠️ {{ embedStore.lastError || botError }}</p>
        <p v-if="sent" class="success mt-2">✅ Message envoyé ! Redirection vers l'historique...</p>
      </div>
    </div>

    <!-- Panneau droit : preview -->
    <div class="preview-panel">
      <div class="panel-header">
        <h2>👁 Aperçu Discord</h2>
        <div style="display:flex;gap:8px">
          <button @click="showJson = !showJson" class="btn-secondary" style="font-size:12px">
            {{ showJson ? 'Masquer JSON' : 'JSON' }}
          </button>
        </div>
      </div>

      <div class="preview-legend">
        <div class="legend-item"><span class="leg-tag tag-content">1</span> Message de base (content)</div>
        <div class="legend-item"><span class="leg-tag tag-embed">3</span> Embed (carte)</div>
      </div>

      <DiscordPreview :message="embedStore.message" :show-bot-tag="true" />

      <div v-if="showJson" class="mt-4">
        <label class="fh-label">Payload JSON</label>
        <pre class="json-block">{{ JSON.stringify(embedStore.message, null, 2) }}</pre>
      </div>
    </div>

    <!-- Modaux -->
    <EmbedTemplatesModal
      v-model="showTemplates"
      :user-templates="templates"
      @load-template="loadUserTemplate"
      @load-preset="loadPreset"
    />

    <EmbedFontsModal v-model="showFonts" @inject="applyFontToField" />

    <ExportModal
      v-model="showExport"
      :payload="embedStore.message"
      :webhook-url="currentWebhookUrl"
    />

    <!-- Modal save template -->
    <div v-if="showSaveTemplate" class="modal-overlay" @click.self="showSaveTemplate = false">
      <div class="modal">
        <h3>💾 Sauver comme template</h3>
        <div class="section">
          <label class="fh-label">Nom</label>
          <input v-model="tplForm.name" placeholder="Nom du template" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Description</label>
          <input v-model="tplForm.description" placeholder="Description courte" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Catégorie</label>
          <input v-model="tplForm.category" placeholder="Ex: annonces, jeux, logs" class="fh-input" list="cat-list" />
          <datalist id="cat-list">
            <option value="Annonces" /><option value="Jeux" /><option value="Films & Séries" />
            <option value="Serveur" /><option value="Modération" /><option value="Événements" />
          </datalist>
        </div>
        <div class="modal-actions">
          <button @click="submitTemplate" class="btn-primary">Sauver</button>
          <button @click="showSaveTemplate = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import DiscordPreview from '../components/preview/DiscordPreview.vue'
import EmbedTemplatesModal from '../components/modals/EmbedTemplatesModal.vue'
import EmbedFontsModal from '../components/modals/EmbedFontsModal.vue'
import ExportModal from '../components/modals/ExportModal.vue'
import BotChannelPicker from '../components/bots/BotChannelPicker.vue'
import { useEmbedStore } from '../stores/embed'
import { useWebhooksStore } from '../stores/webhooks'
import { useUiStore } from '../stores/ui'
import { emptyEmbed } from '../types/discord'
import type { Template } from '../types/app'
import api from '../api/client'

const router = useRouter()
const embedStore = useEmbedStore()
const webhookStore = useWebhooksStore()
const ui = useUiStore()

const threadId = ref('')
const sent = ref(false)
const showJson = ref(false)
const showTemplates = ref(false)
const showSaveTemplate = ref(false)
const showFonts = ref(false)
const showExport = ref(false)
const sendMode = ref<'webhook' | 'bot'>('webhook')
const templates = ref<Template[]>([])
const tplForm = ref({ name: '', description: '', category: 'Annonces' })
const avatarInput = ref<HTMLInputElement | null>(null)

// Bot send
const bots = ref<{ id: number; name: string }[]>([])
const selectedBotId = ref<number | null>(null)
const selectedChannelId = ref('')
const selectedChannelName = ref('')
const botSending = ref(false)
const botError = ref('')

const currentWebhookUrl = computed(() => {
  const wh = webhookStore.webhooks.find(w => w.id === embedStore.selectedWebhookId)
  return (wh as any)?.url ?? ''
})

onMounted(async () => {
  await webhookStore.load()
  const [tplRes, botRes] = await Promise.all([api.get('/templates'), api.get('/bots')])
  templates.value = tplRes.data
  bots.value = botRes.data
  if (embedStore.message.embeds.length === 0) embedStore.addEmbed()
})

async function sendWebhook() {
  await embedStore.send(threadId.value || undefined)
  if (!embedStore.lastError) {
    sent.value = true
    ui.notify('Message envoyé !')
    setTimeout(() => { router.push('/history') }, 2000)
  }
}

async function sendViaBot() {
  if (!selectedBotId.value || !selectedChannelId.value) return
  botSending.value = true
  botError.value = ''
  try {
    await api.post('/bots/send', {
      bot_id: selectedBotId.value,
      channel_id: selectedChannelId.value,
      payload: {
        content: embedStore.message.content || undefined,
        embeds: embedStore.message.embeds.length ? embedStore.message.embeds : undefined,
      },
    })
    sent.value = true
    ui.notify(`Message envoyé via bot dans #${selectedChannelName.value} !`)
    setTimeout(() => { router.push('/history') }, 2000)
  } catch (e: any) {
    botError.value = e?.response?.data?.error ?? 'Erreur envoi bot'
  } finally {
    botSending.value = false
  }
}

function onChannelSelect(sel: { guildId: string; channelId: string; channelName: string; guildName: string } | null) {
  selectedChannelId.value = sel?.channelId ?? ''
  selectedChannelName.value = sel?.channelName ?? ''
}

function applyFontToField(text: string, field: string) {
  const embed = embedStore.message.embeds[0]
  if (field === 'content') embedStore.message.content = text
  else if (field === 'title' && embed) embed.title = text
  else if (field === 'description' && embed) embed.description = text
  else if (field === 'footer' && embed) embed.footer = { text, icon_url: embed.footer?.icon_url ?? '' }
  else if (field === 'author' && embed) embed.author = { name: text, url: embed.author?.url ?? '', icon_url: embed.author?.icon_url ?? '' }
  ui.notify(`Texte inséré dans "${field}" !`)
}

function duplicateEmbed(i: number) {
  embedStore.message.embeds.push(JSON.parse(JSON.stringify(embedStore.message.embeds[i])))
}

function loadUserTemplate(t: Template) {
  try {
    embedStore.loadTemplate(JSON.parse(t.payload))
    ui.notify(`Template "${t.name}" chargé`)
  } catch {
    ui.notify('Impossible de parser le template', 'error')
  }
}

function loadPreset(payload: object) {
  embedStore.loadTemplate(payload as any)
  ui.notify('Template chargé')
}

function saveAsTemplate() {
  tplForm.value = { name: '', description: '', category: 'Annonces' }
  showSaveTemplate.value = true
}

async function submitTemplate() {
  if (!tplForm.value.name) return
  await api.post('/templates', {
    name: tplForm.value.name,
    description: tplForm.value.description,
    payload: JSON.stringify(embedStore.message),
    category: tplForm.value.category,
    preview_color: embedStore.message.embeds[0]?.color
      ? '#' + embedStore.message.embeds[0].color!.toString(16).padStart(6, '0')
      : '#5865F2',
  })
  showSaveTemplate.value = false
  ui.notify('Template sauvegardé !')
  const { data } = await api.get('/templates')
  templates.value = data
}

function triggerAvatarUpload() { avatarInput.value?.click() }

async function uploadAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    embedStore.message.avatar_url = data.url
    ui.notify('Avatar uploadé !')
  } catch (err: any) {
    ui.notify(err?.response?.data?.error ?? 'Erreur upload', 'error')
  } finally {
    if (avatarInput.value) avatarInput.value.value = ''
  }
}
</script>

<style scoped>
.inline-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.editor-section { border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 16px; }
.section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.section-num { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.section-hint { font-size: 11px; color: var(--text-muted); margin-left: auto; }
.field-hint { font-size: 10px; color: var(--text-muted); font-weight: 400; margin-left: 6px; }
.avatar-row { display: flex; gap: 6px; align-items: center; }
.avatar-upload-btn { padding: 6px 10px; flex-shrink: 0; }
.avatar-preview { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-top: 6px; border: 2px solid var(--border); }
.send-section { border-bottom: none; margin-bottom: 0; }
.send-mode-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.send-mode-tabs button { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-muted); cursor: pointer; font-weight: 600; font-size: 13px; }
.send-mode-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.send-mode-tabs button:hover:not(.active) { background: var(--bg-secondary); color: var(--text); }
.send-btn { font-size: 14px; padding: 10px 20px; }
.send-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.bot-select-row { display: flex; flex-direction: column; margin-bottom: 10px; }
.send-bot-area { display: flex; flex-direction: column; gap: 8px; }
.preview-legend { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.leg-tag { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700; }
.tag-content { background: #57F287; color: #000; }
.tag-embed { background: #5865F2; color: #fff; }
.flex { display: flex; }
.gap-2 { gap: 8px; }
.mt-4 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }
</style>
