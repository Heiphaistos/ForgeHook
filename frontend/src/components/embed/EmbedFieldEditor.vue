<template>
  <div class="fields-editor">
    <div v-for="(field, i) in fields" :key="i" class="field-row">
      <div class="field-inputs">
        <input v-model="field.name" placeholder="Nom du champ (ex: Prix)" class="fh-input" />
        <textarea v-model="field.value" placeholder="Valeur du champ — supporte **bold**, *italic*" class="fh-textarea" rows="2" />
        <label class="inline-toggle">
          <input type="checkbox" v-model="field.inline" />
          <span>Inline</span>
        </label>
      </div>
      <button @click="remove(i)" class="btn-danger-sm" title="Supprimer ce champ">✕</button>
    </div>
    <button @click="add" class="btn-add" :disabled="fields.length >= 25">
      + Ajouter champ {{ fields.length > 0 ? `(${fields.length}/25)` : '' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DiscordEmbedField } from '../../types/discord'

const props = defineProps<{ fields: DiscordEmbedField[] }>()
const emit = defineEmits<{ (e: 'update:fields', v: DiscordEmbedField[]): void }>()

function add() {
  if (props.fields.length >= 25) return
  emit('update:fields', [...props.fields, { name: '', value: '', inline: false }])
}

function remove(i: number) {
  const next = [...props.fields]
  next.splice(i, 1)
  emit('update:fields', next)
}
</script>

<style scoped>
.fields-editor { display: flex; flex-direction: column; gap: 8px; }
.field-row { display: flex; gap: 8px; align-items: flex-start; background: #202225; border-radius: 6px; padding: 10px; }
.field-inputs { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.inline-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #8e9297; cursor: pointer; }
.inline-toggle input { cursor: pointer; accent-color: #5865f2; }
</style>
