<template>
  <div class="page">
    <div class="page-header">
      <h1>🤖 Bots Discord</h1>
      <button @click="openForm()" class="btn-primary">+ Ajouter un bot</button>
    </div>

    <div class="grid-2">
      <div v-for="b in bots" :key="b.id" class="card bot-card">
        <!-- En-tête bot -->
        <div class="bot-header">
          <div class="bot-avatar-wrap">
            <img v-if="botInfo[b.id]?.avatar"
              :src="`https://cdn.discordapp.com/avatars/${botInfo[b.id].id}/${botInfo[b.id].avatar}.png`"
              class="bot-avatar" alt="" />
            <div v-else class="bot-avatar-ph">🤖</div>
          </div>
          <div class="bot-info">
            <div class="bot-name">{{ b.name }}</div>
            <div v-if="botInfo[b.id]" class="bot-discord-name">@{{ botInfo[b.id].username }}</div>
            <div v-if="botInfo[b.id]" class="bot-id">ID: {{ botInfo[b.id].id }}</div>
            <div v-if="!botInfo[b.id]" class="bot-status" style="color:var(--text-muted);font-size:12px">Token non vérifié</div>
          </div>
          <div class="bot-badge-wrap">
            <span v-if="botInfo[b.id]" class="badge badge-success">✅ Connecté</span>
          </div>
        </div>

        <!-- Actions principales -->
        <div class="bot-actions">
          <button @click="fetchInfo(b.id)" class="btn-secondary">🔍 Vérifier</button>
          <button @click="openSend(b)" class="btn-primary">📨 Envoyer</button>
          <button @click="toggleGuilds(b.id)" class="btn-secondary">
            {{ showGuilds === b.id ? '📁 Masquer' : '📁 Serveurs' }}
          </button>
          <button @click="openForm(b)" class="btn-secondary">✏️</button>
          <button @click="remove(b.id)" class="btn-danger-sm">🗑</button>
        </div>

        <!-- Guild browser collapsible -->
        <div v-if="showGuilds === b.id" class="guild-browser">
          <BotChannelPicker :bot-id="b.id" @select="onChannelSelect($event, b)" />
          <div v-if="quickSendTarget" class="quick-send">
            <div class="quick-send-info">
              📨 Envoyer dans <strong>#{{ quickSendTarget.channelName }}</strong>
              ({{ quickSendTarget.guildName }})
            </div>
            <textarea v-model="quickSendContent" placeholder="Message rapide..." class="fh-textarea" rows="2" />
            <button @click="quickSend(b)" class="btn-primary" :disabled="quickSendLoading">
              {{ quickSendLoading ? '⏳...' : '🚀 Envoyer' }}
            </button>
            <span v-if="quickSendOk" class="success" style="font-size:12px">✅ Envoyé !</span>
          </div>
        </div>
      </div>

      <div v-if="!bots.length" class="empty-state">
        Aucun bot configuré.
        <br>
        <a href="https://discord.com/developers/applications" target="_blank" rel="noopener" style="color:var(--accent)">
          Créer un bot sur discord.com/developers →
        </a>
      </div>
    </div>

    <!-- Formulaire ajout/édition -->
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
          <label class="fh-label">Channel ID par défaut (optionnel)</label>
          <input v-model="form.channel_id" placeholder="ID du salon" class="fh-input" />
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button @click="submit" class="btn-primary">{{ editing ? 'Modifier' : 'Ajouter' }}</button>
          <button @click="showForm = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal envoi rapide -->
    <div v-if="sendTarget" class="modal-overlay" @click.self="sendTarget = null">
      <div class="modal" style="max-width:580px">
        <h3>📨 Envoyer via {{ sendTarget.name }}</h3>
        <BotChannelPicker :bot-id="sendTarget.id" @select="onSendChannelSelect" />
        <div class="section" style="margin-top:12px">
          <label class="fh-label">Contenu</label>
          <textarea v-model="sendForm.content" placeholder="Message texte..." class="fh-textarea" rows="3" />
        </div>
        <p v-if="sendError" class="error">{{ sendError }}</p>
        <p v-if="sendOk" class="success">✅ Message envoyé !</p>
        <div class="modal-actions">
          <button @click="sendBot" class="btn-primary" :disabled="sendLoading || !sendChannelId">
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
import BotChannelPicker from '../components/bots/BotChannelPicker.vue'

