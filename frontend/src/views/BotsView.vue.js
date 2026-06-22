/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
import BotChannelPicker from '../components/bots/BotChannelPicker.vue';
const ui = useUiStore();
const bots = ref([]);
const botInfo = ref({});
const showForm = ref(false);
const editing = ref(null);
const formError = ref('');
const form = ref({ name: '', token: '', channel_id: '' });
const sendTarget = ref(null);
const sendForm = ref({ content: '' });
const sendChannelId = ref('');
const sendLoading = ref(false);
const sendError = ref('');
const sendOk = ref(false);
const showGuilds = ref(null);
const quickSendTarget = ref(null);
const quickSendContent = ref('');
const quickSendLoading = ref(false);
const quickSendOk = ref(false);
onMounted(async () => {
    const { data } = await api.get('/bots');
    bots.value = data;
});
function toggleGuilds(id) {
    showGuilds.value = showGuilds.value === id ? null : id;
    quickSendTarget.value = null;
    quickSendContent.value = '';
    quickSendOk.value = false;
}
function onChannelSelect(sel, _b) {
    quickSendTarget.value = sel;
    quickSendOk.value = false;
}
function onSendChannelSelect(sel) {
    sendChannelId.value = sel?.channelId ?? '';
}
async function quickSend(b) {
    if (!quickSendTarget.value)
        return;
    quickSendLoading.value = true;
    try {
        await api.post('/bots/send', {
            bot_id: b.id,
            channel_id: quickSendTarget.value.channelId,
            payload: { content: quickSendContent.value },
        });
        quickSendOk.value = true;
        quickSendContent.value = '';
        ui.notify(`Message envoyé dans #${quickSendTarget.value.channelName} !`);
    }
    catch (e) {
        ui.notify(e?.response?.data?.error ?? "Erreur d'envoi", 'error');
    }
    finally {
        quickSendLoading.value = false;
    }
}
function openForm(b) {
    editing.value = b ?? null;
    form.value = b ? { name: b.name, token: '', channel_id: b.channel_id ?? '' } : { name: '', token: '', channel_id: '' };
    formError.value = '';
    showForm.value = true;
}
async function submit() {
    formError.value = '';
    if (!form.value.name || (!form.value.token && !editing.value)) {
        formError.value = 'Nom et token requis';
        return;
    }
    try {
        if (editing.value)
            await api.put(`/bots/${editing.value.id}`, form.value);
        else
            await api.post('/bots', form.value);
        const { data } = await api.get('/bots');
        bots.value = data;
        showForm.value = false;
        ui.notify(editing.value ? 'Bot modifié' : 'Bot ajouté');
    }
    catch (e) {
        formError.value = e.response?.data?.error ?? 'Erreur';
    }
}
async function remove(id) {
    await api.delete(`/bots/${id}`);
    bots.value = bots.value.filter(b => b.id !== id);
    ui.notify('Bot supprimé');
}
async function fetchInfo(id) {
    try {
        const { data } = await api.get(`/bots/${id}/info`);
        botInfo.value = { ...botInfo.value, [id]: data };
        ui.notify(`Bot "${data.username}" vérifié ✅`);
    }
    catch {
        ui.notify('Token invalide ou erreur Discord', 'error');
    }
}
function openSend(b) {
    sendTarget.value = b;
    sendForm.value = { content: '' };
    sendChannelId.value = '';
    sendError.value = '';
    sendOk.value = false;
}
async function sendBot() {
    sendError.value = '';
    sendOk.value = false;
    if (!sendChannelId.value) {
        sendError.value = 'Sélectionnez un channel';
        return;
    }
    sendLoading.value = true;
    try {
        await api.post('/bots/send', {
            bot_id: sendTarget.value.id,
            channel_id: sendChannelId.value,
            payload: { content: sendForm.value.content },
        });
        sendOk.value = true;
        ui.notify('Message envoyé via bot !');
    }
    catch (e) {
        sendError.value = e.response?.data?.error ?? "Erreur d'envoi";
    }
    finally {
        sendLoading.value = false;
    }
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid-2" },
});
for (const [b] of __VLS_getVForSourceType((__VLS_ctx.bots))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (b.id),
        ...{ class: "card bot-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-avatar-wrap" },
    });
    if (__VLS_ctx.botInfo[b.id]?.avatar) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (`https://cdn.discordapp.com/avatars/${__VLS_ctx.botInfo[b.id].id}/${__VLS_ctx.botInfo[b.id].avatar}.png`),
            ...{ class: "bot-avatar" },
            alt: "",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bot-avatar-ph" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-name" },
    });
    (b.name);
    if (__VLS_ctx.botInfo[b.id]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bot-discord-name" },
        });
        (__VLS_ctx.botInfo[b.id].username);
    }
    if (__VLS_ctx.botInfo[b.id]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bot-id" },
        });
        (__VLS_ctx.botInfo[b.id].id);
    }
    if (!__VLS_ctx.botInfo[b.id]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bot-status" },
            ...{ style: {} },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-badge-wrap" },
    });
    if (__VLS_ctx.botInfo[b.id]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "badge badge-success" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.fetchInfo(b.id);
            } },
        ...{ class: "btn-secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openSend(b);
            } },
        ...{ class: "btn-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggleGuilds(b.id);
            } },
        ...{ class: "btn-secondary" },
    });
    (__VLS_ctx.showGuilds === b.id ? '📁 Masquer' : '📁 Serveurs');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openForm(b);
            } },
        ...{ class: "btn-secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.remove(b.id);
            } },
        ...{ class: "btn-danger-sm" },
    });
    if (__VLS_ctx.showGuilds === b.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "guild-browser" },
        });
        /** @type {[typeof BotChannelPicker, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(BotChannelPicker, new BotChannelPicker({
            ...{ 'onSelect': {} },
            botId: (b.id),
        }));
        const __VLS_1 = __VLS_0({
            ...{ 'onSelect': {} },
            botId: (b.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        let __VLS_3;
        let __VLS_4;
        let __VLS_5;
        const __VLS_6 = {
            onSelect: (...[$event]) => {
                if (!(__VLS_ctx.showGuilds === b.id))
                    return;
                __VLS_ctx.onChannelSelect($event, b);
            }
        };
        var __VLS_2;
        if (__VLS_ctx.quickSendTarget) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "quick-send" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "quick-send-info" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.quickSendTarget.channelName);
            (__VLS_ctx.quickSendTarget.guildName);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.quickSendContent),
                placeholder: "Message rapide...",
                ...{ class: "fh-textarea" },
                rows: "2",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showGuilds === b.id))
                            return;
                        if (!(__VLS_ctx.quickSendTarget))
                            return;
                        __VLS_ctx.quickSend(b);
                    } },
                ...{ class: "btn-primary" },
                disabled: (__VLS_ctx.quickSendLoading),
            });
            (__VLS_ctx.quickSendLoading ? '⏳...' : '🚀 Envoyer');
            if (__VLS_ctx.quickSendOk) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "success" },
                    ...{ style: {} },
                });
            }
        }
    }
}
if (!__VLS_ctx.bots.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.br, __VLS_intrinsicElements.br)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://discord.com/developers/applications",
        target: "_blank",
        rel: "noopener",
        ...{ style: {} },
    });
}
if (__VLS_ctx.showForm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showForm))
                    return;
                __VLS_ctx.showForm = false;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.editing ? 'Modifier bot' : 'Ajouter un bot');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Mon Bot",
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
        type: "password",
        placeholder: "Bot token (commence par MTx...)",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.token);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://discord.com/developers/applications",
        target: "_blank",
        rel: "noopener",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "ID du salon",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.channel_id);
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
    });
    (__VLS_ctx.editing ? 'Modifier' : 'Ajouter');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showForm))
                    return;
                __VLS_ctx.showForm = false;
            } },
        ...{ class: "btn-secondary" },
    });
}
if (__VLS_ctx.sendTarget) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.sendTarget))
                    return;
                __VLS_ctx.sendTarget = null;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.sendTarget.name);
    /** @type {[typeof BotChannelPicker, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(BotChannelPicker, new BotChannelPicker({
        ...{ 'onSelect': {} },
        botId: (__VLS_ctx.sendTarget.id),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onSelect': {} },
        botId: (__VLS_ctx.sendTarget.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_10;
    let __VLS_11;
    let __VLS_12;
    const __VLS_13 = {
        onSelect: (__VLS_ctx.onSendChannelSelect)
    };
    var __VLS_9;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.sendForm.content),
        placeholder: "Message texte...",
        ...{ class: "fh-textarea" },
        rows: "3",
    });
    if (__VLS_ctx.sendError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "error" },
        });
        (__VLS_ctx.sendError);
    }
    if (__VLS_ctx.sendOk) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "success" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.sendBot) },
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.sendLoading || !__VLS_ctx.sendChannelId),
    });
    (__VLS_ctx.sendLoading ? 'Envoi...' : '🚀 Envoyer');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.sendTarget))
                    return;
                __VLS_ctx.sendTarget = null;
            } },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-card']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-header']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-avatar-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-avatar-ph']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-info']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-name']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-discord-name']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-id']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-status']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-badge-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-success']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['guild-browser']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-send']} */ ;
/** @type {__VLS_StyleScopedClasses['quick-send-info']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
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
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BotChannelPicker: BotChannelPicker,
            bots: bots,
            botInfo: botInfo,
            showForm: showForm,
            editing: editing,
            formError: formError,
            form: form,
            sendTarget: sendTarget,
            sendForm: sendForm,
            sendChannelId: sendChannelId,
            sendLoading: sendLoading,
            sendError: sendError,
            sendOk: sendOk,
            showGuilds: showGuilds,
            quickSendTarget: quickSendTarget,
            quickSendContent: quickSendContent,
            quickSendLoading: quickSendLoading,
            quickSendOk: quickSendOk,
            toggleGuilds: toggleGuilds,
            onChannelSelect: onChannelSelect,
            onSendChannelSelect: onSendChannelSelect,
            quickSend: quickSend,
            openForm: openForm,
            submit: submit,
            remove: remove,
            fetchInfo: fetchInfo,
            openSend: openSend,
            sendBot: sendBot,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
