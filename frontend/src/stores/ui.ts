import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const theme = ref<string>(localStorage.getItem('fh_theme') ?? 'dark')
  const sidebarOpen = ref(true)
  const notification = ref<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  function setTheme(t: string) {
    theme.value = t
    localStorage.setItem('fh_theme', t)
  }

  function notify(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    notification.value = { msg, type }
    setTimeout(() => { notification.value = null }, 3500)
  }

  return { theme, sidebarOpen, notification, setTheme, notify }
})
