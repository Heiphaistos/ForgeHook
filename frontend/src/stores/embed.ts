import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { DiscordMessage } from '../types/discord'
import { emptyMessage, emptyEmbed } from '../types/discord'
import api from '../api/client'

export const useEmbedStore = defineStore('embed', () => {
  const message = reactive<DiscordMessage>(emptyMessage())
  const selectedWebhookId = ref<number | null>(null)
  const sending = ref(false)
  const lastError = ref<string | null>(null)

  function addEmbed() {
    if (message.embeds.length >= 10) return
    message.embeds.push(emptyEmbed())
  }

  function removeEmbed(i: number) {
    message.embeds.splice(i, 1)
  }

  function reset() {
    const fresh = emptyMessage()
    message.content = fresh.content
    message.username = fresh.username
    message.avatar_url = fresh.avatar_url
    message.tts = fresh.tts
    message.embeds = fresh.embeds
    delete message.thread_id
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
    } catch (e: any) {
      lastError.value = e.response?.data?.error ?? 'Send failed'
    } finally {
      sending.value = false
    }
  }

  function loadTemplate(payload: any) {
    const fresh = emptyMessage()
    Object.assign(message, { ...fresh, ...payload })
  }

  return { message, selectedWebhookId, sending, lastError, addEmbed, removeEmbed, reset, send, loadTemplate }
})
