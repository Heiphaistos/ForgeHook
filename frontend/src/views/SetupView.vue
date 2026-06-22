<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">⚒️ ForgeHook</div>
      <p class="auth-sub">Configuration initiale</p>
      <h2>Définir le mot de passe</h2>
      <form @submit.prevent="submit">
        <div class="section">
          <label class="fh-label">Mot de passe admin (min 8 caractères)</label>
          <input v-model="password" type="password" placeholder="••••••••" class="fh-input" autofocus />
        </div>
        <div class="section">
          <label class="fh-label">Confirmer le mot de passe</label>
          <input v-model="confirm" type="password" placeholder="••••••••" class="fh-input" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="done" class="success">✅ Mot de passe configuré ! Redirection...</p>
        <button type="submit" class="btn-primary w-full mt-2" :disabled="loading || done">
          {{ loading ? 'Configuration...' : 'Configurer' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function submit() {
  error.value = ''
  if (password.value.length < 8) { error.value = 'Minimum 8 caractères'; return }
  if (password.value !== confirm.value) { error.value = 'Les mots de passe ne correspondent pas'; return }
  loading.value = true
  try {
    await auth.setup(password.value)
    done.value = true
    setTimeout(() => router.push('/login'), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Erreur lors de la configuration'
  } finally {
    loading.value = false
  }
}
</script>
