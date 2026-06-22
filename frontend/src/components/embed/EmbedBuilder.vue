<template>
  <div class="embed-builder">
    <div class="section">
      <label class="fh-label">Couleur de la barre</label>
      <EmbedColorPicker v-model="embed.color" />
    </div>

    <div class="section">
      <label class="fh-label">Auteur</label>
      <input v-model="authorName" placeholder="Nom de l'auteur" class="fh-input" />
      <input v-model="authorUrl" placeholder="Lien auteur (https://...)" class="fh-input mt-1" />
      <input v-model="authorIcon" placeholder="URL icône auteur" class="fh-input mt-1" />
    </div>

    <div class="section">
      <label class="fh-label">Titre</label>
      <input v-model="embed.title" placeholder="Titre de l'embed" class="fh-input" />
      <input v-model="embed.url" placeholder="URL du titre (optionnel)" class="fh-input mt-1" />
    </div>

    <div class="section">
      <label class="fh-label">Description</label>
      <textarea v-model="embed.description"
        placeholder="Description — **gras**, *italique*, `code`, [lien](url), ~~barré~~"
        class="fh-textarea" rows="5" />
      <div class="char-count" :class="{ warn: (embed.description?.length ?? 0) > 3800 }">
        {{ embed.description?.length ?? 0 }}/4096
      </div>
    </div>

    <div class="section row">
      <div class="half">
        <label class="fh-label">Miniature (thumbnail)</label>
        <input v-model="thumbnailUrl" placeholder="https://..." class="fh-input" />
      </div>
      <div class="half">
        <label class="fh-label">Image principale</label>
        <input v-model="imageUrl" placeholder="https://..." class="fh-input" />
      </div>
    </div>

    <div class="section">
      <label class="fh-label">Champs (max 25)</label>
      <EmbedFieldEditor
        :fields="embed.fields ?? []"
        @update:fields="embed.fields = $event"
      />
    </div>

    <div class="section row">
      <div class="half">
        <label class="fh-label">Pied de page</label>
        <input v-model="footerText" placeholder="Texte du footer" class="fh-input" />
        <input v-model="footerIcon" placeholder="URL icône footer" class="fh-input mt-1" />
      </div>
      <div class="half">
        <label class="fh-label">Horodatage</label>
        <input type="datetime-local" v-model="timestampLocal" @change="onTimestampChange" class="fh-input" />
        <button @click="setNow" class="btn-secondary mt-1" style="width:100%">Maintenant</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import EmbedColorPicker from './EmbedColorPicker.vue'
import EmbedFieldEditor from './EmbedFieldEditor.vue'
import type { DiscordEmbed } from '../../types/discord'

const embed = defineModel<Partial<DiscordEmbed>>({ required: true })

const authorName = computed({
  get: () => embed.value.author?.name ?? '',
  set: (v) => { if (!embed.value.author) embed.value.author = { name: '', url: '', icon_url: '' }; embed.value.author.name = v }
})
const authorUrl = computed({
  get: () => embed.value.author?.url ?? '',
  set: (v) => { if (!embed.value.author) embed.value.author = { name: '', url: '', icon_url: '' }; embed.value.author.url = v }
})
const authorIcon = computed({
  get: () => embed.value.author?.icon_url ?? '',
  set: (v) => { if (!embed.value.author) embed.value.author = { name: '', url: '', icon_url: '' }; embed.value.author.icon_url = v }
})
const footerText = computed({
  get: () => embed.value.footer?.text ?? '',
  set: (v) => { if (!embed.value.footer) embed.value.footer = { text: '', icon_url: '' }; embed.value.footer.text = v }
})
const footerIcon = computed({
  get: () => embed.value.footer?.icon_url ?? '',
  set: (v) => { if (!embed.value.footer) embed.value.footer = { text: '', icon_url: '' }; embed.value.footer.icon_url = v }
})
const thumbnailUrl = computed({
  get: () => embed.value.thumbnail?.url ?? '',
  set: (v) => { embed.value.thumbnail = { url: v } }
})
const imageUrl = computed({
  get: () => embed.value.image?.url ?? '',
  set: (v) => { embed.value.image = { url: v } }
})

const timestampLocal = ref(embed.value.timestamp ? toLocalInput(embed.value.timestamp) : '')

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function onTimestampChange() {
  if (timestampLocal.value) embed.value.timestamp = new Date(timestampLocal.value).toISOString()
  else embed.value.timestamp = ''
}

function setNow() {
  embed.value.timestamp = new Date().toISOString()
  timestampLocal.value = toLocalInput(embed.value.timestamp)
}
</script>

<style scoped>
.embed-builder { display: flex; flex-direction: column; gap: 4px; }
.char-count { font-size: 11px; color: #72767d; text-align: right; margin-top: 2px; }
.char-count.warn { color: #fee75c; }
.row { display: flex; gap: 12px; }
.half { flex: 1; }
.mt-1 { margin-top: 4px; }
</style>
