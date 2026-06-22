<template>
  <div class="embed-wrapper" :style="{ borderLeft: `4px solid ${colorHex}` }">
    <div class="embed-content">
      <div v-if="embed.thumbnail?.url" class="embed-thumbnail">
        <img :src="embed.thumbnail.url" alt="" />
      </div>
      <div v-if="embed.author?.name" class="embed-author">
        <img v-if="embed.author.icon_url" :src="embed.author.icon_url" class="author-icon" alt="" />
        <a v-if="embed.author.url" :href="embed.author.url" target="_blank" rel="noopener">{{ embed.author.name }}</a>
        <span v-else>{{ embed.author.name }}</span>
      </div>
      <div v-if="embed.title" class="embed-title">
        <a v-if="embed.url" :href="embed.url" target="_blank" rel="noopener">{{ embed.title }}</a>
        <span v-else>{{ embed.title }}</span>
      </div>
      <div v-if="embed.description" class="embed-description" v-html="renderMd(embed.description)" />
      <div v-if="embed.fields?.length" class="embed-fields">
        <div v-for="(field, i) in embed.fields" :key="i"
          :class="['embed-field', field.inline ? 'inline' : '']">
          <div class="field-name">{{ field.name }}</div>
          <div class="field-value" v-html="renderMd(field.value)" />
        </div>
      </div>
      <div v-if="embed.image?.url" class="embed-image">
        <img :src="embed.image.url" alt="" />
      </div>
      <div v-if="embed.footer?.text || embed.timestamp" class="embed-footer">
        <img v-if="embed.footer?.icon_url" :src="embed.footer.icon_url" class="footer-icon" alt="" />
        <span v-if="embed.footer?.text">{{ embed.footer.text }}</span>
        <span v-if="embed.footer?.text && embed.timestamp"> • </span>
        <span v-if="embed.timestamp">{{ fmtDate(embed.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiscordEmbed } from '../../types/discord'

const props = defineProps<{ embed: Partial<DiscordEmbed> }>()

const colorHex = computed(() => {
  if (!props.embed.color) return '#4f545c'
  return '#' + props.embed.color.toString(16).padStart(6, '0')
})

function renderMd(text: string): string {
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

function fmtDate(ts: string): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.embed-wrapper {
  background: #2f3136;
  border-radius: 0 4px 4px 0;
  max-width: 520px;
  padding: 12px 16px;
  margin: 4px 0;
  position: relative;
  overflow: hidden;
}
.embed-content { position: relative; padding-right: 84px; }
.embed-thumbnail {
  position: absolute;
  right: 0;
  top: 0;
  width: 80px;
  height: 80px;
}
.embed-thumbnail img { width: 80px; height: 80px; border-radius: 4px; object-fit: cover; }
.embed-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #dcddde;
}
.embed-author a { color: #dcddde; text-decoration: none; }
.author-icon { width: 24px; height: 24px; border-radius: 50%; }
.embed-title { font-size: 16px; font-weight: 700; color: #00b0f4; margin-bottom: 8px; }
.embed-title a { color: #00b0f4; text-decoration: none; }
.embed-title a:hover { text-decoration: underline; }
.embed-description { font-size: 14px; color: #dcddde; line-height: 1.6; margin-bottom: 8px; }
.embed-description :deep(a) { color: #00b0f4; }
.embed-description :deep(code) { background: #202225; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
.embed-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
.embed-field { grid-column: span 3; }
.embed-field.inline { grid-column: span 1; }
.field-name { font-size: 14px; font-weight: 700; color: #dcddde; margin-bottom: 2px; }
.field-value { font-size: 14px; color: #dcddde; line-height: 1.4; }
.field-value :deep(a) { color: #00b0f4; }
.embed-image { margin-top: 12px; }
.embed-image img { max-width: 100%; border-radius: 4px; }
.embed-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #72767d;
  margin-top: 8px;
}
.footer-icon { width: 20px; height: 20px; border-radius: 50%; }
</style>
