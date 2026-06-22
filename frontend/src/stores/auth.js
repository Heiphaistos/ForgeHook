import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api/client';
export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('fh_token'));
    const configured = ref(false);
    async function checkStatus() {
        const { data } = await api.get('/auth/status');
        configured.value = data.configured;
    }
    async function setup(password) {
        await api.post('/auth/setup', { password });
        configured.value = true;
    }
    async function login(password) {
        const { data } = await api.post('/auth/login', { password });
        token.value = data.token;
        localStorage.setItem('fh_token', data.token);
    }
    function logout() {
        token.value = null;
        localStorage.removeItem('fh_token');
    }
    return { token, configured, checkStatus, setup, login, logout };
});
