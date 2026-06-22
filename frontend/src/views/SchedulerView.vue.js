/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
const ui = useUiStore();
const jobs = ref([]);
const webhooks = ref([]);
const showForm = ref(false);
const editing = ref(null);
const formError = ref('');
const form = ref({ name: '', webhook_id: 0, cron_expr: '0 9 * * 1-5', payloadStr: '{"content":"Message planifié"}' });
const running = ref(null);
const cronPresets = [
    { label: 'Chaque minute', expr: '* * * * *' },
    { label: 'Toutes les heures', expr: '0 * * * *' },
    { label: 'Tous les jours 9h', expr: '0 9 * * *' },
    { label: 'Lun-Ven 9h', expr: '0 9 * * 1-5' },
    { label: 'Chaque lundi', expr: '0 9 * * 1' },
    { label: 'Chaque 1er du mois', expr: '0 9 1 * *' },
];
onMounted(async () => {
    const [j, w] = await Promise.all([api.get('/scheduler'), api.get('/webhooks')]);
    jobs.value = j.data;
    webhooks.value = w.data;
});
function webhookName(id) {
    return webhooks.value.find(w => w.id === id)?.name ?? `#${id}`;
}
function relTime(d) {
    if (!d)
        return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'il y a quelques secondes';
    if (mins < 60)
        return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
}
function describeCron(expr) {
    const map = {
        '* * * * *': 'Chaque minute',
        '0 * * * *': 'Toutes les heures',
        '0 9 * * *': 'Tous les jours à 9h',
        '0 9 * * 1-5': 'Lun–Ven à 9h',
        '0 9 * * 1': 'Chaque lundi à 9h',
        '0 9 1 * *': 'Le 1er du mois à 9h',
    };
    return map[expr] ?? '';
}
async function runNow(id) {
    running.value = id;
    try {
        await api.post(`/scheduler/${id}/run`);
        ui.notify('Job exécuté manuellement ✅');
        const { data } = await api.get('/scheduler');
        jobs.value = data;
    }
    catch (e) {
        ui.notify(e.response?.data?.error ?? "Erreur d'exécution", 'error');
    }
    finally {
        running.value = null;
    }
}
async function cloneJob(j) {
    try {
        let payload = {};
        if (j.payload) {
            try {
                payload = typeof j.payload === 'string' ? JSON.parse(j.payload) : j.payload;
            }
            catch { }
        }
        await api.post('/scheduler', {
            name: `${j.name} (copie)`,
            webhook_id: j.webhook_id,
            cron_expr: j.cron_expr,
            payload,
            enabled: false,
        });
        const { data } = await api.get('/scheduler');
        jobs.value = data;
        ui.notify('Job cloné — désactivé par défaut');
    }
    catch {
        ui.notify('Erreur lors du clonage', 'error');
    }
}
function openForm() {
    editing.value = null;
    form.value = { name: '', webhook_id: 0, cron_expr: '0 9 * * 1-5', payloadStr: '{"content":"Message planifié"}' };
    formError.value = '';
    showForm.value = true;
}
function openEdit(j) {
    editing.value = j;
    let payloadStr = '{"content":""}';
    try {
        payloadStr = JSON.stringify(typeof j.payload === 'string' ? JSON.parse(j.payload) : j.payload, null, 2);
    }
    catch { }
    form.value = { name: j.name, webhook_id: j.webhook_id, cron_expr: j.cron_expr, payloadStr };
    formError.value = '';
    showForm.value = true;
}
async function submit() {
    formError.value = '';
    if (!form.value.name || !form.value.webhook_id || !form.value.cron_expr) {
        formError.value = 'Tous les champs requis';
        return;
    }
    let payload;
    try {
        payload = JSON.parse(form.value.payloadStr);
    }
    catch {
        formError.value = 'JSON payload invalide';
        return;
    }
    try {
        if (editing.value) {
            await api.put(`/scheduler/${editing.value.id}`, { name: form.value.name, webhook_id: form.value.webhook_id, cron_expr: form.value.cron_expr, payload });
        }
        else {
            await api.post('/scheduler', { name: form.value.name, webhook_id: form.value.webhook_id, cron_expr: form.value.cron_expr, payload, enabled: true });
        }
        const { data } = await api.get('/scheduler');
        jobs.value = data;
        showForm.value = false;
        ui.notify(editing.value ? 'Job modifié !' : 'Job planifié créé !');
        editing.value = null;
    }
    catch (e) {
        formError.value = e.response?.data?.error ?? 'Erreur';
    }
}
async function toggle(j) {
    await api.patch(`/scheduler/${j.id}/toggle`);
    j.enabled = j.enabled ? 0 : 1;
    ui.notify(j.enabled ? 'Job activé' : 'Job mis en pause');
}
async function remove(id) {
    await api.delete(`/scheduler/${id}`);
    jobs.value = jobs.value.filter(j => j.id !== id);
    ui.notify('Job supprimé');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['job-cron']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openForm();
        } },
    ...{ class: "btn-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid-2" },
});
for (const [j] of __VLS_getVForSourceType((__VLS_ctx.jobs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (j.id),
        ...{ class: "card job-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "job-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (['badge', j.enabled ? 'badge-success' : 'badge-error']) },
    });
    (j.enabled ? '▶ Actif' : '⏸ Pausé');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "job-name" },
    });
    (j.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "job-cron" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
    (j.cron_expr);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "cron-desc" },
    });
    (__VLS_ctx.describeCron(j.cron_expr));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "job-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.webhookName(j.webhook_id));
    if (j.last_run) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.relTime(j.last_run));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "never-run" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "job-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggle(j);
            } },
        ...{ class: (j.enabled ? 'btn-secondary' : 'btn-primary') },
    });
    (j.enabled ? '⏸' : '▶');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.runNow(j.id);
            } },
        ...{ class: "btn-secondary" },
        disabled: (__VLS_ctx.running === j.id),
        title: "Tester maintenant",
    });
    (__VLS_ctx.running === j.id ? '⏳' : '⚡ Tester');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openEdit(j);
            } },
        ...{ class: "btn-secondary" },
        title: "Modifier",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cloneJob(j);
            } },
        ...{ class: "btn-secondary" },
        title: "Cloner",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(j.id);
            } },
        ...{ class: "btn-danger-sm" },
    });
}
if (!__VLS_ctx.jobs.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
if (__VLS_ctx.showForm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showForm))
                    return;
                __VLS_ctx.showForm = false;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.editing ? 'Modifier job' : 'Nouveau job planifié');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Ex: Rapport quotidien",
        ...{ class: "fh-input" },
        autofocus: true,
    });
    (__VLS_ctx.form.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.form.webhook_id),
        ...{ class: "fh-select w-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
        disabled: true,
    });
    for (const [w] of __VLS_getVForSourceType((__VLS_ctx.webhooks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (w.id),
            value: (w.id),
        });
        (w.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "0 9 * * 1-5",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.cron_expr);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "cron-presets" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.cronPresets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showForm))
                        return;
                    __VLS_ctx.form.cron_expr = p.expr;
                } },
            key: (p.expr),
            ...{ class: "btn-secondary preset-btn" },
        });
        (p.label);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.form.payloadStr),
        placeholder: '{"content":"Hello !","embeds":[...]}',
        ...{ class: "fh-textarea" },
        rows: "5",
    });
    if (__VLS_ctx.formError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "error" },
        });
        (__VLS_ctx.formError);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submit) },
        ...{ class: "btn-primary" },
    });
    (__VLS_ctx.editing ? 'Modifier' : 'Créer');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showForm))
                    return;
                __VLS_ctx.showForm = false;
            } },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['job-card']} */ ;
/** @type {__VLS_StyleScopedClasses['job-header']} */ ;
/** @type {__VLS_StyleScopedClasses['job-name']} */ ;
/** @type {__VLS_StyleScopedClasses['job-cron']} */ ;
/** @type {__VLS_StyleScopedClasses['cron-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['job-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['never-run']} */ ;
/** @type {__VLS_StyleScopedClasses['job-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['cron-presets']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['preset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            jobs: jobs,
            webhooks: webhooks,
            showForm: showForm,
            editing: editing,
            formError: formError,
            form: form,
            running: running,
            cronPresets: cronPresets,
            webhookName: webhookName,
            relTime: relTime,
            describeCron: describeCron,
            runNow: runNow,
            cloneJob: cloneJob,
            openForm: openForm,
            openEdit: openEdit,
            submit: submit,
            toggle: toggle,
            remove: remove,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
