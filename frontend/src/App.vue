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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from './components/shared/AppNav.vue'
import AppNotification from './components/shared/AppNotification.vue'

const route = useRoute()
const isAuthRoute = computed(() => ['/login', '/setup'].includes(route.path))
</script>
