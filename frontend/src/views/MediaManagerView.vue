<template>
  <div class="page">
    <div class="page-header">
      <h1>🖼️ Médias</h1>
      <div class="header-meta">
        <span v-if="files.length" class="meta-info">{{ files.length }} fichier{{ files.length > 1 ? 's' : '' }} · {{ totalSize }}</span>
      </div>
    </div>

    <!-- Zone upload drag & drop -->
    <div
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()">
      <div class="drop-content">
        <span style="font-size:36px">📂</span>
        <p>Glisser-déposer des images ici ou <strong>cliquer pour parcourir</strong></p>
        <p class="drop-hint">JPG, PNG, GIF, WebP · Max 5 MB</p>
      </div>
      <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="onFileInput" />
    </div>

    <!-- Barre de progression upload -->
    <div v-if="uploading" class="upload-progress">
      <div class="upload-bar"><div class="upload-fill" /></div>
      <span>Envoi en cours...</span>
    </div>

    <!-- Filtres -->
    <div v-if="files.length" class="filters-bar" style="margin-top:16px">
      <input v-model="search" placeholder="🔍 Filtrer par nom..." class="fh-input filter-search" />
      <select v-model="sortBy" class="fh-select">
        <option value="date">Plus récent</option>
        <option value="name">Nom A-Z</option>
        <option value="size">Taille ↓</option>
      </select>
    </div>

    <!-- Grille médias -->
    <div v-if="filteredFiles.length" class="media-grid">
      <div v-for="f in filteredFiles" :key="f.name" class="media-card" :class="{ selected: selected.has(f.name) }">
        <div class="media-thumb-wrap" @click="toggleSelect(f.name)">
          <img :src="f.url" class="media-thumb" loading="lazy" :alt="f.name" @error="($event.target as HTMLImageElement).src = ''" />
          <div v-if="selected.has(f.name)" class="media-check">✓</div>
        </div>
        <div class="media-info">
          <div class="media-name" :title="f.name">{{ f.name.slice(0, 28) }}</div>
          <div class="media-size">{{ fmtSize(f.size) }}</div>
        </div>
        <div class="media-actions">
          <button @click="copyUrl(f.url)" class="btn-secondary" style="font-size:11px;padding:3px 8px" title="Copier URL">📋 URL</button>
          <button @click="openPreview(f)" class="btn-secondary" style="font-size:11px;padding:3px 8px" title="Aperçu">👁</button>
          <button @click="deleteFile(f.name)" class="btn-danger-sm" title="Supprimer">🗑</button>
        </div>
      </div>
    </div>

    <!-- Sélection multiple actions -->
    <div v-if="selected.size > 0" class="selection-bar">
      <span>{{ selected.size }} sélectionné(s)</span>
      <button @click="deleteSelected" class="btn-danger">🗑 Supprimer la sélection</button>
      <button @click="selected.clear(); selected = new Set(selected)" class="btn-secondary">✕ Désélectionner</button>
    </div>

    <div v-if="!files.length && !uploading" class="empty-state">
      Aucun fichier uploadé. Glissez une image ci-dessus pour commencer.
    </div>

    <!-- Modal aperçu -->
    <div v-if="previewFile" class="modal-overlay" @click.self="previewFile = null">
      <div class="modal preview-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="word-break:break-all;max-width:400px">{{ previewFile.name }}</h3>
          <button @click="previewFile = null" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer">✕</button>
        </div>
        <div style="text-align:center;background:var(--bg-tertiary);border-radius:8px;padding:16px;margin-bottom:12px">
          <img :src="previewFile.url" style="max-width:100%;max-height:50vh;border-radius:4px" :alt="previewFile.name" />
        </div>
        <div class="url-copy-row">
          <input :value="previewFile.url" readonly class="fh-input" style="font-size:12px" />
          <button @click="copyUrl(previewFile!.url)" class="btn-primary">📋 Copier</button>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">Taille: {{ fmtSize(previewFile.size) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../api/client'
import { useUiStore } from '../stores/ui'

interface MediaFile { name: string; url: string; size: number }

const ui = useUiStore()
const files = ref<MediaFile[]>([])
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const search = ref('')
const sortBy = ref<'date' | 'name' | 'size'>('date')
const selected = ref<Set<string>>(new Set())
const previewFile = ref<MediaFile | null>(null)

