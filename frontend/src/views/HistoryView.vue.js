/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
import { useEmbedStore } from '../stores/embed';
import { useRouter } from 'vue-router';
const ui = useUiStore();
const embedStore = useEmbedStore();
const router = useRouter();
const history = ref([]);
const histStats = ref({ total: 0, success: 0, errors: 0, byDay: [], topWebhooks: [] });
const offset = ref(0);
const hasMore = ref(false);
const LIMIT = 50;
const searchQ = ref('');
const filterStatus = ref('');
const filterFrom = ref('');
const filterTo = ref('');
const selected = ref(new Set());
const payloadModal = ref(null);
let debounceTimer;
function debouncedLoad() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadHistory(), 300);
}
const csvUrl = computed(() => `${import.meta.env.VITE_API_URL ?? '/api'}/history/export.csv`);
onMounted(async () => {
    await Promise.all([loadStats(), loadHistory()]);
});
async function loadStats() {
    const { data } = await api.get('/history/stats');
    histStats.value = data;
}
async function loadHistory(reset = true) {
    if (reset) {
        offset.value = 0;
        history.value = [];
        selected.value = new Set();
    }
    const params = new URLSearchParams();
    params.set('limit', String(LIMIT + 1));
    params.set('offset', String(offset.value));
    if (searchQ.value)
        params.set('q', searchQ.value);
    if (filterStatus.value)
        params.set('status', filterStatus.value);
    if (filterFrom.value)
        params.set('from', filterFrom.value);
    if (filterTo.value)
        params.set('to', filterTo.value);
    const { data } = await api.get(`/history?${params}`);
    hasMore.value = data.length > LIMIT;
    history.value.push(...data.slice(0, LIMIT));
    offset.value += LIMIT;
}
async function loadMore() { await loadHistory(false); }
function resetFilters() {
    searchQ.value = '';
    filterStatus.value = '';
    filterFrom.value = '';
    filterTo.value = '';
    loadHistory();
}
function toggleSelect(id) {
    if (selected.value.has(id))
        selected.value.delete(id);
    else
        selected.value.add(id);
    selected.value = new Set(selected.value);
}
async function deleteSelected() {
    await api.delete('/history/bulk', { data: { ids: [...selected.value] } });
    history.value = history.value.filter(h => !selected.value.has(h.id));
    selected.value = new Set();
    await loadStats();
}
function previewPayload(payloadStr) {
    try {
        const p = JSON.parse(payloadStr);
        if (p.content)
            return p.content.slice(0, 80);
        if (p.embeds?.[0]?.title)
            return `[Embed] ${p.embeds[0].title}`;
        return 'Message Discord';
    }
    catch {
        return 'Payload invalide';
    }
}
function fmtDate(d) {
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function viewPayload(h) { payloadModal.value = h; }
function reuse(h) {
    try {
        embedStore.loadTemplate(JSON.parse(h.payload));
        router.push('/embed');
        ui.notify("Payload chargé dans l'éditeur");
    }
    catch {
        ui.notify('Impossible de charger ce payload', 'error');
    }
}
async function remove(id) {
    await api.delete(`/history/${id}`);
    history.value = history.value.filter(h => h.id !== id);
    histStats.value.total = Math.max(0, histStats.value.total - 1);
}
async function clearAll() {
    await api.delete('/history');
    history.value = [];
    await loadStats();
    ui.notify('Historique effacé');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['history-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon-sm']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: (__VLS_ctx.csvUrl),
    ...{ class: "btn-secondary" },
    download: "forgehook-history.csv",
});
if (__VLS_ctx.selected.size > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.deleteSelected) },
        ...{ class: "btn-danger" },
    });
    (__VLS_ctx.selected.size);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearAll) },
    ...{ class: "btn-danger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stats-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-pill success" },
});
(__VLS_ctx.histStats.success);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-pill error" },
});
(__VLS_ctx.histStats.errors);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-pill neutral" },
});
(__VLS_ctx.histStats.total);
if (__VLS_ctx.histStats.total > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stat-pill neutral" },
    });
    (Math.round(__VLS_ctx.histStats.success / __VLS_ctx.histStats.total * 100));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filters-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.debouncedLoad) },
    placeholder: "🔍 Rechercher...",
    ...{ class: "fh-input filter-search" },
});
(__VLS_ctx.searchQ);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.loadHistory();
        } },
    value: (__VLS_ctx.filterStatus),
    ...{ class: "fh-select filter-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "ok",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "error",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.loadHistory();
        } },
    type: "date",
    ...{ class: "fh-input filter-date" },
    title: "Depuis",
});
(__VLS_ctx.filterFrom);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.loadHistory();
        } },
    type: "date",
    ...{ class: "fh-input filter-date" },
    title: "Jusqu'au",
});
(__VLS_ctx.filterTo);
if (__VLS_ctx.searchQ || __VLS_ctx.filterStatus || __VLS_ctx.filterFrom || __VLS_ctx.filterTo) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.resetFilters) },
        ...{ class: "btn-secondary" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "history-list" },
});
for (const [h] of __VLS_getVForSourceType((__VLS_ctx.history))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (h.id),
        ...{ class: "history-item" },
        ...{ class: ({ selected: __VLS_ctx.selected.has(h.id) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.toggleSelect(h.id);
            } },
        type: "checkbox",
        checked: (__VLS_ctx.selected.has(h.id)),
        ...{ class: "hist-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (['badge', h.status < 300 ? 'badge-success' : 'badge-error']) },
    });
    (h.status);
    if (h.send_type === 'bot') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "badge badge-info" },
            ...{ style: {} },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-body" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-webhook" },
    });
    (h.webhook_name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-preview" },
    });
    (__VLS_ctx.previewPayload(h.payload));
    if (h.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "error" },
            ...{ style: {} },
        });
        (h.error);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-right" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-time" },
    });
    (__VLS_ctx.fmtDate(h.sent_at));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.viewPayload(h);
            } },
        ...{ class: "btn-icon-sm" },
        title: "Voir payload",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.reuse(h);
            } },
        ...{ class: "btn-icon-sm" },
        title: "Réutiliser",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(h.id);
            } },
        ...{ class: "btn-icon-sm danger" },
        title: "Supprimer",
    });
}
if (!__VLS_ctx.history.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    (__VLS_ctx.searchQ || __VLS_ctx.filterStatus ? 'Aucun résultat pour ce filtre.' : 'Aucun message envoyé pour l\'instant.');
}
if (__VLS_ctx.hasMore) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "load-more" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadMore) },
        ...{ class: "btn-secondary" },
    });
}
if (__VLS_ctx.payloadModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.payloadModal))
                    return;
                __VLS_ctx.payloadModal = null;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.payloadModal))
                    return;
                __VLS_ctx.payloadModal = null;
            } },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "json-block" },
        ...{ style: {} },
    });
    (JSON.stringify(JSON.parse(__VLS_ctx.payloadModal.payload), null, 2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.payloadModal))
                    return;
                __VLS_ctx.reuse(__VLS_ctx.payloadModal);
                __VLS_ctx.payloadModal = null;
            } },
        ...{ class: "btn-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.payloadModal))
                    return;
                __VLS_ctx.payloadModal = null;
            } },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['neutral']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['neutral']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-search']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-date']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-date']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['history-list']} */ ;
/** @type {__VLS_StyleScopedClasses['history-item']} */ ;
/** @type {__VLS_StyleScopedClasses['hist-check']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-info']} */ ;
/** @type {__VLS_StyleScopedClasses['history-body']} */ ;
/** @type {__VLS_StyleScopedClasses['history-webhook']} */ ;
/** @type {__VLS_StyleScopedClasses['history-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['history-right']} */ ;
/** @type {__VLS_StyleScopedClasses['history-time']} */ ;
/** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['json-block']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            history: history,
            histStats: histStats,
            hasMore: hasMore,
            searchQ: searchQ,
            filterStatus: filterStatus,
            filterFrom: filterFrom,
            filterTo: filterTo,
            selected: selected,
            payloadModal: payloadModal,
            debouncedLoad: debouncedLoad,
            csvUrl: csvUrl,
            loadHistory: loadHistory,
            loadMore: loadMore,
            resetFilters: resetFilters,
            toggleSelect: toggleSelect,
            deleteSelected: deleteSelected,
            previewPayload: previewPayload,
            fmtDate: fmtDate,
            viewPayload: viewPayload,
            reuse: reuse,
            remove: remove,
            clearAll: clearAll,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
