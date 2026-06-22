import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useUiStore = defineStore('ui', () => {
    const theme = ref(localStorage.getItem('fh_theme') ?? 'dark');
    const sidebarOpen = ref(true);
    const notification = ref(null);
    function setTheme(t) {
        theme.value = t;
        localStorage.setItem('fh_theme', t);
    }
    function notify(msg, type = 'success') {
        notification.value = { msg, type };
        setTimeout(() => { notification.value = null; }, 3500);
    }
    return { theme, sidebarOpen, notification, setTheme, notify };
});