const totalSize = computed(() => fmtSize(files.value.reduce((sum, f) => sum + f.size, 0)))

const filteredFiles = computed(() => {
  let list = files.value
  if (search.value) list = list.filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()))
  if (sortBy.value === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'size') list = [...list].sort((a, b) => b.size - a.size)
  return list
})

onMounted(loadFiles)

async function loadFiles() {
  const { data } = await api.get('/uploads/list')
  files.value = data
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function toggleSelect(name: string) {
  if (selected.value.has(name)) selected.value.delete(name)
  else selected.value.add(name)
  selected.value = new Set(selected.value)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const items = Array.from(e.dataTransfer?.files ?? [])
  uploadFiles(items)
}

function onFileInput(e: Event) {
  const items = Array.from((e.target as HTMLInputElement).files ?? [])
  uploadFiles(items)
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadFiles(items: File[]) {
  if (!items.length) return
  uploading.value = true
  let uploaded = 0
  for (const file of items) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      uploaded++
    } catch (e: any) {
      ui.notify(e.response?.data?.error ?? `Erreur: ${file.name}`, 'error')
    }
  }
  uploading.value = false
  await loadFiles()
  if (uploaded > 0) ui.notify(`${uploaded} fichier${uploaded > 1 ? 's' : ''} uploadé${uploaded > 1 ? 's' : ''}`)
}

async function deleteFile(name: string) {
  await api.delete(`/uploads/${name}`)
  files.value = files.value.filter(f => f.name !== name)
  selected.value.delete(name)
  selected.value = new Set(selected.value)
  ui.notify('Fichier supprimé')
}

async function deleteSelected() {
  for (const name of selected.value) await api.delete(`/uploads/${name}`)
  files.value = files.value.filter(f => !selected.value.has(f.name))
  selected.value = new Set()
  ui.notify('Sélection supprimée')
}

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url)
  ui.notify('URL copiée !')
}

function openPreview(f: MediaFile) { previewFile.value = f }
</script>

<style scoped>
.header-meta { font-size: 13px; color: var(--text-muted); }
.drop-zone {
  border: 2px dashed var(--border); border-radius: 10px; padding: 40px;
  text-align: center; cursor: pointer; transition: all .15s; background: var(--bg-secondary);
}
.drop-zone:hover, .drop-zone.dragging { border-color: var(--accent); background: rgba(88,101,242,.06); }
.drop-content p { margin: 6px 0; color: var(--text-muted); font-size: 14px; }
.drop-hint { font-size: 12px !important; color: #5c6170 !important; }
.upload-progress { display: flex; align-items: center; gap: 12px; margin-top: 12px; font-size: 13px; color: var(--text-muted); }
.upload-bar { flex: 1; background: var(--bg-tertiary); border-radius: 4px; height: 6px; overflow: hidden; }
.upload-fill { width: 100%; height: 100%; background: var(--accent); animation: uploadPulse 1s ease-in-out infinite; }
@keyframes uploadPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
.filters-bar { display: flex; gap: 8px; }
.filter-search { flex: 1; min-width: 200px; }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 16px; }
.media-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; transition: border-color .15s; }
.media-card.selected { border-color: var(--accent); }
.media-thumb-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; background: var(--bg-tertiary); cursor: pointer; }
.media-thumb { width: 100%; height: 100%; object-fit: cover; transition: opacity .15s; }
.media-thumb-wrap:hover .media-thumb { opacity: .8; }
.media-check { position: absolute; top: 6px; right: 6px; background: var(--accent); color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.media-info { padding: 8px 10px 4px; }
.media-name { font-size: 12px; color: #dcddde; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.media-size { font-size: 11px; color: var(--text-muted); }
.media-actions { padding: 4px 6px 8px; display: flex; gap: 4px; justify-content: flex-end; }
.selection-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--bg-secondary); border: 1px solid var(--accent); border-radius: 30px; padding: 10px 20px; display: flex; align-items: center; gap: 12px; font-size: 14px; color: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.4); z-index: 100; }
.preview-modal { max-width: 600px; }
.url-copy-row { display: flex; gap: 8px; }
.empty-state { color: var(--text-muted); text-align: center; padding: 48px; }
</style>
