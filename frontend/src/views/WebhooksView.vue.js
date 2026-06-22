/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useWebhooksStore } from '../stores/webhooks';
import { useEmbedStore } from '../stores/embed';
import { useUiStore } from '../stores/ui';
import { useRouter } from 'vue-router';
const store = useWebhooksStore();
const embedStore = useEmbedStore();
const ui = useUiStore();
const router = useRouter();
const showForm = ref(false);
const editing = ref(null);
const submitting = ref(false);
const formError = ref('');
const form = ref({ name: '', url: '', username: '', avatar_url: '', category: 'default' });
const grouped = computed(() => {
    return store.webhooks.reduce((acc, w) => {
        if (!acc[w.category])
            acc[w.category] = [];
        acc[w.category].push(w);
        return acc;
    }, {});
});
const existingCategories = computed(() => [...new Set(store.webhooks.map(w => w.category))]);
function successRate(w) {
    if (!w.send_count)
        return 0;
    return Math.round(((w.success_count ?? 0) / w.send_count) * 100);
}
function relTime(d) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)
        return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
}
onMounted(() => store.load());
function openForm(w) {
    editing.value = w ?? null;
    form.value = w
        ? { name: w.name, url: w.url, username: w.username ?? '', avatar_url: w.avatar_url ?? '', category: w.category }
        : { name: '', url: '', username: '', avatar_url: '', category: 'default' };
    formError.value = '';
    showForm.value = true;
}
function closeForm() {
    showForm.value = false;
    editing.value = null;
}
async function submit() {
    formError.value = '';
    if (!form.value.name || !form.value.url) {
        formError.value = 'Nom et URL requis';
        return;
    }
    submitting.value = true;
    try {
        if (editing.value) {
            await store.update(editing.value.id, form.value);
            ui.notify('Webhook modifié');
        }
        else {
            await store.create(form.value);
            ui.notify('Webhook ajouté !');
        }
        closeForm();
    }
    catch (e) {
        formError.value = e.response?.data?.error ?? 'Erreur';
    }
    finally {
        submitting.value = false;
    }
}
async function test(w) {
    const r = await store.test(w.id);
    ui.notify(r.ok ? `✅ ${w.name} — OK` : `❌ Test échoué: ${r.error}`, r.ok ? 'success' : 'error');
}
function useInBuilder(id) {
    embedStore.selectedWebhookId = id;
    router.push('/embed');
}
async function remove(w) {
    await store.remove(w.id);
    ui.notify(`Webhook "${w.name}" supprimé`);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
if (!__VLS_ctx.store.webhooks.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
for (const [group, cat] of __VLS_getVForSourceType((__VLS_ctx.grouped))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (cat),
        ...{ class: "category-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "category-label" },
    });
    (cat);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid-2" },
    });
    for (const [w] of __VLS_getVForSourceType((group))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (w.id),
            ...{ class: "card webhook-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wh-header" },
        });
        if (w.avatar_url) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                ...{ onError: (...[$event]) => {
                        if (!(w.avatar_url))
                            return;
                        $event.target.style.display = 'none';
                    } },
                src: (w.avatar_url),
                ...{ class: "wh-avatar" },
                alt: "",
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "wh-avatar-placeholder" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wh-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wh-name" },
        });
        (w.name);
        if (w.username) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "wh-username" },
            });
            (w.username);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wh-url" },
            title: (w.url),
        });
        (w.url.slice(0, 55));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wh-stats-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "stat-chip" },
        });
        (w.send_count ?? 0);
        if (w.last_sent) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "stat-chip" },
            });
            (__VLS_ctx.relTime(w.last_sent));
        }
        if (w.send_count > 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['stat-chip', __VLS_ctx.successRate(w) >= 90 ? 'chip-ok' : __VLS_ctx.successRate(w) >= 70 ? 'chip-warn' : 'chip-err']) },
            });
            (__VLS_ctx.successRate(w));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "wh-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.test(w);
                } },
            ...{ class: "btn-secondary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.useInBuilder(w.id);
                } },
            ...{ class: "btn-primary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.openForm(w);
                } },
            ...{ class: "btn-secondary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.remove(w);
                } },
            ...{ class: "btn-danger-sm" },
        });
    }
}
if (__VLS_ctx.showForm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeForm) },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.editing ? 'Modifier webhook' : 'Ajouter un webhook');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Ex: #général, Alertes prod",
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "https://discord.com/api/webhooks/...",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.url);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Nom affiché (laisser vide = défaut)",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.username);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "https://... (laisser vide = défaut)",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.avatar_url);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "default",
        ...{ class: "fh-input" },
        list: "categories",
    });
    (__VLS_ctx.form.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.datalist, __VLS_intrinsicElements.datalist)({
        id: "categories",
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.existingCategories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
            key: (c),
            value: (c),
        });
    }
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
        disabled: (__VLS_ctx.submitting),
    });
    (__VLS_ctx.submitting ? 'Sauvegarde...' : (__VLS_ctx.editing ? 'Modifier' : 'Ajouter'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeForm) },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['category-group']} */ ;
/** @type {__VLS_StyleScopedClasses['category-label']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['webhook-card']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-header']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-avatar-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-info']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-name']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-username']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-url']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-stats-row']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['wh-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            store: store,
            showForm: showForm,
            editing: editing,
            submitting: submitting,
            formError: formError,
            form: form,
            grouped: grouped,
            existingCategories: existingCategories,
            successRate: successRate,
            relTime: relTime,
            openForm: openForm,
            closeForm: closeForm,
            submit: submit,
            test: test,
            useInBuilder: useInBuilder,
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
