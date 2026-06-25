<template>
  <div class="embed-builder">
    <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleUpload" />

    <div class="section">
      <label class="fh-label">Couleur de la barre</label>
      <EmbedColorPicker :model-value="embed.color ?? null" @update:model-value="embed.color = $event" />
    </div>

    <div class="section">
      <label class="fh-label">Auteur <span :class="charClass(authorName.length, 256)">{{ authorName.length }}/256</span></label>
      <input v-model="authorName" placeholder="Nom de l'auteur" class="fh-input" />
      <input v-model="authorUrl" placeholder="Lien auteur (https://...)" class="fh-input mt-1" />
      <div class="img-row mt-1">
        <input v-model="authorIcon" placeholder="URL icône auteur" class="fh-input" />
        <button @click="triggerUpload('authorIcon')" class="btn-secondary upload-btn" title="Uploader une image">📤</button>
      </div>
    </div>

    <div class="section">
      <label class="fh-label">Titre <span :class="charClass(embed.title?.length ?? 0, 256)">{{ embed.title?.length ?? 0 }}/256</span></label>
      <input v-model="embed.title" placeholder="Titre de l'embed" class="fh-input" />
      <input v-model="embed.url" placeholder="URL du titre (optionnel)" class="fh-input mt-1" />
    </div>

    <div class="section">
      <div class="desc-label-row">
        <label class="fh-label">Description <span :class="charClass(embed.description?.length ?? 0, 4096)">{{ embed.description?.length ?? 0 }}/4096</span></label>
        <EmojiPicker @select="insertEmoji" />
      </div>
      <textarea ref="descTextarea" v-model="embed.description"
        placeholder="Description — **gras**, *italique*, `code`, [lien](url), ~~barré~~"
        class="fh-textarea desc-textarea" rows="8" />
    </div>

    <div class="section row">
      <div class="half">
        <label class="fh-label">Miniature (thumbnail)</label>
        <div class="img-row">
          <input v-model="thumbnailUrl" placeholder="https://..." class="fh-input" />
          <button @click="triggerUpload('thumbnail')" class="btn-secondary upload-btn" title="Uploader une image">📤</button>
        </div>
        <img v-if="thumbnailUrl" :src="thumbnailUrl" class="img-mini-preview" alt=""
          @error="($event.target as HTMLImageElement).style.display='none'" />
      </div>
      <div class="half">
        <label class="fh-label">Image principale</label>
        <div class="img-row">
          <input v-model="imageUrl" placeholder="https://..." class="fh-input" />
          <button @click="triggerUpload('image')" class="btn-secondary upload-btn" title="Uploader une image">📤</button>
        </div>
        <img v-if="imageUrl" :src="imageUrl" class="img-main-preview" alt=""
          @error="($event.target as HTMLImageElement).style.display='none'" />
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
        <label class="fh-label">Pied de page <span :class="charClass(footerText.length, 2048)">{{ footerText.length }}/2048</span></label>
        <input v-model="footerText" placeholder="Texte du footer" class="fh-input" />
        <div class="img-row mt-1">
          <input v-model="footerIcon" placeholder="URL icône footer" class="fh-input" />
          <button @click="triggerUpload('footerIcon')" class="btn-secondary upload-btn" title="Uploader une image">📤</button>
        </div>
      </div>
      <div class="half">
        <label class="fh-label">Horodatage</label>
        <input type="datetime-local" v-model="timestampLocal" @change="onTimestampChange" class="fh-input" />
        <button @click="setNow" class="btn-secondary mt-1" style="width:100%">Maintenant</button>
      </div>
    </div>

    <p v-if="uploadError" class="upload-error">⚠️ {{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import EmbedColorPicker from './EmbedColorPicker.vue'
import EmbedFieldEditor from './EmbedFieldEditor.vue'
import EmojiPicker from '../shared/EmojiPicker.vue'
import type { DiscordEmbed } from '../../types/discord'
import api from '../../api/client'

const embed = defineModel<Partial<DiscordEmbed>>({ required: true })
const descTextarea = ref<HTMLTextAreaElement | null>(null)

function insertEmoji(emoji: string) {
  const el = descTextarea.value
  const cur = embed.value.description ?? ''
  const start = el?.selectionStart ?? cur.length
  const end = el?.selectionEnd ?? cur.length
  embed.value.description = cur.slice(0, start) + emoji + cur.slice(end)
  nextTick(() => {
    if (el) {
      el.setSelectionRange(start + emoji.length, start + emoji.length)
      el.focus()
    }
  })
}

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

function charClass(len: number, max: number) {
  if (len > max) return 'char-count char-over'
  if (len > max * 0.9) return 'char-count char-warn'
  return 'char-count'
}

// Upload
const fileInput = ref<HTMLInputElement | null>(null)
const uploadTarget = ref<'thumbnail' | 'image' | 'authorIcon' | 'footerIcon'>('image')
const uploadError = ref('')

function triggerUpload(target: typeof uploadTarget.value) {
  uploadTarget.value = target
  uploadError.value = ''
  fileInput.value?.click()
}

async function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    const url: string = data.url
    if (uploadTarget.value === 'thumbnail') thumbnailUrl.value = url
    else if (uploadTarget.value === 'image') imageUrl.value = url
    else if (uploadTarget.value === 'authorIcon') authorIcon.value = url
    else if (uploadTarget.value === 'footerIcon') footerIcon.value = url
  } catch (err: any) {
    uploadError.value = err?.response?.data?.error ?? 'Erreur upload'
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style scoped>
.embed-builder { display: flex; flex-direction: column; gap: 4px; }
.desc-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.desc-label-row .fh-label { margin-bottom: 0; }
.desc-textarea { min-height: 140px; }
.char-count { font-size: 10px; color: #72767d; font-weight: 500; margin-left: 4px; }
.char-warn { color: #faa61a; }
.char-over { color: #ed4245; font-weight: 700; }
.row { display: flex; gap: 12px; }
.half { flex: 1; min-width: 0; }
.mt-1 { margin-top: 4px; }
.img-row { display: flex; gap: 6px; align-items: center; }
.upload-btn { padding: 6px 10px; flex-shrink: 0; }
.img-mini-preview { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-top: 6px; border: 1px solid var(--border); }
.img-main-preview { max-width: 100%; max-height: 120px; object-fit: contain; border-radius: 4px; margin-top: 6px; border: 1px solid var(--border); }
.upload-error { font-size: 12px; color: var(--danger); margin-top: 4px; }
</style>
