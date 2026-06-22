import { ref, computed, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
const props = defineProps();
const emit = defineEmits();
const open = ref(false);
const pickerRef = ref();
onClickOutside(pickerRef, () => { open.value = false; });
const DISCORD_COLORS = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e91e63',
    '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#607d8b',
    '#11806a', '#1f8b4c', '#206694', '#71368a', '#ad1457',
    '#c27c0e', '#a84300', '#992d22', '#979c9f', '#546e7a',
    '#5865f2', '#eb459e', '#fee75c', '#57f287', '#ed4245',
    '#ffffff', '#99aab5', '#2f3136', '#202225', '#000000',
];
const hexColor = computed(() => {
    if (props.modelValue == null)
        return '#4f545c';
    return '#' + props.modelValue.toString(16).padStart(6, '0');
});
const hexInput = ref(hexColor.value);
watch(() => props.modelValue, (v) => {
    hexInput.value = v == null ? '' : '#' + v.toString(16).padStart(6, '0');
});
function onHexInput() {
    const raw = hexInput.value.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(raw)) {
        emit('update:modelValue', parseInt(raw, 16));
    }
}
function selectColor(c) {
    hexInput.value = c;
    emit('update:modelValue', parseInt(c.slice(1), 16));
    open.value = false;
}
function clear() {
    hexInput.value = '';
    emit('update:modelValue', null);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['color-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['swatch']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-picker" },
    ref: "pickerRef",
});
/** @type {typeof __VLS_ctx.pickerRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.open = !__VLS_ctx.open;
        } },
    ...{ class: "color-preview" },
    ...{ style: ({ background: __VLS_ctx.hexColor }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onHexInput) },
    placeholder: "#5865F2",
    ...{ class: "hex-input" },
    maxlength: "7",
});
(__VLS_ctx.hexInput);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clear) },
    ...{ class: "clear-btn" },
    title: "Reset color",
});
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "palette" },
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.DISCORD_COLORS))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.selectColor(c);
                } },
            key: (c),
            ...{ class: "swatch" },
            ...{ style: ({ background: c }) },
            title: (c),
        });
    }
}
/** @type {__VLS_StyleScopedClasses['color-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['color-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['hex-input']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['palette']} */ ;
/** @type {__VLS_StyleScopedClasses['swatch']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            open: open,
            pickerRef: pickerRef,
            DISCORD_COLORS: DISCORD_COLORS,
            hexColor: hexColor,
            hexInput: hexInput,
            onHexInput: onHexInput,
            selectColor: selectColor,
            clear: clear,
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
