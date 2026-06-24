<template>
  <div class="picker">
    <div class="picker-row">
      <div class="picker-group">
        <label>Serveur</label>
        <div v-if="loadingGuilds" class="loading-text">Chargement des serveurs...</div>
        <div v-else-if="guildError" class="error-text">{{ guildError }}</div>
        <select v-else v-model="selectedGuildId" @change="onGuildChange" class="picker-select">
          <option value="">-- Choisir un serveur --</option>
          <option v-for="g in guilds" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>

      <div class="picker-group">
        <label>Channel</label>
        <div v-if="loadingChannels" class="loading-text">Chargement...</div>
        <div v-else-if="!selectedGuildId" class="hint-text">Choisissez d'abord un serveur</div>
        <select v-else v-model="selectedChannelId" @change="onChannelChange" class="picker-select">
          <option value="">-- Choisir un channel --</option>
          <template v-for="ch in channels" :key="ch.id">
            <optgroup v-if="ch.type === 4" :label="'📁 ' + ch.name"></optgroup>
            <option v-else :value="ch.id">{{ channelPrefix(ch.type) }} {{ ch.name }}</option>
          </template>
        </select>
      </div>
    </div>

    <!-- 3ème sélecteur : posts du forum (type 15) -->
    <div v-if="selectedChannelType === 15" class="picker-row">
      <div class="picker-group" style="flex:1">
        <label>Post du forum 🗂️</label>
        <div v-if="loadingThreads" class="loading-text">Chargement des posts...</div>
        <select v-else v-model="selectedThreadId" @change="onThreadChange" class="picker-select">
          <option value="">-- Choisir un post --</option>
          <option v-for="t in threads" :key="t.id" :value="t.id">{{ t.archived ? '🔒' : '💬' }} {{ t.name }}</option>
        </select>
        <div v-if="!threads.length && !loadingThreads" class="hint-text">Aucun post actif dans ce forum</div>
      </div>
    </div>

    <div v-if="resolvedChannelId" class="selected-info">
      ✅ <strong>{{ resolvedChannelName }}</strong> sur <strong>{{ selectedGuildName }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '../../api/client'

const props = defineProps<{ botId: number | null }>()

const emit = defineEmits<{
  select: [{ guildId: string; channelId: string; channelName: string; guildName: string } | null]
}>()

interface Guild { id: string; name: string; icon: string | null }
interface Channel { id: string; name: string; type: number; parent_id: string | null }
interface Thread { id: string; name: string; type: number; parent_id: string; archived: boolean }

const guilds = ref<Guild[]>([])
const channels = ref<Channel[]>([])
const threads = ref<Thread[]>([])
const selectedGuildId = ref('')
const selectedChannelId = ref('')
const selectedThreadId = ref('')
const selectedGuildName = ref('')
const selectedChannelName = ref('')
const loadingGuilds = ref(false)
const loadingChannels = ref(false)
const loadingThreads = ref(false)
const guildError = ref('')

const selectedChannelType = computed(() =>
  channels.value.find(c => c.id === selectedChannelId.value)?.type ?? null
)

// L'ID réel à envoyer : le thread si forum, sinon le channel
const resolvedChannelId = computed(() =>
  selectedChannelType.value === 15 ? selectedThreadId.value : selectedChannelId.value
)
const resolvedChannelName = computed(() =>
  selectedChannelType.value === 15
    ? threads.value.find(t => t.id === selectedThreadId.value)?.name ?? ''
    : selectedChannelName.value
)

watch(() => props.botId, async (id) => {
  guilds.value = []
  channels.value = []
  threads.value = []
  selectedGuildId.value = ''
  selectedChannelId.value = ''
  selectedThreadId.value = ''
  guildError.value = ''
  if (!id) return
  loadingGuilds.value = true
  try {
    const { data } = await api.get(`/bots/${id}/guilds`)
    guilds.value = data as Guild[]
  } catch {
    guildError.value = 'Token invalide ou bot non présent dans un serveur'
  } finally {
    loadingGuilds.value = false
  }
}, { immediate: true })

async function onGuildChange() {
  channels.value = []
  threads.value = []
  selectedChannelId.value = ''
  selectedThreadId.value = ''
  emit('select', null)
  if (!selectedGuildId.value || !props.botId) return
  selectedGuildName.value = guilds.value.find(g => g.id === selectedGuildId.value)?.name ?? ''
  loadingChannels.value = true
  try {
    const { data } = await api.get(`/bots/${props.botId}/guilds/${selectedGuildId.value}/channels`)
    channels.value = data as Channel[]
  } finally {
    loadingChannels.value = false
  }
}

async function onChannelChange() {
  selectedThreadId.value = ''
  threads.value = []
  emit('select', null)
  if (!selectedChannelId.value) return
  selectedChannelName.value = channels.value.find(c => c.id === selectedChannelId.value)?.name ?? ''

  if (selectedChannelType.value === 15) {
    // Forum : charger les posts (threads actifs)
    loadingThreads.value = true
    try {
      const { data } = await api.get(`/bots/${props.botId}/guilds/${selectedGuildId.value}/threads`, {
        params: { parent_id: selectedChannelId.value },
      })
      threads.value = data as Thread[]
    } finally {
      loadingThreads.value = false
    }
  } else {
    // Channel normal : émettre directement
    emit('select', {
      guildId: selectedGuildId.value,
      channelId: selectedChannelId.value,
      channelName: selectedChannelName.value,
      guildName: selectedGuildName.value,
    })
  }
}

function onThreadChange() {
  if (!selectedThreadId.value) { emit('select', null); return }
  emit('select', {
    guildId: selectedGuildId.value,
    channelId: selectedThreadId.value,
    channelName: resolvedChannelName.value,
    guildName: selectedGuildName.value,
  })
}

function channelPrefix(type: number): string {
  if (type === 5) return '📢'
  if (type === 15) return '🗂️'
  return '#'
}
</script>

<style scoped>
.picker { display: flex; flex-direction: column; gap: 10px; }
.picker-row { display: flex; gap: 12px; flex-wrap: wrap; }
.picker-group { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 4px; }
.picker-group label { font-size: 12px; font-weight: 600; color: #b9bbbe; text-transform: uppercase; }
.picker-select {
  background: #202225; color: #dcddde; border: 1px solid #40444b;
  border-radius: 4px; padding: 7px 10px; font-size: 14px; cursor: pointer;
}
.picker-select:focus { outline: none; border-color: #5865f2; }
.loading-text { color: #b9bbbe; font-size: 13px; font-style: italic; }
.hint-text { color: #72767d; font-size: 13px; font-style: italic; }
.error-text { color: #ed4245; font-size: 13px; }
.selected-info { color: #3ba55c; font-size: 13px; padding: 6px 10px; background: #1a2a1a; border-radius: 4px; }
</style>