const ui = useUiStore()
const bots = ref<Bot[]>([])
const botInfo = ref<Record<number, any>>({})
const showForm = ref(false)
const editing = ref<Bot | null>(null)
const formError = ref('')
const form = ref({ name: '', token: '', channel_id: '' })
const sendTarget = ref<Bot | null>(null)
const sendForm = ref({ content: '' })
const sendChannelId = ref('')
const sendLoading = ref(false)
const sendError = ref('')
const sendOk = ref(false)
const showGuilds = ref<number | null>(null)
const quickSendTarget = ref<{ channelId: string; channelName: string; guildName: string } | null>(null)
const quickSendContent = ref('')
const quickSendLoading = ref(false)
const quickSendOk = ref(false)

onMounted(async () => {
  const { data } = await api.get('/bots')
  bots.value = data
})

function toggleGuilds(id: number) {
  showGuilds.value = showGuilds.value === id ? null : id
  quickSendTarget.value = null
  quickSendContent.value = ''
  quickSendOk.value = false
}

function onChannelSelect(sel: any, _b: Bot) {
  quickSendTarget.value = sel
  quickSendOk.value = false
}

function onSendChannelSelect(sel: any) {
  sendChannelId.value = sel?.channelId ?? ''
}

async function quickSend(b: Bot) {
  if (!quickSendTarget.value) return
  quickSendLoading.value = true
  try {
    await api.post('/bots/send', {
      bot_id: b.id,
      channel_id: quickSendTarget.value.channelId,
      payload: { content: quickSendContent.value },
    })
    quickSendOk.value = true
    quickSendContent.value = ''
    ui.notify(`Message envoyé dans #${quickSendTarget.value.channelName} !`)
  } catch (e: any) {
    ui.notify(e?.response?.data?.error ?? "Erreur d'envoi", 'error')
  } finally {
    quickSendLoading.value = false
  }
}

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
  if (!confirm('Supprimer ce bot ?')) return
  await api.delete(`/bots/${id}`)
  bots.value = bots.value.filter(b => b.id !== id)
  ui.notify('Bot supprimé')
}

async function fetchInfo(id: number) {
  try {
    const { data } = await api.get(`/bots/${id}/info`)
    botInfo.value = { ...botInfo.value, [id]: data }
    ui.notify(`Bot "${data.username}" vérifié ✅`)
  } catch {
    ui.notify('Token invalide ou erreur Discord', 'error')
  }
}

function openSend(b: Bot) {
  sendTarget.value = b
  sendForm.value = { content: '' }
  sendChannelId.value = ''
  sendError.value = ''
  sendOk.value = false
}

async function sendBot() {
  sendError.value = ''
  sendOk.value = false
  if (!sendChannelId.value) { sendError.value = 'Sélectionnez un channel'; return }
  sendLoading.value = true
  try {
    await api.post('/bots/send', {
      bot_id: sendTarget.value!.id,
      channel_id: sendChannelId.value,
      payload: { content: sendForm.value.content },
    })
    sendOk.value = true
    ui.notify('Message envoyé via bot !')
  } catch (e: any) {
    sendError.value = e.response?.data?.error ?? "Erreur d'envoi"
  } finally {
    sendLoading.value = false
  }
}
</script>

<style scoped>
.bot-card { display: flex; flex-direction: column; gap: 10px; }
.bot-header { display: flex; align-items: center; gap: 10px; }
.bot-avatar-wrap { flex-shrink: 0; }
.bot-avatar { width: 48px; height: 48px; border-radius: 50%; }
.bot-avatar-ph { width: 48px; height: 48px; border-radius: 50%; background: #40444b; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.bot-info { flex: 1; }
.bot-name { font-weight: 700; font-size: 15px; color: #fff; }
.bot-discord-name { font-size: 12px; color: var(--accent); }
.bot-id { font-size: 11px; color: var(--text-muted); }
.bot-badge-wrap { flex-shrink: 0; }
.bot-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.guild-browser { background: var(--bg-tertiary); border-radius: 6px; padding: 12px; border: 1px solid var(--border); }
.quick-send { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.quick-send-info { font-size: 13px; color: #dcddde; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; grid-column: 1 / -1; line-height: 2; }
</style>
