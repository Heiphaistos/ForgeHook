import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api/client';
export const useWebhooksStore = defineStore('webhooks', () => {
    const webhooks = ref([]);
    async function load() {
        const { data } = await api.get('/webhooks');
        webhooks.value = data;
    }
    async function create(w) {
        await api.post('/webhooks', w);
        await load();
    }
    async function update(id, w) {
        await api.put(`/webhooks/${id}`, w);
        await load();
    }
    async function remove(id) {
        await api.delete(`/webhooks/${id}`);
        webhooks.value = webhooks.value.filter(w => w.id !== id);
    }
    async function test(id) {
        const { data } = await api.post(`/discord/test/${id}`);
        return data;
    }
    return { webhooks, load, create, update, remove, test };
});
