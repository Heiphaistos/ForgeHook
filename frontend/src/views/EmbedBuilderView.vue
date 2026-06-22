<template>
  <div class="builder-layout">
    <!-- Panneau gauche : éditeur -->
    <div class="editor-panel">
      <div class="panel-header">
        <h2>⚡ Éditeur</h2>
        <div class="actions">
          <select v-model="embedStore.selectedWebhookId" class="fh-select">
            <option :value="null" disabled>Choisir un webhook</option>
            <option v-for="w in webhookStore.webhooks" :key="w.id" :value="w.id">
              {{ w.name }}
            </option>
          </select>
          <button @click="showTemplates = true" class="btn-secondary" title="Charger template">📋</button>
          <button @click="saveAsTemplate" class="btn-secondary" title="Sauver comme template">💾</button>
        </div>
      </div>

      <!-- Contenu message -->
      <div class="section">
        <label class="fh-label">Contenu (texte libre)</label>
        <textarea v-model="embedStore.message.content"
          placeholder="Contenu texte — @everyone, @here, texte, markdown Discord..."
          class="fh-textarea" rows="3" />
      </div>

      <div class="section row">
        <div class="half">
          <label class="fh-label">Username override</label>
          <input v-model="embedStore.message.username" placeholder="Nom affiché" class="fh-input" />
        </div>
        <div class="half">
          <label class="fh-label">Avatar override (URL)</label>
          <input v-model="embedStore.message.avatar_url" placeholder="https://..." class="fh-input" />
        </div>
      </div>

      <div class="section">
        <label class="inline-toggle fh-label">
          <input type="checkbox" v-model="embedStore.message.tts" style="accent-color:#5865f2" />
          TTS (Text-to-Speech)
        </label>
      </div>

      <!-- Embeds -->
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

      <!-- Envoi -->
      <div class="send-area">
        <input v-model="threadId" placeholder="Thread ID (optionnel)" class="fh-input" style="width:180px" />
        <button @click="send" class="btn-primary"
          :disabled="embedStore.sending || !embedStore.selectedWebhookId">
          {{ embedStore.sending ? 'Envoi...' : '🚀 Envoyer' }}
        </button>
        <button @click="embedStore.reset()" class="btn-secondary">🗑 Réinitialiser</button>
      </div>
      <p v-if="embedStore.lastError" class="error">⚠️ {{ embedStore.lastError }}</p>
      <p v-if="sent" class="success">✅ Message envoyé avec succès !</p>
    </div>

    <!-- Panneau droit : preview -->
    <div class="preview-panel">
      <div class="panel-header">
        <h2>👁 Aperçu Discord</h2>
        <button @click="showJson = !showJson" class="btn-secondary" style="font-size:12px">
          {{ showJson ? 'Masquer JSON' : 'JSON' }}
        </button>
      </div>

      <DiscordPreview :message="embedStore.message" :show-bot-tag="true" />

      <div v-if="showJson" class="mt-4">
        <label class="fh-label">Payload JSON</label>
        <pre class="json-block">{{ JSON.stringify(embedStore.message, null, 2) }}</pre>
      </div>
    </div>

    <!-- Modal templates -->
    <div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates = false">
      <div class="modal" style="max-width:600px">
        <h3>📋 Templates</h3>
        <div class="grid-2 mt-2">
          <div v-for="t in templates" :key="t.id" class="card" style="cursor:pointer" @click="loadTemplate(t)">
            <div class="flex items-center gap-2 mb-2">
              <div style="width:12px;height:12px;border-radius:50%;flex-shrink:0"
                :style="{ background: t.preview_color }" />
              <strong>{{ t.name }}</strong>
            </div>
            <p style="color:var(--text-muted);font-size:12px">{{ t.description }}</p>
            <span class="badge badge-info mt-2">{{ t.category }}</span>
          </div>
          <div v-if="!templates.length" style="color:var(--text-muted)">
            Aucun template. Créez-en depuis l'onglet Templates.
          </div>
        </div>
        <div class="modal-actions"><button @click="showTemplates = false" class="btn-secondary">Fermer</button></div>
      </div>
    </div>

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
          <input v-model="tplForm.category" placeholder="Ex: annonces, logs, alertes" class="fh-input" />
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
import { ref, onMounted } from 'vue'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import DiscordPreview from '../components/preview/DiscordPreview.vue'
import { useEmbedStore } from '../stores/embed'
import { useWebhooksStore } from '../stores/webhooks'
import { useUiStore } from '../stores/ui'
import { emptyEmbed } from '../types/discord'
import type { Template } from '../types/app'
import api from '../api/client'

const embedStore = useEmbedStore()
const webhookStore = useWebhooksStore()
const ui = useUiStore()

const threadId = ref('')
const sent = ref(false)
const showJson = ref(false)
const showTemplates = ref(false)
const showSaveTemplate = ref(false)
const templates = ref<Template[]>([])
const tplForm = ref({ name: '', description: '', category: 'general' })

onMounted(async () => {
  await webhookStore.load()
  const { data } = await api.get('/templates')
  templates.value = data
  if (embedStore.message.embeds.length === 0) embedStore.addEmbed()
})

async function send() {
  await embedStore.send(threadId.value || undefined)
  if (!embedStore.lastError) {
    sent.value = true
    ui.notify('Message envoyé !')
    setTimeout(() => { sent.value = false }, 3000)
  }
}

function duplicateEmbed(i: number) {
  const copy = JSON.parse(JSON.stringify(embedStore.message.embeds[i]))
  embedStore.message.embeds.push(copy)
}

function loadTemplate(t: Template) {
  try {
    const payload = JSON.parse(t.payload)
    embedStore.loadTemplate(payload)
    showTemplates.value = false
    ui.notify(`Template "${t.name}" chargé`)
  } catch {
    ui.notify('Impossible de parser le template', 'error')
  }
}

function saveAsTemplate() {
  tplForm.value = { name: '', description: '', category: 'general' }
  showSaveTemplate.value = true
}

async function submitTemplate() {
  if (!tplForm.value.name) return
  await api.post('/templates', {
    name: tplForm.value.name,
    description: tplForm.value.description,
    payload: JSON.parse(JSON.stringify(embedStore.message)),
    category: tplForm.value.category,
    preview_color: embedStore.message.embeds[0]?.color
      ? '#' + embedStore.message.embeds[0].color.toString(16).padStart(6, '0')
      : '#5865F2',
  })
  showSaveTemplate.value = false
  ui.notify('Template sauvegardé !')
  const { data } = await api.get('/templates')
  templates.value = data
}
</script>

<style scoped>
.inline-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
</style>
