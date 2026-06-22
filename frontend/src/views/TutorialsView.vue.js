/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
const ui = useUiStore();
const tutorials = ref([]);
onMounted(async () => {
    const { data } = await api.get('/tutorials');
    tutorials.value = data;
});
function fmtDate(d) {
    if (!d)
        return '';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function blockCount(t) {
    const n = Array.isArray(t.blocks) ? t.blocks.length : 0;
    return `${n} bloc${n > 1 ? 's' : ''}`;
}
async function remove(id) {
    await api.delete(`/tutorials/${id}`);
    tutorials.value = tutorials.value.filter(t => t.id !== id);
    ui.notify('Tutoriel supprimé');
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
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/tutorials/new",
    ...{ class: "btn-primary" },
}));
const __VLS_2 = __VLS_1({
    to: "/tutorials/new",
    ...{ class: "btn-primary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid-2" },
});
for (const [t] of __VLS_getVForSourceType((__VLS_ctx.tutorials))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (t.id),
        ...{ class: "card tutorial-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tut-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (['badge', t.published ? 'badge-success' : 'badge-info']) },
    });
    (t.published ? '🌐 Publié' : '📝 Brouillon');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tut-date" },
    });
    (__VLS_ctx.fmtDate(t.created_at ?? ''));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "tut-title" },
    });
    (t.title);
    if (t.description) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "tut-desc" },
        });
        (t.description);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tut-blocks" },
    });
    (__VLS_ctx.blockCount(t));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tut-actions" },
    });
    const __VLS_4 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        to: (`/tutorials/${t.id}`),
        ...{ class: "btn-primary" },
        ...{ style: {} },
    }));
    const __VLS_6 = __VLS_5({
        to: (`/tutorials/${t.id}`),
        ...{ class: "btn-primary" },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    var __VLS_7;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(t.id);
            } },
        ...{ class: "btn-danger-sm" },
    });
}
if (!__VLS_ctx.tutorials.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['tutorial-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tut-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tut-date']} */ ;
/** @type {__VLS_StyleScopedClasses['tut-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tut-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tut-blocks']} */ ;
/** @type {__VLS_StyleScopedClasses['tut-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            tutorials: tutorials,
            fmtDate: fmtDate,
            blockCount: blockCount,
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
