<template>
  <div class="page">
    <div class="page-header">
      <h1>🤖 Bots Discord</h1>
      <button @click="openForm()" class="btn-primary">+ Ajouter un bot</button>
    </div>

    <div class="grid-2">
      <div v-for="b in bots" :key="b.id" class="card">
        <div class="bot-header">
          <img v-if="botInfo[b.id]?.avatar"
            :src="`https://cdn.discordapp.com/avatars/${botInfo[b.id].id}/${botInfo[b.id].avatar}.png`"
            class="bot-avatar" alt="" />
          <div v-else class="bot-avatar-ph">🤖</div>
          <div>
            <div class="bot-name">{{ b.name }}</div>
            <div v-if="botInfo[b.id]" class="bot-discord-name">@{{ botInfo[b.id].username }}</div>
            <div v-if="b.channel_id" class="bot-channel">Channel: {{ b.channel_id }}</div>
          </div>
        </div>
        <div class="bot-actions">
          <button @click="fetchInfo(b.id)" class="btn-secondary">🔍 Info</button>
          <button @click="openSend(b)" class="btn-primary">📨 Envoyer</button>
          <button @click="openForm(b)" class="btn-secondary">✏️</button>
          <button @click="remove(b.id)" class="btn-danger-sm">🗑</button>
        </div>
      </div>
      <div v-if="!bots.length" class="empty-state">Aucun bot configuré.</div>
    </div>

    <!-- Add/Edit form -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h3>{{ editing ? 'Modifier bot' : 'Ajouter un bot' }}</h3>
        <div class="section">
          <label class="fh-label">Nom *</label>
          <input v-model="form.name" placeholder="Mon Bot" class="fh-input" autofocus />
        </div>
        <div class="section">
          <label class="fh-label">Token Bot Discord *</label>
          <input v-model="form.token" type="password" placeholder="Bot token (commence par MTx...)" class="fh-input" />
          <p style="font-size:11px;color:var(--text-muted);margin-top:4px">
            Créer sur <a href="https://discord.com/developers/applications" target="_blank" rel="noopener" style="color:var(--accent)">discord.com/developers</a>
          </p>
        </div>
        <div class="section">
          <label class="fh-label">Channel ID par défaut</label>
          <input v-model="form.channel_id" placeholder="ID du salon (optionnel)" class="fh-input" />
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button @click="submit" class="btn-primary">{{ editing ? 'Modifier' : 'Ajouter' }}</button>
          <button @click="showForm = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Send message modal -->
    <div v-if="sendTarget" class="modal-overlay" @click.self="sendTarget = null">
      <div class="modal" style="max-width:560px">
        <h3>📨 Envoyer via {{ sendTarget.name }}</h3>
        <div class="section">
          <label class="fh-label">Channel ID *</label>
          <input v-model="sendForm.channel_id" placeholder="ID du salon Discord" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Contenu</label>
          <textarea v-model="sendForm.content" placeholder="Message texte..." class="fh-textarea" rows="3" />
        </div>
        <p v-if="sendError" class="error">{{ sendError }}</p>
        <p v-if="sendOk" class="success">✅ Message envoyé !</p>
        <div class="modal-actions">
          <button @click="sendBot" class="btn-primary" :disabled="sendLoading">
            {{ sendLoading ? 'Envoi...' : '🚀 Envoyer' }}
          </button>
          <button @click="sendTarget = null" class="btn-secondary">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'
import type { Bot } from '../types/app'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const bots = ref<Bot[]>([])
const botInfo = ref<Record<number, any>>({})
const showForm = ref(false)
const editing = ref<Bot | null>(null)
const formError = ref('')
const form = ref({ name: '', token: '', channel_id: '' })
const sendTarget = ref<Bot | null>(null)
const sendForm = ref({ channel_id: '', content: '' })
const sendLoading = ref(false)
const sendError = ref('')
const sendOk = ref(false)

onMounted(async () => {
  const { data } = await api.get('/bots')
  bots.value = data
})

function openForm(b?: Bot) {
  editing.value = b ?? null
  form.value = b ? { name: b.name, token: '', channel_id: b.channel_id ?? '' } : { name: '', token: '', channel_id: '' }
  formError.value = ''
  showForm.value = true
}

async function submit() {
  formError.value = ''
  if (!form.value.name || (!form.value.token && !editing.value)) { formError.value = 'Nom et token requis'; return }
  try {
    if (editing.value) await api.put(`/bots/${editing.value.id}`, form.value)
    else await api.post('/bots', form.value)
    const { data } = await api.get('/bots')
    bots.value = data
    showForm.value = false
    ui.notify(editing.value ? 'Bot modifié' : 'Bot ajouté')
  } catch (e: any) {
    formError.value = e.response?.data?.error ?? 'Erreur'
  }
}

async function remove(id: number) {
  await api.delete(`/bots/${id}`)
  bots.value = bots.value.filter(b => b.id !== id)
  ui.notify('Bot supprimé')
}

async function fetchInfo(id: number) {
  try {
    const { data } = await api.get(`/bots/${id}/info`)
    botInfo.value[id] = data
  } catch {
    ui.notify('Token invalide ou erreur Discord', 'error')
  }
}

function openSend(b: Bot) {
  sendTarget.value = b
  sendForm.value = { channel_id: b.channel_id ?? '', content: '' }
  sendError.value = ''
  sendOk.value = false
}

async function sendBot() {
  sendError.value = ''
  sendOk.value = false
  if (!sendForm.value.channel_id) { sendError.value = 'Channel ID requis'; return }
  sendLoading.value = true
  try {
    await api.post('/bots/send', {
      bot_id: sendTarget.value!.id,
      channel_id: sendForm.value.channel_id,
      payload: { content: sendForm.value.content },
    })
    sendOk.value = true
    ui.notify('Message envoyé via bot !')
  } catch (e: any) {
    sendError.value = e.response?.data?.error ?? 'Erreur d\'envoi'
  } finally {
    sendLoading.value = false
  }
}
</script>

<style scoped>
.bot-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.bot-avatar { width: 44px; height: 44px; border-radius: 50%; }
.bot-avatar-ph { width: 44px; height: 44px; border-radius: 50%; background: #40444b; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.bot-name { font-weight: 700; font-size: 15px; color: #fff; }
.bot-discord-name { font-size: 12px; color: var(--accent); }
.bot-channel { font-size: 12px; color: var(--text-muted); }
.bot-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; grid-column: 1 / -1; }
</style>
