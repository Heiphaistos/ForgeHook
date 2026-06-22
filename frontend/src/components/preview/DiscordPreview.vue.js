/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
import EmbedPreview from './EmbedPreview.vue';
const props = defineProps();
const DEFAULT_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png';
const avatarSrc = computed(() => props.message.avatar_url || DEFAULT_AVATAR);
const displayName = computed(() => props.message.username || 'ForgeHook');
const timeNow = computed(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
const visibleEmbeds = computed(() => (props.message.embeds ?? []).filter(e => e.title || e.description || e.fields?.length || e.image?.url));
function renderMd(text) {
    return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['message-text']} */ ;
/** @type {__VLS_StyleScopedClasses['message-text']} */ ;
/** @type {__VLS_StyleScopedClasses['message-text']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "discord-preview" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "channel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "channel-hash" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "channel-name" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "messages-area" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ class: "avatar" },
    src: (__VLS_ctx.avatarSrc),
    alt: "",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "username" },
});
(__VLS_ctx.displayName);
if (__VLS_ctx.showBotTag) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "bot-tag" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "timestamp" },
});
(__VLS_ctx.timeNow);
if (__VLS_ctx.message.content) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "message-text" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMd(__VLS_ctx.message.content)) }, null, null);
}
for (const [embed, i] of __VLS_getVForSourceType((__VLS_ctx.visibleEmbeds))) {
    /** @type {[typeof EmbedPreview, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(EmbedPreview, new EmbedPreview({
        key: (i),
        embed: (embed),
    }));
    const __VLS_1 = __VLS_0({
        key: (i),
        embed: (embed),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
if (!__VLS_ctx.message.content && !__VLS_ctx.visibleEmbeds.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-hint" },
    });
}
/** @type {__VLS_StyleScopedClasses['discord-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-hash']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-name']} */ ;
/** @type {__VLS_StyleScopedClasses['messages-area']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['message-body']} */ ;
/** @type {__VLS_StyleScopedClasses['message-header']} */ ;
/** @type {__VLS_StyleScopedClasses['username']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['timestamp']} */ ;
/** @type {__VLS_StyleScopedClasses['message-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            EmbedPreview: EmbedPreview,
            avatarSrc: avatarSrc,
            displayName: displayName,
            timeNow: timeNow,
            visibleEmbeds: visibleEmbeds,
            renderMd: renderMd,
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
