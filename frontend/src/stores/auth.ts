import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('fh_token'))
  const configured = ref(false)

  async function checkStatus() {
    const { data } = await api.get('/auth/status')
    configured.value = data.configured
  }

  async function setup(password: string) {
    await api.post('/auth/setup', { password })
    configured.value = true
  }

  // Retourne { needs2fa: true } si un code TOTP est requis pour finaliser.
  async function login(password: string, code?: string): Promise<{ needs2fa?: boolean }> {
    try {
      const { data } = await api.post('/auth/login', { password, code: code || undefined })
      token.value = data.token
      localStorage.setItem('fh_token', data.token)
      return {}
    } catch (e: any) {
      if (e.response?.status === 401 && e.response?.data?.needs2fa) {
        return { needs2fa: true }
      }
      throw e
    }
  }

  function logout() {
    token.value = null
    localStorage.removeItem('fh_token')
  }

  return { token, configured, checkStatus, setup, login, logout }
})
