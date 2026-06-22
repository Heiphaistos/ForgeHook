/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { exportJSON, exportMarkdown, exportText, exportHTML, exportCurl, downloadFile } from '../../utils/exportEmbed';
const props = defineProps();
const __VLS_emit = defineEmits();
const activeTab = ref('json');
const copied = ref(false);
const tabs = [
    { id: 'json', label: 'JSON', ext: 'json', mime: 'application/json' },
    { id: 'md', label: 'Markdown', ext: 'md', mime: 'text/markdown' },
    { id: 'html', label: 'HTML', ext: 'html', mime: 'text/html' },
    { id: 'txt', label: 'Texte', ext: 'txt', mime: 'text/plain' },
    { id: 'curl', label: 'cURL', ext: 'sh', mime: 'text/plain' },
];
const output = computed(() => {
    const msg = props.payload;
    switch (activeTab.value) {
        case 'json': return exportJSON(msg);
        case 'md': return exportMarkdown(msg);
        case 'html': return exportHTML(msg);
        case 'txt': return exportText(msg);
        case 'curl': return exportCurl(msg, props.webhookUrl ?? 'https://discord.com/api/webhooks/...');
        default: return '';
    }
});
async function copyToClipboard() {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
}
function download() {
    const tab = tabs.find(t => t.id === activeTab.value);
    downloadFile(output.value, `forgehook-embed.${tab.ext}`, tab.mime);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-area']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-dl']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "close-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tabs" },
    });
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.activeTab = t.id;
                } },
            key: (t.id),
            ...{ class: ({ active: __VLS_ctx.activeTab === t.id }) },
        });
        (t.label);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-area" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        readonly: true,
        value: (__VLS_ctx.output),
        spellcheck: "false",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.copyToClipboard) },
        ...{ class: "btn-copy" },
    });
    (__VLS_ctx.copied ? '✅ Copié !' : '📋 Copier');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.download) },
        ...{ class: "btn-dl" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "btn-cancel" },
    });
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-area']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-dl']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-cancel']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            activeTab: activeTab,
            copied: copied,
            tabs: tabs,
            output: output,
            copyToClipboard: copyToClipboard,
            download: download,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
