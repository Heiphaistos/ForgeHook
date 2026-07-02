import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'
import type { Webhook } from '../types/app'

export const useWebhooksStore = defineStore('webhooks', () => {
  const webhooks = ref<Webhook[]>([])

  async function load() {
    const { data } = await api.get('/webhooks')
    webhooks.value = data
  }

  async function create(w: Omit<Webhook, 'id'>) {
    await api.post('/webhooks', w)
    await load()
  }

  async function update(id: number, w: Omit<Webhook, 'id'>) {
    await api.put(`/webhooks/${id}`, w)
    await load()
  }

  async function remove(id: number) {
    await api.delete(`/webhooks/${id}`)
    webhooks.value = webhooks.value.filter(w => w.id !== id)
  }

  async function test(id: number): Promise<{ ok: boolean; error?: string }> {
    const { data } = await api.post(`/discord/test/${id}`)
    return data
  }

  // Vérifier la santé de tous les webhooks (monitoring), puis recharger les statuts.
  async function checkHealth(): Promise<{ total: number; ok: number; dead: number }> {
    const { data } = await api.post('/webhooks/check')
    await load()
    return data
  }

  return { webhooks, load, create, update, remove, test, checkHealth }
})
