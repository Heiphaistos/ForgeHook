/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import EmbedColorPicker from './EmbedColorPicker.vue';
import EmbedFieldEditor from './EmbedFieldEditor.vue';
const embed = defineModel({ required: true });
const authorName = computed({
    get: () => embed.value.author?.name ?? '',
    set: (v) => { if (!embed.value.author)
        embed.value.author = { name: '', url: '', icon_url: '' }; embed.value.author.name = v; }
});
const authorUrl = computed({
    get: () => embed.value.author?.url ?? '',
    set: (v) => { if (!embed.value.author)
        embed.value.author = { name: '', url: '', icon_url: '' }; embed.value.author.url = v; }
});
const authorIcon = computed({
    get: () => embed.value.author?.icon_url ?? '',
    set: (v) => { if (!embed.value.author)
        embed.value.author = { name: '', url: '', icon_url: '' }; embed.value.author.icon_url = v; }
});
const footerText = computed({
    get: () => embed.value.footer?.text ?? '',
    set: (v) => { if (!embed.value.footer)
        embed.value.footer = { text: '', icon_url: '' }; embed.value.footer.text = v; }
});
const footerIcon = computed({
    get: () => embed.value.footer?.icon_url ?? '',
    set: (v) => { if (!embed.value.footer)
        embed.value.footer = { text: '', icon_url: '' }; embed.value.footer.icon_url = v; }
});
const thumbnailUrl = computed({
    get: () => embed.value.thumbnail?.url ?? '',
    set: (v) => { embed.value.thumbnail = { url: v }; }
});
const imageUrl = computed({
    get: () => embed.value.image?.url ?? '',
    set: (v) => { embed.value.image = { url: v }; }
});
const timestampLocal = ref(embed.value.timestamp ? toLocalInput(embed.value.timestamp) : '');
function toLocalInput(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function onTimestampChange() {
    if (timestampLocal.value)
        embed.value.timestamp = new Date(timestampLocal.value).toISOString();
    else
        embed.value.timestamp = '';
}
function setNow() {
    embed.value.timestamp = new Date().toISOString();
    timestampLocal.value = toLocalInput(embed.value.timestamp);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_defaults = {};
const __VLS_modelEmit = defineEmits();
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['char-count']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "embed-builder" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
/** @type {[typeof EmbedColorPicker, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(EmbedColorPicker, new EmbedColorPicker({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.embed.color ?? null),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.embed.color ?? null),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    'onUpdate:modelValue': (...[$event]) => {
        __VLS_ctx.embed.color = $event;
    }
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Nom de l'auteur",
    ...{ class: "fh-input" },
});
(__VLS_ctx.authorName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Lien auteur (https://...)",
    ...{ class: "fh-input mt-1" },
});
(__VLS_ctx.authorUrl);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "URL icône auteur",
    ...{ class: "fh-input mt-1" },
});
(__VLS_ctx.authorIcon);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Titre de l'embed",
    ...{ class: "fh-input" },
});
(__VLS_ctx.embed.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "URL du titre (optionnel)",
    ...{ class: "fh-input mt-1" },
});
(__VLS_ctx.embed.url);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.embed.description),
    placeholder: "Description — **gras**, *italique*, `code`, [lien](url), ~~barré~~",
    ...{ class: "fh-textarea" },
    rows: "5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "char-count" },
    ...{ class: ({ warn: (__VLS_ctx.embed.description?.length ?? 0) > 3800 }) },
});
(__VLS_ctx.embed.description?.length ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "half" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "https://...",
    ...{ class: "fh-input" },
});
(__VLS_ctx.thumbnailUrl);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "half" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "https://...",
    ...{ class: "fh-input" },
});
(__VLS_ctx.imageUrl);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
/** @type {[typeof EmbedFieldEditor, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(EmbedFieldEditor, new EmbedFieldEditor({
    ...{ 'onUpdate:fields': {} },
    fields: (__VLS_ctx.embed.fields ?? []),
}));
const __VLS_8 = __VLS_7({
    ...{ 'onUpdate:fields': {} },
    fields: (__VLS_ctx.embed.fields ?? []),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_10;
let __VLS_11;
let __VLS_12;
const __VLS_13 = {
    'onUpdate:fields': (...[$event]) => {
        __VLS_ctx.embed.fields = $event;
    }
};
var __VLS_9;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "half" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Texte du footer",
    ...{ class: "fh-input" },
});
(__VLS_ctx.footerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "URL icône footer",
    ...{ class: "fh-input mt-1" },
});
(__VLS_ctx.footerIcon);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "half" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.onTimestampChange) },
    type: "datetime-local",
    ...{ class: "fh-input" },
});
(__VLS_ctx.timestampLocal);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.setNow) },
    ...{ class: "btn-secondary mt-1" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['embed-builder']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['char-count']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['half']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['half']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['half']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['half']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            EmbedColorPicker: EmbedColorPicker,
            EmbedFieldEditor: EmbedFieldEditor,
            embed: embed,
            authorName: authorName,
            authorUrl: authorUrl,
            authorIcon: authorIcon,
            footerText: footerText,
            footerIcon: footerIcon,
            thumbnailUrl: thumbnailUrl,
            imageUrl: imageUrl,
            timestampLocal: timestampLocal,
            onTimestampChange: onTimestampChange,
            setNow: setNow,
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
