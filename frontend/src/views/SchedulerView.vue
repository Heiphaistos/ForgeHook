<template>
  <div class="page">
    <div class="page-header">
      <h1>⏰ Planificateur</h1>
      <button @click="openForm()" class="btn-primary">+ Nouveau job</button>
    </div>

    <div class="grid-2">
      <div v-for="j in jobs" :key="j.id" class="card">
        <div class="job-header">
          <span :class="['badge', j.enabled ? 'badge-success' : 'badge-error']">
            {{ j.enabled ? '▶ Actif' : '⏸ Pausé' }}
          </span>
          <span class="job-name">{{ j.name }}</span>
        </div>
        <div class="job-cron">
          <code>{{ j.cron_expr }}</code>
          <span class="cron-desc">{{ describeCron(j.cron_expr) }}</span>
        </div>
        <div class="job-meta">
          <span>Webhook: {{ webhookName(j.webhook_id) }}</span>
          <span v-if="j.last_run">Dernier: {{ fmtDate(j.last_run) }}</span>
        </div>
        <div class="job-actions">
          <button @click="toggle(j)" :class="j.enabled ? 'btn-secondary' : 'btn-primary'">
            {{ j.enabled ? '⏸' : '▶' }}
          </button>
          <button @click="remove(j.id)" class="btn-danger-sm">🗑</button>
        </div>
      </div>
      <div v-if="!jobs.length" class="empty-state">Aucun job planifié.</div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal" style="max-width:580px">
        <h3>Nouveau job planifié</h3>
        <div class="section">
          <label class="fh-label">Nom *</label>
          <input v-model="form.name" placeholder="Ex: Rapport quotidien" class="fh-input" autofocus />
        </div>
        <div class="section">
          <label class="fh-label">Webhook cible *</label>
          <select v-model="form.webhook_id" class="fh-select w-full">
            <option :value="0" disabled>Choisir</option>
            <option v-for="w in webhooks" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div class="section">
          <label class="fh-label">Expression cron *</label>
          <input v-model="form.cron_expr" placeholder="0 9 * * 1-5" class="fh-input" />
          <div class="cron-presets">
            <button v-for="p in cronPresets" :key="p.expr" @click="form.cron_expr = p.expr" class="btn-secondary preset-btn">
              {{ p.label }}
            </button>
          </div>
          <p style="font-size:11px;color:var(--text-muted);margin-top:4px">
            Format: minute heure jour-mois mois jour-semaine
          </p>
        </div>
        <div class="section">
          <label class="fh-label">Message Discord (JSON payload)</label>
          <textarea v-model="form.payloadStr" placeholder='{"content":"Hello !","embeds":[...]}' class="fh-textarea" rows="5" />
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button @click="submit" class="btn-primary">Créer</button>
          <button @click="showForm = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'
import type { ScheduledJob, Webhook } from '../types/app'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const jobs = ref<ScheduledJob[]>([])
const webhooks = ref<Webhook[]>([])
const showForm = ref(false)
const formError = ref('')
const form = ref({ name: '', webhook_id: 0, cron_expr: '0 9 * * 1-5', payloadStr: '{"content":"Message planifié"}' })

const cronPresets = [
  { label: 'Chaque minute', expr: '* * * * *' },
  { label: 'Toutes les heures', expr: '0 * * * *' },
  { label: 'Tous les jours 9h', expr: '0 9 * * *' },
  { label: 'Lun-Ven 9h', expr: '0 9 * * 1-5' },
  { label: 'Chaque lundi', expr: '0 9 * * 1' },
  { label: 'Chaque 1er du mois', expr: '0 9 1 * *' },
]

onMounted(async () => {
  const [j, w] = await Promise.all([api.get('/scheduler'), api.get('/webhooks')])
  jobs.value = j.data
  webhooks.value = w.data
})

function webhookName(id: number): string {
  return webhooks.value.find(w => w.id === id)?.name ?? `#${id}`
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function describeCron(expr: string): string {
  const map: Record<string, string> = {
    '* * * * *': 'Chaque minute',
    '0 * * * *': 'Toutes les heures',
    '0 9 * * *': 'Tous les jours à 9h',
    '0 9 * * 1-5': 'Lun–Ven à 9h',
    '0 9 * * 1': 'Chaque lundi à 9h',
    '0 9 1 * *': 'Le 1er du mois à 9h',
  }
  return map[expr] ?? ''
}

async function submit() {
  formError.value = ''
  if (!form.value.name || !form.value.webhook_id || !form.value.cron_expr) {
    formError.value = 'Tous les champs requis'
    return
  }
  let payload: object
  try { payload = JSON.parse(form.value.payloadStr) } catch { formError.value = 'JSON payload invalide'; return }
  try {
    await api.post('/scheduler', { name: form.value.name, webhook_id: form.value.webhook_id, cron_expr: form.value.cron_expr, payload, enabled: true })
    const { data } = await api.get('/scheduler')
    jobs.value = data
    showForm.value = false
    ui.notify('Job planifié créé !')
  } catch (e: any) {
    formError.value = e.response?.data?.error ?? 'Erreur'
  }
}

async function toggle(j: ScheduledJob) {
  await api.patch(`/scheduler/${j.id}/toggle`)
  j.enabled = j.enabled ? 0 : 1
  ui.notify(j.enabled ? 'Job activé' : 'Job mis en pause')
}

async function remove(id: number) {
  await api.delete(`/scheduler/${id}`)
  jobs.value = jobs.value.filter(j => j.id !== id)
  ui.notify('Job supprimé')
}

function openForm() {
  form.value = { name: '', webhook_id: 0, cron_expr: '0 9 * * 1-5', payloadStr: '{"content":"Message planifié"}' }
  formError.value = ''
  showForm.value = true
}
</script>

<style scoped>
.job-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.job-name { font-weight: 700; font-size: 15px; color: #fff; }
.job-cron { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.job-cron code { background: #202225; padding: 2px 8px; border-radius: 4px; font-size: 13px; color: #57f287; }
.cron-desc { font-size: 12px; color: var(--text-muted); }
.job-meta { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.job-actions { display: flex; gap: 6px; }
.cron-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.preset-btn { font-size: 11px; padding: 4px 10px; }
.empty-state { color: var(--text-muted); padding: 48px; text-align: center; grid-column: 1 / -1; }
</style>
