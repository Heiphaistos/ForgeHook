<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">⚒️ ForgeHook</div>
      <p class="auth-sub">Gestionnaire Discord tout-en-un</p>
      <h2>Connexion</h2>
      <form @submit.prevent="submit">
        <div class="section">
          <label class="fh-label">Mot de passe admin</label>
          <input v-model="password" type="password" placeholder="••••••••" class="fh-input" autofocus />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary w-full mt-2" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  try { await auth.checkStatus() } catch {}
})

async function submit() {
  if (!password.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Connexion échouée'
  } finally {
    loading.value = false
  }
}
</script>
