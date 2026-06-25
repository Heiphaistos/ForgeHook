<template>
  <div class="mention-builder" ref="root">
    <button @click="open = !open" class="mention-toggle" title="Insérer une mention">@ Mention</button>
    <div v-if="open" class="mention-panel">
      <div class="mention-section">
        <div class="mention-label">Rapide</div>
        <div class="mention-quick">
          <button @click="insert('@everyone')" class="mention-chip red">@everyone</button>
          <button @click="insert('@here')" class="mention-chip orange">@here</button>
        </div>
      </div>
      <div class="mention-section">
        <div class="mention-label">Rôle</div>
        <div class="mention-row">
          <input v-model="roleId" placeholder="ID du rôle" class="mention-input" @keydown.enter="insertRole" />
          <button @click="insertRole" class="mention-chip accent">Insérer</button>
        </div>
        <div v-if="roleId" class="mention-preview">Aperçu : <span class="role-mention">@rôle</span> → <code>&lt;@&amp;{{ roleId }}&gt;</code></div>
      </div>
      <div class="mention-section">
        <div class="mention-label">Utilisateur</div>
        <div class="mention-row">
          <input v-model="userId" placeholder="ID utilisateur" class="mention-input" @keydown.enter="insertUser" />
          <button @click="insertUser" class="mention-chip accent">Insérer</button>
        </div>
      </div>
      <div class="mention-section">
        <div class="mention-label">Channel</div>
        <div class="mention-row">
          <input v-model="channelId" placeholder="ID du channel" class="mention-input" @keydown.enter="insertChannel" />
          <button @click="insertChannel" class="mention-chip accent">Insérer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const emit = defineEmits<{ (e: 'insert', text: string): void }>()

const open = ref(false)
const root = ref<HTMLElement>()
const roleId = ref('')
const userId = ref('')
const channelId = ref('')

onClickOutside(root, () => { open.value = false })

function insert(text: string) {
  emit('insert', text)
  open.value = false
}

function insertRole() {
  if (!roleId.value.trim()) return
  insert(`<@&${roleId.value.trim()}>`)
  roleId.value = ''
}

function insertUser() {
  if (!userId.value.trim()) return
  insert(`<@${userId.value.trim()}>`)
  userId.value = ''
}

function insertChannel() {
  if (!channelId.value.trim()) return
  insert(`<#${channelId.value.trim()}>`)
  channelId.value = ''
}
</script>

<style scoped>
.mention-builder { position: relative; }
.mention-toggle {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s;
}
.mention-toggle:hover { border-color: var(--accent); color: var(--accent); }
.mention-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  width: 280px;
  z-index: 300;
  box-shadow: 0 4px 20px rgba(0,0,0,.5);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mention-section { display: flex; flex-direction: column; gap: 6px; }
.mention-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); }
.mention-quick { display: flex; gap: 6px; }
.mention-row { display: flex; gap: 6px; }
.mention-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 4px 8px;
  outline: none;
}
.mention-input:focus { border-color: var(--accent); }
.mention-chip {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.mention-chip:hover { opacity: 0.85; }
.mention-chip.red { background: rgba(237,66,69,.25); color: #ed4245; }
.mention-chip.orange { background: rgba(250,166,26,.25); color: #faa61a; }
.mention-chip.accent { background: rgba(88,101,242,.25); color: var(--accent); }
.mention-preview { font-size: 11px; color: var(--text-muted); }
.mention-preview code { font-family: monospace; font-size: 10px; background: var(--bg-tertiary); padding: 1px 4px; border-radius: 3px; }
.role-mention { color: #b5c5f9; background: rgba(88,101,242,.2); border-radius: 3px; padding: 1px 4px; }
</style>
