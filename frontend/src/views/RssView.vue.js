/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
const ui = useUiStore();
const feeds = ref([]);
const webhooks = ref([]);
const showForm = ref(false);
const editing = ref(null);
const formError = ref('');
const form = ref({ name: '', url: '', webhook_id: 0, check_interval: 3600, template: '', enabled: true });
const activeTab = ref('feeds');
// RSSDI integration
const triggering = ref(null);
const rssdiUrl = import.meta.env.VITE_RSSDI_URL ?? 'https://rssdi.heiphaistos.org';
const rssdiLoading = ref(false);
const rssdiError = ref('');
const rssdiFeeds = ref([]);
const rssdiArticles = ref([]);
onMounted(async () => {
    const [f, w] = await Promise.all([api.get('/rss'), api.get('/webhooks')]);
    feeds.value = f.data;
    webhooks.value = w.data;
});
function openRssdi() {
    activeTab.value = 'rssdi';
    loadRssdi();
}
async function loadRssdi() {
    rssdiLoading.value = true;
    rssdiError.value = '';
    try {
        const [feedsRes, articlesRes] = await Promise.allSettled([
            fetch(`${rssdiUrl}/api/feeds`, { credentials: 'include' }),
            fetch(`${rssdiUrl}/api/articles?limit=20`, { credentials: 'include' }),
        ]);
        if (feedsRes.status === 'fulfilled' && feedsRes.value.ok) {
            const data = await feedsRes.value.json();
            rssdiFeeds.value = Array.isArray(data) ? data : (data.feeds ?? data.items ?? []);
        }
        else {
            rssdiError.value = 'Impossible d\'accéder à RSSDI. Assurez-vous d\'être connecté à votre instance.';
        }
        if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
            const data = await articlesRes.value.json();
            rssdiArticles.value = Array.isArray(data) ? data : (data.articles ?? data.items ?? []);
        }
    }
    catch {
        rssdiError.value = 'Erreur de connexion à RSSDI. Vérifiez que l\'instance est accessible.';
    }
    finally {
        rssdiLoading.value = false;
    }
}
function importFromRssdi(rssdiF) {
    form.value = {
        name: rssdiF.name ?? rssdiF.title ?? 'Flux importé',
        url: rssdiF.url ?? rssdiF.feed_url ?? '',
        webhook_id: webhooks.value[0]?.id ?? 0,
        check_interval: 3600,
        template: '',
        enabled: true,
    };
    formError.value = '';
    activeTab.value = 'feeds';
    showForm.value = true;
}
function webhookName(id) {
    return webhooks.value.find(w => w.id === id)?.name ?? `#${id}`;
}
function fmtDate(d) {
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function openForm(f) {
    editing.value = f ?? null;
    form.value = f
        ? { name: f.name, url: f.url, webhook_id: f.webhook_id, check_interval: f.check_interval, template: '', enabled: !!f.enabled }
        : { name: '', url: '', webhook_id: 0, check_interval: 3600, template: '', enabled: true };
    formError.value = '';
    showForm.value = true;
}
async function submit() {
    formError.value = '';
    if (!form.value.name || !form.value.url || !form.value.webhook_id) {
        formError.value = 'Nom, URL et webhook requis';
        return;
    }
    try {
        if (editing.value)
            await api.put(`/rss/${editing.value.id}`, form.value);
        else
            await api.post('/rss', form.value);
        const { data } = await api.get('/rss');
        feeds.value = data;
        showForm.value = false;
        ui.notify(editing.value ? 'Flux modifié' : 'Flux ajouté !');
    }
    catch (e) {
        formError.value = e.response?.data?.error ?? 'Erreur';
    }
}
async function triggerFeed(id) {
    triggering.value = id;
    try {
        await api.post(`/rss/${id}/trigger`);
        ui.notify('Flux déclenché — vérification en cours...');
        const { data } = await api.get('/rss');
        feeds.value = data;
    }
    catch {
        ui.notify('Erreur lors du déclenchement', 'error');
    }
    finally {
        triggering.value = null;
    }
}
async function toggle(f) {
    await api.patch(`/rss/${f.id}/toggle`);
    f.enabled = f.enabled ? 0 : 1;
    ui.notify(f.enabled ? 'Flux activé' : 'Flux mis en pause');
}
async function remove(id) {
    await api.delete(`/rss/${id}`);
    feeds.value = feeds.value.filter(f => f.id !== id);
    ui.notify('Flux supprimé');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tab']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-info']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-info']} */ ;
/** @type {__VLS_StyleScopedClasses['article-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openRssdi) },
    ...{ class: "btn-secondary rssdi-btn" },
    title: "Importer depuis RSSDI",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openForm();
        } },
    ...{ class: "btn-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tabs mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'feeds';
        } },
    ...{ class: (['tab', __VLS_ctx.activeTab === 'feeds' ? 'tab-active' : '']) },
});
(__VLS_ctx.feeds.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'rssdi';
            __VLS_ctx.loadRssdi();
        } },
    ...{ class: (['tab', __VLS_ctx.activeTab === 'rssdi' ? 'tab-active' : '']) },
});
if (__VLS_ctx.activeTab === 'feeds') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid-2" },
    });
    for (const [f] of __VLS_getVForSourceType((__VLS_ctx.feeds))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (f.id),
            ...{ class: "card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "feed-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['badge', f.enabled ? 'badge-success' : 'badge-error']) },
        });
        (f.enabled ? '▶ Actif' : '⏸ Pausé');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "feed-name" },
        });
        (f.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "feed-url" },
        });
        (f.url);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "feed-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.webhookName(f.webhook_id));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (f.check_interval / 60);
        if (f.last_checked) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.fmtDate(f.last_checked));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "feed-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'feeds'))
                        return;
                    __VLS_ctx.toggle(f);
                } },
            ...{ class: (f.enabled ? 'btn-secondary' : 'btn-primary') },
        });
        (f.enabled ? '⏸ Pause' : '▶ Activer');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'feeds'))
                        return;
                    __VLS_ctx.triggerFeed(f.id);
                } },
            ...{ class: "btn-secondary" },
            disabled: (__VLS_ctx.triggering === f.id),
            title: "Déclencher maintenant",
        });
        (__VLS_ctx.triggering === f.id ? '⏳...' : '⚡ Déclencher');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'feeds'))
                        return;
                    __VLS_ctx.openForm(f);
                } },
            ...{ class: "btn-secondary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'feeds'))
                        return;
                    __VLS_ctx.remove(f.id);
                } },
            ...{ class: "btn-danger-sm" },
        });
    }
    if (!__VLS_ctx.feeds.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-state" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: {} },
        });
    }
}
if (__VLS_ctx.activeTab === 'rssdi') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rssdi-banner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rssdi-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rssdi-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: (__VLS_ctx.rssdiUrl),
        target: "_blank",
        rel: "noopener",
        ...{ class: "btn-secondary" },
    });
    if (__VLS_ctx.rssdiLoading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rssdi-loading" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "spinner" },
        });
    }
    else if (__VLS_ctx.rssdiError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rssdi-error" },
        });
        (__VLS_ctx.rssdiError);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.loadRssdi) },
            ...{ class: "btn-secondary ml-2" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        if (__VLS_ctx.rssdiFeeds.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "rssdi-grid" },
            });
            for (const [f] of __VLS_getVForSourceType((__VLS_ctx.rssdiFeeds))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (f.id),
                    ...{ class: "rssdi-card" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "rssdi-card-top" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "rssdi-card-name" },
                });
                (f.name);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: (['badge', f.enabled ? 'badge-success' : 'badge-error']) },
                    ...{ style: {} },
                });
                (f.enabled ? 'Actif' : 'Inactif');
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "rssdi-card-url" },
                });
                (f.url);
                if (f.last_checked) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "rssdi-card-meta" },
                    });
                    (__VLS_ctx.fmtDate(f.last_checked));
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "rssdi-card-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeTab === 'rssdi'))
                                return;
                            if (!!(__VLS_ctx.rssdiLoading))
                                return;
                            if (!!(__VLS_ctx.rssdiError))
                                return;
                            if (!(__VLS_ctx.rssdiFeeds.length))
                                return;
                            __VLS_ctx.importFromRssdi(f);
                        } },
                    ...{ class: "btn-primary" },
                    ...{ style: {} },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                    href: (`${__VLS_ctx.rssdiUrl}/feed/${f.id}`),
                    target: "_blank",
                    rel: "noopener",
                    ...{ class: "btn-secondary" },
                    ...{ style: {} },
                });
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "empty-state" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                href: (__VLS_ctx.rssdiUrl),
                target: "_blank",
                rel: "noopener",
                ...{ style: {} },
            });
        }
    }
    if (__VLS_ctx.rssdiFeeds.length && __VLS_ctx.rssdiArticles.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "section-title-sm" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "articles-list" },
        });
        for (const [art] of __VLS_getVForSourceType((__VLS_ctx.rssdiArticles.slice(0, 20)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                key: (art.id),
                href: (art.link),
                target: "_blank",
                rel: "noopener",
                ...{ class: "article-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "article-feed-name" },
            });
            (art.feed_name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "article-title" },
            });
            (art.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "article-date" },
            });
            (__VLS_ctx.fmtDate(art.published_at));
        }
    }
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
    (__VLS_ctx.editing ? 'Modifier flux' : 'Ajouter un flux RSS');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Ex: Blog Anthropic",
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
        placeholder: "https://exemple.com/feed.xml",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.url);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.form.webhook_id),
        ...{ class: "fh-select w-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
        disabled: true,
    });
    for (const [w] of __VLS_getVForSourceType((__VLS_ctx.webhooks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (w.id),
            value: (w.id),
        });
        (w.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "number",
        min: "60",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.check_interval);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.form.template),
        placeholder: '{"embeds":[{"title":"{{title}}","url":"{{link}}","description":"{{content}}"}]}',
        ...{ class: "fh-textarea" },
        rows: "4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
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
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['feed-header']} */ ;
/** @type {__VLS_StyleScopedClasses['feed-name']} */ ;
/** @type {__VLS_StyleScopedClasses['feed-url']} */ ;
/** @type {__VLS_StyleScopedClasses['feed-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['feed-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-info']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-error']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-card']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-card-name']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-card-url']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-card-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['rssdi-card-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['articles-list']} */ ;
/** @type {__VLS_StyleScopedClasses['article-row']} */ ;
/** @type {__VLS_StyleScopedClasses['article-feed-name']} */ ;
/** @type {__VLS_StyleScopedClasses['article-title']} */ ;
/** @type {__VLS_StyleScopedClasses['article-date']} */ ;
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
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            feeds: feeds,
            webhooks: webhooks,
            showForm: showForm,
            editing: editing,
            formError: formError,
            form: form,
            activeTab: activeTab,
            triggering: triggering,
            rssdiUrl: rssdiUrl,
            rssdiLoading: rssdiLoading,
            rssdiError: rssdiError,
            rssdiFeeds: rssdiFeeds,
            rssdiArticles: rssdiArticles,
            openRssdi: openRssdi,
            loadRssdi: loadRssdi,
            importFromRssdi: importFromRssdi,
            webhookName: webhookName,
            fmtDate: fmtDate,
            openForm: openForm,
            submit: submit,
            triggerFeed: triggerFeed,
            toggle: toggle,
            remove: remove,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
