import { ref, watch } from 'vue';
import api from '../../api/client';
const props = defineProps();
const emit = defineEmits();
const guilds = ref([]);
const channels = ref([]);
const selectedGuildId = ref('');
const selectedChannelId = ref('');
const selectedGuildName = ref('');
const selectedChannelName = ref('');
const loadingGuilds = ref(false);
const loadingChannels = ref(false);
const guildError = ref('');
watch(() => props.botId, async (id) => {
    guilds.value = [];
    channels.value = [];
    selectedGuildId.value = '';
    selectedChannelId.value = '';
    guildError.value = '';
    if (!id)
        return;
    loadingGuilds.value = true;
    try {
        const { data } = await api.get(`/bots/${id}/guilds`);
        guilds.value = data;
    }
    catch {
        guildError.value = 'Token invalide ou bot non présent dans un serveur';
    }
    finally {
        loadingGuilds.value = false;
    }
}, { immediate: true });
async function onGuildChange() {
    channels.value = [];
    selectedChannelId.value = '';
    emit('select', null);
    if (!selectedGuildId.value || !props.botId)
        return;
    selectedGuildName.value = guilds.value.find(g => g.id === selectedGuildId.value)?.name ?? '';
    loadingChannels.value = true;
    try {
        const { data } = await api.get(`/bots/${props.botId}/guilds/${selectedGuildId.value}/channels`);
        channels.value = data;
    }
    finally {
        loadingChannels.value = false;
    }
}
function onChannelChange() {
    const ch = channels.value.find(c => c.id === selectedChannelId.value);
    selectedChannelName.value = ch?.name ?? '';
    if (selectedChannelId.value) {
        emit('select', {
            guildId: selectedGuildId.value,
            channelId: selectedChannelId.value,
            channelName: selectedChannelName.value,
            guildName: selectedGuildName.value,
        });
    }
    else {
        emit('select', null);
    }
}
function channelPrefix(type) {
    if (type === 5)
        return '📢';
    if (type === 15)
        return '🗂️';
    return '#';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['picker-group']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-select']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "picker" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "picker-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "picker-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
if (__VLS_ctx.loadingGuilds) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-text" },
    });
}
else if (__VLS_ctx.guildError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-text" },
    });
    (__VLS_ctx.guildError);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.onGuildChange) },
        value: (__VLS_ctx.selectedGuildId),
        ...{ class: "picker-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [g] of __VLS_getVForSourceType((__VLS_ctx.guilds))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (g.id),
            value: (g.id),
        });
        (g.name);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "picker-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
if (__VLS_ctx.loadingChannels) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-text" },
    });
}
else if (!__VLS_ctx.selectedGuildId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint-text" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.onChannelChange) },
        value: (__VLS_ctx.selectedChannelId),
        ...{ class: "picker-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [ch] of __VLS_getVForSourceType((__VLS_ctx.channels))) {
        (ch.id);
        if (ch.type === 4) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.optgroup, __VLS_intrinsicElements.optgroup)({
                label: ('📁 ' + ch.name),
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: (ch.id),
            });
            (__VLS_ctx.channelPrefix(ch.type));
            (ch.name);
        }
    }
}
if (__VLS_ctx.selectedChannelId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selected-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.selectedChannelName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.selectedGuildName);
}
/** @type {__VLS_StyleScopedClasses['picker']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-row']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-group']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-text']} */ ;
/** @type {__VLS_StyleScopedClasses['error-text']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-select']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-group']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-text']} */ ;
/** @type {__VLS_StyleScopedClasses['hint-text']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-select']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-info']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            guilds: guilds,
            channels: channels,
            selectedGuildId: selectedGuildId,
            selectedChannelId: selectedChannelId,
            selectedGuildName: selectedGuildName,
            selectedChannelName: selectedChannelName,
            loadingGuilds: loadingGuilds,
            loadingChannels: loadingChannels,
            guildError: guildError,
            onGuildChange: onGuildChange,
            onChannelChange: onChannelChange,
            channelPrefix: channelPrefix,
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
