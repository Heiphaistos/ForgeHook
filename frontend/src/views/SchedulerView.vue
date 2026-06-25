<template>
  <div class="page">
    <div class="page-header">
      <h1>⏰ Planificateur</h1>
      <button @click="openForm()" class="btn-primary">+ Nouveau job</button>
    </div>

    <div class="grid-2">
      <div v-for="j in jobs" :key="j.id" class="card job-card">
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
          <span v-if="j.last_run">Dernier run: {{ relTime(j.last_run) }}</span>
          <span v-else class="never-run">Jamais exécuté</span>
        </div>
        <div class="job-actions">
          <button @click="toggle(j)" :class="j.enabled ? 'btn-secondary' : 'btn-primary'">
            {{ j.enabled ? '⏸' : '▶' }}
          </button>
          <button @click="runNow(j.id)" class="btn-secondary" :disabled="running === j.id" title="Tester maintenant">
            {{ running === j.id ? '⏳' : '⚡ Tester' }}
          </button>
          <button @click="openEdit(j)" class="btn-secondary" title="Modifier">✏️</button>
          <button @click="cloneJob(j)" class="btn-secondary" title="Cloner">⎘</button>
          <button @click="remove(j.id)" class="btn-danger-sm">🗑</button>
        </div>
      </div>
      <div v-if="!jobs.length" class="empty-state">Aucun job planifié.</div>
    </div>

    <!-- Vue calendrier — prochaines exécutions (#15) -->
    <div v-if="enabledJobs.length" class="next-runs-section">
      <h3 class="next-runs-title">📅 Prochaines exécutions (72h)</h3>
      <div class="next-runs-list">
        <div v-for="entry in nextRunEntries" :key="`${entry.jobId}-${entry.time}`" class="next-run-item">
          <span class="next-run-time">{{ entry.label }}</span>
          <span class="next-run-name">{{ entry.name }}</span>
          <span class="next-run-wh">→ {{ webhookName(entry.webhookId) }}</span>
        </div>
        <div v-if="!nextRunEntries.length" class="next-run-empty">Aucune exécution dans les 72h détectée.</div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal" style="max-width:580px">
        <h3>{{ editing ? 'Modifier job' : 'Nouveau job planifié' }}</h3>
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
          <button @click="submit" class="btn-primary">{{ editing ? 'Modifier' : 'Créer' }}</button>
          <button @click="showForm = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../api/client'
import type { ScheduledJob, Webhook } from '../types/app'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const jobs = ref<ScheduledJob[]>([])
const webhooks = ref<Webhook[]>([])
const showForm = ref(false)
const editing = ref<ScheduledJob | null>(null)
const formError = ref('')
const form = ref({ name: '', webhook_id: 0, cron_expr: '0 9 * * 1-5', payloadStr: '{"content":"Message planifié"}' })
const running = ref<number | null>(null)

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

function relTime(d: string): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'il y a quelques secondes'
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

const enabledJobs = computed(() => jobs.value.filter(j => j.enabled))

// Simple cron next-run calculator (handles basic patterns)
function getNextRuns(cronExpr: string, count = 5): Date[] {
  const results: Date[] = []
  const [m, h, dom, mon, dow] = cronExpr.split(' ')
  const now = new Date()
  let cursor = new Date(now)
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)
  let tries = 0

  while (results.length < count && tries++ < 60 * 24 * 4) {
    const curMin = cursor.getMinutes()
    const curHour = cursor.getHours()
    const curDom = cursor.getDate()
    const curMon = cursor.getMonth() + 1
    const curDow = cursor.getDay()

    const matchField = (field: string, val: number): boolean => {
      if (field === '*') return true
      if (field.includes('-')) {
        const [a, b] = field.split('-').map(Number)
        return val >= a && val <= b
      }
      if (field.includes(',')) return field.split(',').map(Number).includes(val)
      if (field.includes('/')) {
        const [base, step] = field.split('/').map(s => s === '*' ? 0 : Number(s))
        return (val - base) % step === 0
      }
      return Number(field) === val
    }

    if (matchField(mon, curMon) && matchField(dom, curDom) && matchField(dow, curDow) && matchField(h, curHour) && matchField(m, curMin)) {
      results.push(new Date(cursor))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }
  return results
}

const nextRunEntries = computed(() => {
  const entries: { jobId: number; time: number; label: string; name: string; webhookId: number }[] = []
  const horizon = Date.now() + 72 * 3600 * 1000
  for (const j of enabledJobs.value) {
    try {
      const runs = getNextRuns(j.cron_expr, 5)
      for (const r of runs) {
        if (r.getTime() > horizon) break
        entries.push({
          jobId: j.id,
          time: r.getTime(),
          label: r.toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          name: j.name,
          webhookId: j.webhook_id,
        })
      }
    } catch {}
  }
  return entries.sort((a, b) => a.time - b.time).slice(0, 20)
})

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

async function runNow(id: number) {
  running.value = id
  try {
    await api.post(`/scheduler/${id}/run`)
    ui.notify('Job exécuté manuellement ✅')
    const { data } = await api.get('/scheduler')
    jobs.value = data
  } catch (e: any) {
    ui.notify(e.response?.data?.error ?? "Erreur d'exécution", 'error')
  } finally {
    running.value = null
  }
}

async function cloneJob(j: ScheduledJob) {
  try {
    let payload: object = {}
    if (j.payload) {
      try { payload = typeof j.payload === 'string' ? JSON.parse(j.payload) : j.payload } catch {}
    }
    await api.post('/scheduler', {
      name: `${j.name} (copie)`,
      webhook_id: j.webhook_id,
      cron_expr: j.cron_expr,
      payload,
      enabled: false,
    })
    const { data } = await api.get('/scheduler')
    jobs.value = data
    ui.notify('Job cloné — désactivé par défaut')
  } catch {
    ui.notify('Erreur lors du clonage', 'error')
  }
}

function openForm() {
  editing.value = null
  form.value = { name: '', webhook_id: 0, cron_expr: '0 9 * * 1-5', payloadStr: '{"content":"Message planifié"}' }
  formError.value = ''
  showForm.value = true
}

function openEdit(j: ScheduledJob) {
  editing.value = j
  let payloadStr = '{"content":""}'
  try { payloadStr = JSON.stringify(typeof j.payload === 'string' ? JSON.parse(j.payload) : j.payload, null, 2) } catch {}
  form.value = { name: j.name, webhook_id: j.webhook_id, cron_expr: j.cron_expr, payloadStr }
  formError.value = ''
  showForm.value = true
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
    if (editing.value) {
      await api.put(`/scheduler/${editing.value.id}`, { name: form.value.name, webhook_id: form.value.webhook_id, cron_expr: form.value.cron_expr, payload })
    } else {
      await api.post('/scheduler', { name: form.value.name, webhook_id: form.value.webhook_id, cron_expr: form.value.cron_expr, payload, enabled: true })
    }
    const { data } = await api.get('/scheduler')
    jobs.value = data
    showForm.value = false
    ui.notify(editing.value ? 'Job modifié !' : 'Job planifié créé !')
    editing.value = null
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
  if (!confirm('Supprimer ce job planifié ?')) return
  await api.delete(`/scheduler/${id}`)
  jobs.value = jobs.value.filter(j => j.id !== id)
  ui.notify('Job supprimé')
}
</script>

<style scoped>
.job-card { display: flex; flex-direction: column; gap: 4px; }
.job-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.job-name { font-weight: 700; font-size: 15px; color: #fff; }
.job-cron { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.job-cron code { background: #202225; padding: 2px 8px; border-radius: 4px; font-size: 13px; color: #57f287; }
.cron-desc { font-size: 12px; color: var(--text-muted); }
.job-meta { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.never-run { color: #72767d; font-style: italic; }
.job-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.cron-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.preset-btn { font-size: 11px; padding: 4px 10px; }
.empty-state { color: var(--text-muted); padding: 48px; text-align: center; grid-column: 1 / -1; }
/* Next runs calendar */
.next-runs-section { margin-top: 24px; }
.next-runs-title { font-size: 15px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
.next-runs-list { display: flex; flex-direction: column; gap: 4px; }
.next-run-item { display: grid; grid-template-columns: 160px 1fr auto; gap: 10px; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; padding: 7px 12px; font-size: 13px; }
.next-run-time { font-family: monospace; font-size: 12px; color: #57f287; font-weight: 600; }
.next-run-name { color: #fff; font-weight: 600; }
.next-run-wh { font-size: 11px; color: var(--text-muted); }
.next-run-empty { color: var(--text-muted); font-size: 13px; }
</style>
