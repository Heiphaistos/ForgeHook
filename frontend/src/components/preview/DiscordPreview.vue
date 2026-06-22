<template>
  <div class="discord-preview">
    <div class="channel-header">
      <span class="channel-hash">#</span>
      <span class="channel-name">preview</span>
    </div>
    <div class="messages-area">
      <div class="message">
        <img class="avatar" :src="avatarSrc" alt="" />
        <div class="message-body">
          <div class="message-header">
            <span class="username">{{ displayName }}</span>
            <span class="bot-tag" v-if="showBotTag">APP</span>
            <span class="timestamp">Aujourd'hui à {{ timeNow }}</span>
          </div>
          <div
            v-if="message.content"
            class="message-text"
            v-html="renderMd(message.content)"
          />
          <EmbedPreview
            v-for="(embed, i) in visibleEmbeds"
            :key="i"
            :embed="embed"
          />
          <div v-if="!message.content && !visibleEmbeds.length" class="empty-hint">
            Commence à rédiger ton message...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EmbedPreview from './EmbedPreview.vue'
import type { DiscordMessage } from '../../types/discord'

const props = defineProps<{
  message: Partial<DiscordMessage>
  showBotTag?: boolean
}>()

const DEFAULT_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png'

const avatarSrc = computed(() => props.message.avatar_url || DEFAULT_AVATAR)
const displayName = computed(() => props.message.username || 'ForgeHook')
const timeNow = computed(() =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
)

const visibleEmbeds = computed(() =>
  (props.message.embeds ?? []).filter(e =>
    e.title || e.description || e.fields?.length || e.image?.url
  )
)

function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.discord-preview {
  background: #36393f;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'gg sans', 'Noto Sans', Whitney, system-ui, sans-serif;
  min-height: 120px;
}
.channel-header {
  background: #2f3136;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #202225;
}
.channel-hash { color: #8e9297; font-size: 22px; font-weight: 900; line-height: 1; }
.channel-name { color: #dcddde; font-weight: 600; font-size: 16px; }
.messages-area { padding: 16px; }
.message { display: flex; gap: 16px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
.message-body { flex: 1; min-width: 0; }
.message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.username { color: #fff; font-weight: 600; font-size: 16px; }
.bot-tag {
  background: #5865f2;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.timestamp { color: #72767d; font-size: 12px; }
.message-text { color: #dcddde; font-size: 16px; line-height: 1.6; word-break: break-word; }
.message-text :deep(strong) { font-weight: 700; }
.message-text :deep(em) { font-style: italic; }
.message-text :deep(code) {
  background: #202225;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
}
.empty-hint { color: #4f545c; font-style: italic; font-size: 14px; padding: 8px 0; }
</style>
