<template>
  <div class="page">
    <div class="page-header">
      <h1>📖 Tutoriaux</h1>
      <router-link to="/tutorials/new" class="btn-primary">+ Nouveau tutoriel</router-link>
    </div>

    <div class="grid-2">
      <div v-for="t in tutorials" :key="t.id" class="card tutorial-card">
        <div class="tut-header">
          <span :class="['badge', t.published ? 'badge-success' : 'badge-info']">
            {{ t.published ? '🌐 Publié' : '📝 Brouillon' }}
          </span>
          <div class="tut-date">{{ fmtDate(t.created_at ?? '') }}</div>
        </div>
        <h3 class="tut-title">{{ t.title }}</h3>
        <p v-if="t.description" class="tut-desc">{{ t.description }}</p>
        <div class="tut-blocks">{{ blockCount(t) }}</div>
        <div class="tut-actions">
          <router-link :to="`/tutorials/${t.id}`" class="btn-primary" style="font-size:12px;padding:5px 12px">✏️ Éditer</router-link>
          <button @click="remove(t.id)" class="btn-danger-sm">🗑</button>
        </div>
      </div>
      <div v-if="!tutorials.length" class="empty-state">
        Aucun tutoriel. Créez-en un avec l'éditeur de blocs.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const tutorials = ref<any[]>([])

onMounted(async () => {
  const { data } = await api.get('/tutorials')
  tutorials.value = data
})

function fmtDate(d: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function blockCount(t: any): string {
  const n = Array.isArray(t.blocks) ? t.blocks.length : 0
  return `${n} bloc${n > 1 ? 's' : ''}`
}

async function remove(id: number) {
  if (!confirm('Supprimer ce tutoriel ?')) return
  await api.delete(`/tutorials/${id}`)
  tutorials.value = tutorials.value.filter(t => t.id !== id)
  ui.notify('Tutoriel supprimé')
}
</script>

<style scoped>
.tut-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tut-date { font-size: 11px; color: var(--text-muted); }
.tut-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.tut-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
.tut-blocks { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
.tut-actions { display: flex; gap: 8px; align-items: center; }
.empty-state { color: var(--text-muted); padding: 48px; text-align: center; grid-column: 1 / -1; }
</style>
