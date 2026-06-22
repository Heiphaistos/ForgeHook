import { ref, computed } from 'vue';
import { FONT_LIST, CATEGORIES, convertFont } from '../../utils/discordFonts';
const __VLS_props = defineProps();
const emit = defineEmits();
const fontsInput = ref('');
const fontsTargetField = ref('description');
const fontsCat = ref('Tous');
const fontsCopied = ref('');
const fontsToast = ref('');
const filteredFonts = computed(() => fontsCat.value === 'Tous' ? FONT_LIST : FONT_LIST.filter(f => f.category === fontsCat.value));
function copyFont(font) {
    if (!fontsInput.value)
        return;
    navigator.clipboard.writeText(convertFont(fontsInput.value, font));
    fontsCopied.value = font.name;
    fontsToast.value = '✅ Copié !';
    setTimeout(() => { fontsCopied.value = ''; fontsToast.value = ''; }, 2000);
}
function injectFont(font) {
    if (!fontsInput.value)
        return;
    emit('inject', convertFont(fontsInput.value, font), fontsTargetField.value);
    emit('update:modelValue', false);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['fonts-modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['font-cat-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['font-cat-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mini-card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mini-card']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal fonts-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fonts-modal-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "close-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fonts-modal-controls" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fonts-input-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.fontsInput),
        placeholder: "Texte à convertir...",
        ...{ class: "fh-textarea" },
        rows: "2",
        ...{ style: {} },
        autofocus: true,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fonts-target-col" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.fontsTargetField),
        ...{ class: "fh-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "description",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "title",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "content",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "footer",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "author",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fonts-cats" },
    });
    for (const [cat] of __VLS_getVForSourceType((['Tous', ...__VLS_ctx.CATEGORIES]))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.fontsCat = cat;
                } },
            key: (cat),
            ...{ class: (['font-cat-btn', __VLS_ctx.fontsCat === cat ? 'active' : '']) },
        });
        (cat);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fonts-modal-grid" },
    });
    for (const [font] of __VLS_getVForSourceType((__VLS_ctx.filteredFonts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (font.name),
            ...{ class: "font-mini-card" },
            ...{ class: ({ copied: __VLS_ctx.fontsCopied === font.name }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "font-mini-preview" },
        });
        (__VLS_ctx.fontsInput ? __VLS_ctx.convertFont(__VLS_ctx.fontsInput, font) : font.desc);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "font-mini-name" },
        });
        (font.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "font-mini-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.copyFont(font);
                } },
            ...{ class: "btn-icon" },
            title: "Copier",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.injectFont(font);
                } },
            ...{ class: "btn-icon inject" },
            title: "Insérer dans l'embed",
        });
    }
    if (__VLS_ctx.fontsToast) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "fonts-toast" },
        });
        (__VLS_ctx.fontsToast);
    }
}
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-modal-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-input-row']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-target-col']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-cats']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-modal-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mini-card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mini-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mini-name']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mini-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['inject']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-toast']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CATEGORIES: CATEGORIES,
            convertFont: convertFont,
            fontsInput: fontsInput,
            fontsTargetField: fontsTargetField,
            fontsCat: fontsCat,
            fontsCopied: fontsCopied,
            fontsToast: fontsToast,
            filteredFonts: filteredFonts,
            copyFont: copyFont,
            injectFont: injectFont,
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
