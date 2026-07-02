<template>
  <div class="app">
    <template v-if="isAuthRoute">
      <router-view />
    </template>
    <template v-else>
      <AppNav />
      <main class="main-content">
        <router-view />
      </main>
    </template>
    <AppNotification />
    <footer class="legal-footer">
      <a href="https://heiphaistos.org/legal/" target="_blank" rel="noopener noreferrer">Mentions légales</a>
    </footer>
  </div>
</template>

<style scoped>
.legal-footer {
  text-align: center;
  padding: 8px 0 12px;
  font-size: 0.72rem;
  opacity: 0.55;
}
.legal-footer a {
  color: inherit;
  text-decoration: none;
}
.legal-footer a:hover {
  text-decoration: underline;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from './components/shared/AppNav.vue'
import AppNotification from './components/shared/AppNotification.vue'

const route = useRoute()
const isAuthRoute = computed(() => ['/login', '/setup'].includes(route.path))
</script>
