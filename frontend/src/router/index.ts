import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/setup', component: () => import('../views/SetupView.vue'), meta: { requiresUnconfigured: true } },
    { path: '/', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/embed', component: () => import('../views/EmbedBuilderView.vue'), meta: { requiresAuth: true } },
    { path: '/webhooks', component: () => import('../views/WebhooksView.vue'), meta: { requiresAuth: true } },
    { path: '/bots', component: () => import('../views/BotsView.vue'), meta: { requiresAuth: true } },
    { path: '/rss', component: () => import('../views/RssView.vue'), meta: { requiresAuth: true } },
    { path: '/tutorials', component: () => import('../views/TutorialsView.vue'), meta: { requiresAuth: true } },
    { path: '/tutorials/new', component: () => import('../views/TutorialEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/tutorials/:id', component: () => import('../views/TutorialEditorView.vue'), meta: { requiresAuth: true } },
    { path: '/scheduler', component: () => import('../views/SchedulerView.vue'), meta: { requiresAuth: true } },
    { path: '/history', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/templates', component: () => import('../views/TemplatesView.vue'), meta: { requiresAuth: true } },
    { path: '/fonts', component: () => import('../views/DiscordFontsView.vue'), meta: { requiresAuth: true } },
    { path: '/media', component: () => import('../views/MediaManagerView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const token = localStorage.getItem('fh_token')
  if (to.meta.requiresAuth && !token) return '/login'

  if (to.meta.requiresUnconfigured) {
    const auth = useAuthStore()
    try { await auth.checkStatus() } catch {}
    if (auth.configured) return '/login'
  }
})

export default router
