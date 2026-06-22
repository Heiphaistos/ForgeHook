const props = defineProps();
const emit = defineEmits();
function add() {
    if (props.fields.length >= 25)
        return;
    emit('update:fields', [...props.fields, { name: '', value: '', inline: false }]);
}
function remove(i) {
    const next = [...props.fields];
    next.splice(i, 1);
    emit('update:fields', next);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['inline-toggle']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fields-editor" },
});
for (const [field, i] of __VLS_getVForSourceType((__VLS_ctx.fields))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (i),
        ...{ class: "field-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "field-inputs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Nom du champ (ex: Prix)",
        ...{ class: "fh-input" },
    });
    (field.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (field.value),
        placeholder: "Valeur du champ — supporte **bold**, *italic*",
        ...{ class: "fh-textarea" },
        rows: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "inline-toggle" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (field.inline);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(i);
            } },
        ...{ class: "btn-danger-sm" },
        title: "Supprimer ce champ",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.add) },
    ...{ class: "btn-add" },
    disabled: (__VLS_ctx.fields.length >= 25),
});
(__VLS_ctx.fields.length > 0 ? `(${__VLS_ctx.fields.length}/25)` : '');
/** @type {__VLS_StyleScopedClasses['fields-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-inputs']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            add: add,
            remove: remove,
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
