/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import EmbedBuilder from '../components/embed/EmbedBuilder.vue';
import DiscordPreview from '../components/preview/DiscordPreview.vue';
import EmbedTemplatesModal from '../components/modals/EmbedTemplatesModal.vue';
import EmbedFontsModal from '../components/modals/EmbedFontsModal.vue';
import ExportModal from '../components/modals/ExportModal.vue';
import BotChannelPicker from '../components/bots/BotChannelPicker.vue';
import { useEmbedStore } from '../stores/embed';
import { useWebhooksStore } from '../stores/webhooks';
import { useUiStore } from '../stores/ui';
import api from '../api/client';
const router = useRouter();
const embedStore = useEmbedStore();
const webhookStore = useWebhooksStore();
const ui = useUiStore();
const threadId = ref('');
const sent = ref(false);
const showJson = ref(false);
const showTemplates = ref(false);
const showSaveTemplate = ref(false);
const showFonts = ref(false);
const showExport = ref(false);
const sendMode = ref('webhook');
const templates = ref([]);
const tplForm = ref({ name: '', description: '', category: 'Annonces' });
const avatarInput = ref(null);
// Bot send
const bots = ref([]);
const selectedBotId = ref(null);
const selectedChannelId = ref('');
const selectedChannelName = ref('');
const botSending = ref(false);
const botError = ref('');
const currentWebhookUrl = computed(() => {
    const wh = webhookStore.webhooks.find(w => w.id === embedStore.selectedWebhookId);
    return wh?.url ?? '';
});
onMounted(async () => {
    await webhookStore.load();
    const [tplRes, botRes] = await Promise.all([api.get('/templates'), api.get('/bots')]);
    templates.value = tplRes.data;
    bots.value = botRes.data;
    if (embedStore.message.embeds.length === 0)
        embedStore.addEmbed();
});
async function sendWebhook() {
    await embedStore.send(threadId.value || undefined);
    if (!embedStore.lastError) {
        sent.value = true;
        ui.notify('Message envoyé !');
        setTimeout(() => { router.push('/history'); }, 2000);
    }
}
async function sendViaBot() {
    if (!selectedBotId.value || !selectedChannelId.value)
        return;
    botSending.value = true;
    botError.value = '';
    try {
        await api.post('/bots/send', {
            bot_id: selectedBotId.value,
            channel_id: selectedChannelId.value,
            payload: {
                content: embedStore.message.content || undefined,
                embeds: embedStore.message.embeds.length ? embedStore.message.embeds : undefined,
            },
        });
        sent.value = true;
        ui.notify(`Message envoyé via bot dans #${selectedChannelName.value} !`);
        setTimeout(() => { router.push('/history'); }, 2000);
    }
    catch (e) {
        botError.value = e?.response?.data?.error ?? 'Erreur envoi bot';
    }
    finally {
        botSending.value = false;
    }
}
function onChannelSelect(sel) {
    selectedChannelId.value = sel?.channelId ?? '';
    selectedChannelName.value = sel?.channelName ?? '';
}
function applyFontToField(text, field) {
    const embed = embedStore.message.embeds[0];
    if (field === 'content')
        embedStore.message.content = text;
    else if (field === 'title' && embed)
        embed.title = text;
    else if (field === 'description' && embed)
        embed.description = text;
    else if (field === 'footer' && embed)
        embed.footer = { text, icon_url: embed.footer?.icon_url ?? '' };
    else if (field === 'author' && embed)
        embed.author = { name: text, url: embed.author?.url ?? '', icon_url: embed.author?.icon_url ?? '' };
    ui.notify(`Texte inséré dans "${field}" !`);
}
function duplicateEmbed(i) {
    embedStore.message.embeds.push(JSON.parse(JSON.stringify(embedStore.message.embeds[i])));
}
function loadUserTemplate(t) {
    try {
        embedStore.loadTemplate(JSON.parse(t.payload));
        ui.notify(`Template "${t.name}" chargé`);
    }
    catch {
        ui.notify('Impossible de parser le template', 'error');
    }
}
function loadPreset(payload) {
    embedStore.loadTemplate(payload);
    ui.notify('Template chargé');
}
function saveAsTemplate() {
    tplForm.value = { name: '', description: '', category: 'Annonces' };
    showSaveTemplate.value = true;
}
async function submitTemplate() {
    if (!tplForm.value.name)
        return;
    await api.post('/templates', {
        name: tplForm.value.name,
        description: tplForm.value.description,
        payload: JSON.stringify(embedStore.message),
        category: tplForm.value.category,
        preview_color: embedStore.message.embeds[0]?.color
            ? '#' + embedStore.message.embeds[0].color.toString(16).padStart(6, '0')
            : '#5865F2',
    });
    showSaveTemplate.value = false;
    ui.notify('Template sauvegardé !');
    const { data } = await api.get('/templates');
    templates.value = data;
}
function triggerAvatarUpload() { avatarInput.value?.click(); }
async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file)
        return;
    try {
        const form = new FormData();
        form.append('file', file);
        const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        embedStore.message.avatar_url = data.url;
        ui.notify('Avatar uploadé !');
    }
    catch (err) {
        ui.notify(err?.response?.data?.error ?? 'Erreur upload', 'error');
    }
    finally {
        if (avatarInput.value)
            avatarInput.value.value = '';
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['send-mode-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['send-mode-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['send-mode-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "builder-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showExport = true;
        } },
    ...{ class: "btn-secondary" },
    title: "Exporter l'embed",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showFonts = true;
        } },
    ...{ class: "btn-secondary" },
    title: "Convertisseur de polices",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showTemplates = true;
        } },
    ...{ class: "btn-secondary" },
    title: "Charger un template",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveAsTemplate) },
    ...{ class: "btn-secondary" },
    title: "Sauver comme template",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-num" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.embedStore.message.content),
    placeholder: "Ex: @everyone Nouvelle annonce ! 🎉  ← Ce texte apparaît AVANT l'embed",
    ...{ class: "fh-textarea" },
    rows: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-num" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "half" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Ex: Bot Annonces",
    ...{ class: "fh-input" },
});
(__VLS_ctx.embedStore.message.username);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "half" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "avatar-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "https://...",
    ...{ class: "fh-input" },
});
(__VLS_ctx.embedStore.message.avatar_url);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.triggerAvatarUpload) },
    ...{ class: "btn-secondary avatar-upload-btn" },
    title: "Importer une image",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.uploadAvatar) },
    ref: "avatarInput",
    type: "file",
    accept: "image/*",
    ...{ style: {} },
});
/** @type {typeof __VLS_ctx.avatarInput} */ ;
if (__VLS_ctx.embedStore.message.avatar_url) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ onError: (...[$event]) => {
                if (!(__VLS_ctx.embedStore.message.avatar_url))
                    return;
                $event.target.style.display = 'none';
            } },
        src: (__VLS_ctx.embedStore.message.avatar_url),
        ...{ class: "avatar-preview" },
        alt: "avatar",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "inline-toggle fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "checkbox",
    ...{ style: {} },
});
(__VLS_ctx.embedStore.message.tts);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-num" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-hint" },
});
for (const [_, i] of __VLS_getVForSourceType((__VLS_ctx.embedStore.message.embeds))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (i),
        ...{ class: "embed-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "embed-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (i + 1);
    (__VLS_ctx.embedStore.message.embeds.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.duplicateEmbed(i);
            } },
        ...{ class: "btn-secondary" },
        title: "Dupliquer",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.embedStore.removeEmbed(i);
            } },
        ...{ class: "btn-danger-sm" },
    });
    /** @type {[typeof EmbedBuilder, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(EmbedBuilder, new EmbedBuilder({
        modelValue: (__VLS_ctx.embedStore.message.embeds[i]),
    }));
    const __VLS_1 = __VLS_0({
        modelValue: (__VLS_ctx.embedStore.message.embeds[i]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.embedStore.addEmbed();
        } },
    ...{ class: "btn-add" },
    disabled: (__VLS_ctx.embedStore.message.embeds.length >= 10),
});
(__VLS_ctx.embedStore.message.embeds.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-section send-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-num" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "send-mode-tabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.sendMode = 'webhook';
        } },
    ...{ class: ({ active: __VLS_ctx.sendMode === 'webhook' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.sendMode = 'bot';
        } },
    ...{ class: ({ active: __VLS_ctx.sendMode === 'bot' }) },
});
if (__VLS_ctx.sendMode === 'webhook') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "send-area" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.embedStore.selectedWebhookId),
        ...{ class: "fh-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (null),
        disabled: true,
    });
    for (const [w] of __VLS_getVForSourceType((__VLS_ctx.webhookStore.webhooks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (w.id),
            value: (w.id),
        });
        (w.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Thread ID (optionnel)",
        ...{ class: "fh-input" },
        ...{ style: {} },
    });
    (__VLS_ctx.threadId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.sendWebhook) },
        ...{ class: "btn-primary send-btn" },
        disabled: (__VLS_ctx.embedStore.sending || !__VLS_ctx.embedStore.selectedWebhookId),
    });
    (__VLS_ctx.embedStore.sending ? '⏳ Envoi...' : '🚀 Envoyer');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.sendMode === 'webhook'))
                    return;
                __VLS_ctx.embedStore.reset();
            } },
        ...{ class: "btn-secondary" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "send-bot-area" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bot-select-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.selectedBotId),
        ...{ class: "fh-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (null),
        disabled: true,
    });
    for (const [b] of __VLS_getVForSourceType((__VLS_ctx.bots))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (b.id),
            value: (b.id),
        });
        (b.name);
    }
    if (__VLS_ctx.selectedBotId) {
        /** @type {[typeof BotChannelPicker, ]} */ ;
        // @ts-ignore
        const __VLS_3 = __VLS_asFunctionalComponent(BotChannelPicker, new BotChannelPicker({
            ...{ 'onSelect': {} },
            botId: (__VLS_ctx.selectedBotId),
        }));
        const __VLS_4 = __VLS_3({
            ...{ 'onSelect': {} },
            botId: (__VLS_ctx.selectedBotId),
        }, ...__VLS_functionalComponentArgsRest(__VLS_3));
        let __VLS_6;
        let __VLS_7;
        let __VLS_8;
        const __VLS_9 = {
            onSelect: (__VLS_ctx.onChannelSelect)
        };
        var __VLS_5;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "send-area" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.sendViaBot) },
        ...{ class: "btn-primary send-btn" },
        disabled: (__VLS_ctx.botSending || !__VLS_ctx.selectedBotId || !__VLS_ctx.selectedChannelId),
    });
    (__VLS_ctx.botSending ? '⏳ Envoi...' : '🤖 Envoyer via bot');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.sendMode === 'webhook'))
                    return;
                __VLS_ctx.embedStore.reset();
            } },
        ...{ class: "btn-secondary" },
    });
}
if (__VLS_ctx.sendMode === 'webhook' && !__VLS_ctx.embedStore.selectedWebhookId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "send-hint" },
    });
}
if (__VLS_ctx.sendMode === 'bot' && __VLS_ctx.selectedBotId && !__VLS_ctx.selectedChannelId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "send-hint" },
    });
}
if (__VLS_ctx.embedStore.lastError || __VLS_ctx.botError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error mt-2" },
    });
    (__VLS_ctx.embedStore.lastError || __VLS_ctx.botError);
}
if (__VLS_ctx.sent) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "success mt-2" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "preview-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showJson = !__VLS_ctx.showJson;
        } },
    ...{ class: "btn-secondary" },
    ...{ style: {} },
});
(__VLS_ctx.showJson ? 'Masquer JSON' : 'JSON');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "preview-legend" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "legend-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "leg-tag tag-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "legend-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "leg-tag tag-embed" },
});
/** @type {[typeof DiscordPreview, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(DiscordPreview, new DiscordPreview({
    message: (__VLS_ctx.embedStore.message),
    showBotTag: (true),
}));
const __VLS_11 = __VLS_10({
    message: (__VLS_ctx.embedStore.message),
    showBotTag: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
if (__VLS_ctx.showJson) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "json-block" },
    });
    (JSON.stringify(__VLS_ctx.embedStore.message, null, 2));
}
/** @type {[typeof EmbedTemplatesModal, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(EmbedTemplatesModal, new EmbedTemplatesModal({
    ...{ 'onLoadTemplate': {} },
    ...{ 'onLoadPreset': {} },
    modelValue: (__VLS_ctx.showTemplates),
    userTemplates: (__VLS_ctx.templates),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onLoadTemplate': {} },
    ...{ 'onLoadPreset': {} },
    modelValue: (__VLS_ctx.showTemplates),
    userTemplates: (__VLS_ctx.templates),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onLoadTemplate: (__VLS_ctx.loadUserTemplate)
};
const __VLS_20 = {
    onLoadPreset: (__VLS_ctx.loadPreset)
};
var __VLS_15;
/** @type {[typeof EmbedFontsModal, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(EmbedFontsModal, new EmbedFontsModal({
    ...{ 'onInject': {} },
    modelValue: (__VLS_ctx.showFonts),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onInject': {} },
    modelValue: (__VLS_ctx.showFonts),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onInject: (__VLS_ctx.applyFontToField)
};
var __VLS_23;
/** @type {[typeof ExportModal, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(ExportModal, new ExportModal({
    modelValue: (__VLS_ctx.showExport),
    payload: (__VLS_ctx.embedStore.message),
    webhookUrl: (__VLS_ctx.currentWebhookUrl),
}));
const __VLS_29 = __VLS_28({
    modelValue: (__VLS_ctx.showExport),
    payload: (__VLS_ctx.embedStore.message),
    webhookUrl: (__VLS_ctx.currentWebhookUrl),
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
if (__VLS_ctx.showSaveTemplate) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSaveTemplate))
                    return;
                __VLS_ctx.showSaveTemplate = false;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Nom du template",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.tplForm.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Description courte",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.tplForm.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Ex: annonces, jeux, logs",
        ...{ class: "fh-input" },
        list: "cat-list",
    });
    (__VLS_ctx.tplForm.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.datalist, __VLS_intrinsicElements.datalist)({
        id: "cat-list",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        value: "Annonces",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        value: "Jeux",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        value: "Films & Séries",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        value: "Serveur",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        value: "Modération",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        value: "Événements",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submitTemplate) },
        ...{ class: "btn-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSaveTemplate))
                    return;
                __VLS_ctx.showSaveTemplate = false;
            } },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['builder-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-num']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-num']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['half']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['half']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-row']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-num']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-section']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-header']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-section']} */ ;
