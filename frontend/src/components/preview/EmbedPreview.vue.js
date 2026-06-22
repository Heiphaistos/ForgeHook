/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
const props = defineProps();
const colorHex = computed(() => {
    if (!props.embed.color)
        return '#4f545c';
    return '#' + props.embed.color.toString(16).padStart(6, '0');
});
function renderMd(text) {
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
}
function fmtDate(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['embed-thumbnail']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-author']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-title']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-title']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-description']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-description']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-image']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "embed-wrapper" },
    ...{ style: ({ borderLeft: `4px solid ${__VLS_ctx.colorHex}` }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "embed-content" },
});
if (__VLS_ctx.embed.thumbnail?.url) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-thumbnail" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.embed.thumbnail.url),
        alt: "",
    });
}
if (__VLS_ctx.embed.author?.name) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-author" },
    });
    if (__VLS_ctx.embed.author.icon_url) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.embed.author.icon_url),
            ...{ class: "author-icon" },
            alt: "",
        });
    }
    if (__VLS_ctx.embed.author.url) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (__VLS_ctx.embed.author.url),
            target: "_blank",
            rel: "noopener",
        });
        (__VLS_ctx.embed.author.name);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.embed.author.name);
    }
}
if (__VLS_ctx.embed.title) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-title" },
    });
    if (__VLS_ctx.embed.url) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (__VLS_ctx.embed.url),
            target: "_blank",
            rel: "noopener",
        });
        (__VLS_ctx.embed.title);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.embed.title);
    }
}
if (__VLS_ctx.embed.description) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "embed-description" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMd(__VLS_ctx.embed.description)) }, null, null);
}
if (__VLS_ctx.embed.fields?.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-fields" },
    });
    for (const [field, i] of __VLS_getVForSourceType((__VLS_ctx.embed.fields))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: (['embed-field', field.inline ? 'inline' : '']) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "field-name" },
        });
        (field.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "field-value" },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMd(field.value)) }, null, null);
    }
}
if (__VLS_ctx.embed.image?.url) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-image" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.embed.image.url),
        alt: "",
    });
}
if (__VLS_ctx.embed.footer?.text || __VLS_ctx.embed.timestamp) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-footer" },
    });
    if (__VLS_ctx.embed.footer?.icon_url) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.embed.footer.icon_url),
            ...{ class: "footer-icon" },
            alt: "",
        });
    }
    if (__VLS_ctx.embed.footer?.text) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.embed.footer.text);
    }
    if (__VLS_ctx.embed.footer?.text && __VLS_ctx.embed.timestamp) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    if (__VLS_ctx.embed.timestamp) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.fmtDate(__VLS_ctx.embed.timestamp));
    }
}
/** @type {__VLS_StyleScopedClasses['embed-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-content']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-thumbnail']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-author']} */ ;
/** @type {__VLS_StyleScopedClasses['author-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-title']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-description']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['field-name']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-image']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-icon']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            colorHex: colorHex,
            renderMd: renderMd,
            fmtDate: fmtDate,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
