<template>
  <Transition name="notif">
    <div v-if="ui.notification" :class="['notification', ui.notification.type]">
      {{ ui.notification.msg }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUiStore } from '../../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0,0,0,.4);
  max-width: 320px;
}
.notification.success { background: #57f287; color: #000; }
.notification.error { background: #ed4245; color: #fff; }
.notification.info { background: #5865f2; color: #fff; }
.notif-enter-active, .notif-leave-active { transition: all 0.3s ease; }
.notif-enter-from, .notif-leave-to { opacity: 0; transform: translateY(16px) scale(0.95); }
</style>