/** @type {__VLS_StyleScopedClasses['send-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-num']} */ ;
/** @type {__VLS_StyleScopedClasses['send-mode-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['send-area']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['send-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['send-bot-area']} */ ;
/** @type {__VLS_StyleScopedClasses['bot-select-row']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['send-area']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['send-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['send-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['send-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['success']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['leg-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-content']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['leg-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-embed']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['json-block']} */ ;
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
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            EmbedBuilder: EmbedBuilder,
            DiscordPreview: DiscordPreview,
            EmbedTemplatesModal: EmbedTemplatesModal,
            EmbedFontsModal: EmbedFontsModal,
            ExportModal: ExportModal,
            BotChannelPicker: BotChannelPicker,
            embedStore: embedStore,
            webhookStore: webhookStore,
            threadId: threadId,
            sent: sent,
            showJson: showJson,
            showTemplates: showTemplates,
            showSaveTemplate: showSaveTemplate,
            showFonts: showFonts,
            showExport: showExport,
            sendMode: sendMode,
            templates: templates,
            tplForm: tplForm,
            avatarInput: avatarInput,
            bots: bots,
            selectedBotId: selectedBotId,
            selectedChannelId: selectedChannelId,
            botSending: botSending,
            botError: botError,
            currentWebhookUrl: currentWebhookUrl,
            sendWebhook: sendWebhook,
            sendViaBot: sendViaBot,
            onChannelSelect: onChannelSelect,
            applyFontToField: applyFontToField,
            duplicateEmbed: duplicateEmbed,
            loadUserTemplate: loadUserTemplate,
            loadPreset: loadPreset,
            saveAsTemplate: saveAsTemplate,
            submitTemplate: submitTemplate,
            triggerAvatarUpload: triggerAvatarUpload,
            uploadAvatar: uploadAvatar,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
