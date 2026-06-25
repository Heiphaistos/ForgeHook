import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import type { DiscordMessage } from '../types/discord'
import { emptyMessage, emptyEmbed } from '../types/discord'
import api from '../api/client'

const DRAFT_KEY = 'fh_embed_draft'
const HISTORY_MAX = 20

export const useEmbedStore = defineStore('embed', () => {
  const message = reactive<DiscordMessage>(emptyMessage())
  const selectedWebhookId = ref<number | null>(null)
  const sending = ref(false)
  const lastError = ref<string | null>(null)

  // Undo/Redo
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])
  let _suppressSnapshot = false

  function snapshot() {
    if (_suppressSnapshot) return
    undoStack.value.push(JSON.stringify(message))
    if (undoStack.value.length > HISTORY_MAX) undoStack.value.shift()
    redoStack.value = []
  }

  function undo() {
    if (!undoStack.value.length) return
    redoStack.value.push(JSON.stringify(message))
    const prev = undoStack.value.pop()!
    _applyState(JSON.parse(prev))
  }

  function redo() {
    if (!redoStack.value.length) return
    undoStack.value.push(JSON.stringify(message))
    const next = redoStack.value.pop()!
    _applyState(JSON.parse(next))
  }

  function _applyState(state: DiscordMessage) {
    _suppressSnapshot = true
    message.content = state.content
    message.username = state.username
    message.avatar_url = state.avatar_url
    message.tts = state.tts
    message.embeds = state.embeds
    if (state.thread_id !== undefined) message.thread_id = state.thread_id
    else delete message.thread_id
    _suppressSnapshot = false
  }

  // Auto-save draft to localStorage every 30s
  let _draftTimer: ReturnType<typeof setInterval> | null = null

  function startAutosave() {
    if (_draftTimer) return
    _draftTimer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(message))
    }, 30000)
  }

  function stopAutosave() {
    if (_draftTimer) { clearInterval(_draftTimer); _draftTimer = null }
  }

  function loadDraft(): boolean {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return false
      const state = JSON.parse(raw) as DiscordMessage
      if (!state || typeof state !== 'object') return false
      _applyState(state)
      return true
    } catch { return false }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
  }

  function saveDraftNow() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(message))
  }

  function addEmbed() {
    if (message.embeds.length >= 10) return
    snapshot()
    message.embeds.push(emptyEmbed())
  }

  function removeEmbed(i: number) {
    snapshot()
    message.embeds.splice(i, 1)
  }

  function reset() {
    snapshot()
    const fresh = emptyMessage()
    message.content = fresh.content
    message.username = fresh.username
    message.avatar_url = fresh.avatar_url
    message.tts = fresh.tts
    message.embeds = fresh.embeds
    delete message.thread_id
    clearDraft()
  }

  async function send(threadId?: string) {
    if (!selectedWebhookId.value) return
    sending.value = true
    lastError.value = null
    try {
      await api.post('/discord/send', {
        webhook_id: selectedWebhookId.value,
        payload: {
          content: message.content || undefined,
          username: message.username || undefined,
          avatar_url: message.avatar_url || undefined,
          tts: message.tts || undefined,
          embeds: message.embeds.length ? message.embeds : undefined,
        },
        thread_id: threadId || undefined,
      })
      clearDraft()
    } catch (e: any) {
      lastError.value = e.response?.data?.error ?? 'Send failed'
    } finally {
      sending.value = false
    }
  }

  function loadTemplate(payload: any) {
    snapshot()
    const fresh = emptyMessage()
    Object.assign(message, { ...fresh, ...payload })
    saveDraftNow()
  }

  return {
    message, selectedWebhookId, sending, lastError,
    undoStack, redoStack,
    addEmbed, removeEmbed, reset, send, loadTemplate,
    snapshot, undo, redo,
    loadDraft, clearDraft, saveDraftNow, startAutosave, stopAutosave,
  }
})
