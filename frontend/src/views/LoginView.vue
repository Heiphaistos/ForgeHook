<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">⚒️ ForgeHook</div>
      <p class="auth-sub">Gestionnaire Discord tout-en-un</p>
      <h2>Connexion</h2>
      <form @submit.prevent="submit">
        <div class="section">
          <label class="fh-label">Mot de passe admin</label>
          <input v-model="password" type="password" placeholder="••••••••" class="fh-input" :disabled="needs2fa" autofocus />
        </div>
        <div v-if="needs2fa" class="section">
          <label class="fh-label">Code d'authentification (2FA)</label>
          <input v-model="code" type="text" inputmode="numeric" autocomplete="one-time-code"
                 maxlength="6" placeholder="123456" class="fh-input" ref="codeInput" />
          <p style="color: var(--text-muted); font-size:12px; margin-top:4px">
            Entrez le code à 6 chiffres de votre application d'authentification.
          </p>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary w-full mt-2" :disabled="loading">
          {{ loading ? 'Connexion...' : (needs2fa ? 'Valider le code' : 'Se connecter') }}
        </button>
        <p v-if="!auth.configured" class="mt-4" style="text-align:center; color: var(--text-muted); font-size:13px">
          Première fois ?
          <router-link to="/setup" style="color: var(--accent)">Configurer le mot de passe</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const password = ref('')
const code = ref('')
const needs2fa = ref(false)
const codeInput = ref<HTMLInputElement | null>(null)
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  try { await auth.checkStatus() } catch {}
})

async function submit() {
  if (!password.value) return
  if (needs2fa.value && !code.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await auth.login(password.value, needs2fa.value ? code.value : undefined)
    if (res.needs2fa) {
      needs2fa.value = true
      await nextTick()
      codeInput.value?.focus()
      return
    }
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Connexion échouée'
  } finally {
    loading.value = false
  }
}
</script>
