<template>
  <nav class="sidebar" :class="{ collapsed: !ui.sidebarOpen }">
    <div class="sidebar-header">
      <span class="logo-icon">⚒️</span>
      <span v-if="ui.sidebarOpen" class="logo-text">ForgeHook</span>
      <button @click="ui.sidebarOpen = !ui.sidebarOpen" class="collapse-btn" :title="ui.sidebarOpen ? 'Réduire' : 'Agrandir'">
        {{ ui.sidebarOpen ? '◀' : '▶' }}
      </button>
    </div>

    <div class="nav-items">
      <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" :title="item.label">
        <span class="nav-icon">{{ item.icon }}</span>
        <span v-if="ui.sidebarOpen" class="nav-label">{{ item.label }}</span>
      </router-link>
    </div>

    <div class="sidebar-footer">
      <button @click="logout" class="nav-item logout" :title="ui.sidebarOpen ? '' : 'Déconnexion'">
        <span class="nav-icon">🚪</span>
        <span v-if="ui.sidebarOpen">Déconnexion</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useUiStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const ui = useUiStore()
const auth = useAuthStore()
const router = useRouter()

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/embed', icon: '⚡', label: 'Embed Builder' },
  { to: '/webhooks', icon: '🔗', label: 'Webhooks' },
  { to: '/bots', icon: '🤖', label: 'Bots' },
  { to: '/rss', icon: '📰', label: 'RSS Feeds' },
  { to: '/tutorials', icon: '📖', label: 'Tutoriaux' },
  { to: '/scheduler', icon: '⏰', label: 'Planificateur' },
  { to: '/history', icon: '📜', label: 'Historique' },
  { to: '/templates', icon: '📋', label: 'Templates' },
  { to: '/fonts', icon: '🔤', label: 'Discord Fonts' },
  { to: '/media', icon: '🖼️', label: 'Médias' },
]

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #202225;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  border-right: 1px solid #121416;
  flex-shrink: 0;
}
.sidebar.collapsed { width: 60px; }
.sidebar-header {
  padding: 16px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #2f3136;
  min-height: 60px;
}
.logo-icon { font-size: 24px; flex-shrink: 0; }
.logo-text { font-size: 17px; font-weight: 800; color: #5865f2; flex: 1; white-space: nowrap; }
.collapse-btn { background: none; border: none; color: #8e9297; cursor: pointer; font-size: 12px; padding: 4px; margin-left: auto; }
.collapse-btn:hover { color: #dcddde; }
.nav-items { flex: 1; padding: 8px; overflow-y: auto; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 6px;
  text-decoration: none;
  color: #8e9297;
  transition: all 0.12s;
  margin-bottom: 2px;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
.nav-item:hover { background: #2f3136; color: #dcddde; }
.nav-item.router-link-exact-active { background: #2f3136; color: #5865f2; }
.nav-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }
.sidebar-footer { padding: 8px; border-top: 1px solid #2f3136; }
.logout:hover { color: #ed4245 !important; }
</style>
