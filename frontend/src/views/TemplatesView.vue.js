/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
import { useEmbedStore } from '../stores/embed';
import { useRouter } from 'vue-router';
const ui = useUiStore();
const embedStore = useEmbedStore();
const router = useRouter();
const templates = ref([]);
const showForm = ref(false);
const editing = ref(null);
const formError = ref('');
const form = ref({ name: '', description: '', category: 'general', preview_color: '#5865F2', payloadStr: '{"content":"","embeds":[]}' });
const search = ref('');
const sortBy = ref('name');
const filterCat = ref('');
const previewTarget = ref(null);
const varsModal = ref(null);
const allCategories = computed(() => [...new Set(templates.value.map(t => t.category))]);
const formVars = computed(() => extractVars(form.value.payloadStr));
const filteredTemplates = computed(() => {
    let list = templates.value;
    if (search.value) {
        const q = search.value.toLowerCase();
        list = list.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
    }
    if (filterCat.value)
        list = list.filter(t => t.category === filterCat.value);
    if (sortBy.value === 'name')
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy.value === 'category')
        list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    return list;
});
const groupedFiltered = computed(() => filteredTemplates.value.reduce((acc, t) => {
    if (!acc[t.category])
        acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
}, {}));
function extractVars(str) {
    const matches = str.match(/\{\{(\w+)\}\}/g) ?? [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
}
function vars(t) {
    const payload = typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload);
    return extractVars(payload);
}
function previewPayload(t) {
    try {
        return typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload;
    }
    catch {
        return {};
    }
}
onMounted(async () => {
    const { data } = await api.get('/templates');
    templates.value = data;
});
function openPreview(t) { previewTarget.value = t; }
function openForm() {
    editing.value = null;
    form.value = { name: '', description: '', category: 'general', preview_color: '#5865F2', payloadStr: '' };
    formError.value = '';
    showForm.value = true;
}
function openEdit(t) {
    editing.value = t;
    form.value = {
        name: t.name,
        description: t.description ?? '',
        category: t.category,
        preview_color: t.preview_color,
        payloadStr: typeof t.payload === 'string' ? t.payload : JSON.stringify(JSON.parse(t.payload), null, 2),
    };
    formError.value = '';
    showForm.value = true;
}
async function submit() {
    formError.value = '';
    if (!form.value.name || !form.value.payloadStr) {
        formError.value = 'Nom et payload requis';
        return;
    }
    let payload;
    try {
        payload = JSON.parse(form.value.payloadStr);
    }
    catch {
        formError.value = 'JSON invalide';
        return;
    }
    try {
        if (editing.value)
            await api.put(`/templates/${editing.value.id}`, { ...form.value, payload });
        else
            await api.post('/templates', { ...form.value, payload });
        const { data } = await api.get('/templates');
        templates.value = data;
        showForm.value = false;
        ui.notify(editing.value ? 'Template modifié' : 'Template créé !');
    }
    catch (e) {
        formError.value = e.response?.data?.error ?? 'Erreur';
    }
}
function use(t) {
    const vs = vars(t);
    if (vs.length) {
        varsModal.value = { tpl: t, vars: vs, values: Object.fromEntries(vs.map(v => [v, ''])) };
        return;
    }
    loadTemplate(t, {});
}
function applyVars() {
    if (!varsModal.value)
        return;
    loadTemplate(varsModal.value.tpl, varsModal.value.values);
    varsModal.value = null;
}
function loadTemplate(t, values) {
    try {
        let raw = typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload);
        for (const [k, v] of Object.entries(values)) {
            raw = raw.replaceAll(`{{${k}}}`, v);
        }
        embedStore.loadTemplate(JSON.parse(raw));
        router.push('/embed');
        ui.notify(`Template "${t.name}" chargé`);
    }
    catch {
        ui.notify('Impossible de charger ce template', 'error');
    }
}
async function duplicate(t) {
    try {
        const payload = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload;
        await api.post('/templates', {
            name: `${t.name} (copie)`,
            description: t.description,
            category: t.category,
            preview_color: t.preview_color,
            payload,
        });
        const { data } = await api.get('/templates');
        templates.value = data;
        ui.notify('Template dupliqué');
    }
    catch {
        ui.notify('Erreur lors de la duplication', 'error');
    }
}
async function remove(id) {
    await api.delete(`/templates/${id}`);
    templates.value = templates.value.filter(t => t.id !== id);
    ui.notify('Template supprimé');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
/** @type {__VLS_StyleScopedClasses['template-card']} */ ;
/** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
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
    ...{ class: "filters-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "🔍 Rechercher...",
    ...{ class: "fh-input filter-search" },
});
(__VLS_ctx.search);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.sortBy),
    ...{ class: "fh-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "name",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "category",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "date",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cat-pills" },
});
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.allCategories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.filterCat = __VLS_ctx.filterCat === c ? '' : c;
            } },
        key: (c),
        ...{ class: (['pill', { active: __VLS_ctx.filterCat === c }]) },
    });
    (c);
}
if (!__VLS_ctx.filteredTemplates.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    (__VLS_ctx.templates.length ? 'Aucun résultat pour ce filtre.' : 'Aucun template. Créez-en depuis l\'Embed Builder (bouton "Sauver comme template").');
}
for (const [group, cat] of __VLS_getVForSourceType((__VLS_ctx.groupedFiltered))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (cat),
        ...{ class: "category-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "category-label" },
    });
    (cat);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid-3" },
    });
    for (const [t] of __VLS_getVForSourceType((group))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (t.id),
            ...{ class: "card template-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "tpl-accent" },
            ...{ style: ({ background: t.preview_color || '#5865F2' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tpl-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tpl-name" },
        });
        (t.name);
        if (__VLS_ctx.vars(t).length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "vars-badge" },
                title: (__VLS_ctx.vars(t).join(', ')),
            });
            (__VLS_ctx.vars(t).length);
            (__VLS_ctx.vars(t).length > 1 ? 's' : '');
        }
        if (t.description) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "tpl-desc" },
            });
            (t.description);
        }
        if (__VLS_ctx.vars(t).length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "vars-chips" },
            });
            for (const [v] of __VLS_getVForSourceType((__VLS_ctx.vars(t).slice(0, 4)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (v),
                    ...{ class: "var-chip" },
                });
                __VLS_asFunctionalDirective(__VLS_directives.vText)(null, { ...__VLS_directiveBindingRestFields, value: ('{{' + v + '}}') }, null, null);
            }
            if (__VLS_ctx.vars(t).length > 4) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "var-chip muted" },
                });
                (__VLS_ctx.vars(t).length - 4);
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: "tpl-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.use(t);
                } },
            ...{ class: "btn-primary" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.openPreview(t);
                } },
            ...{ class: "btn-secondary" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.duplicate(t);
                } },
            ...{ class: "btn-secondary" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.openEdit(t);
                } },
            ...{ class: "btn-secondary" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.remove(t.id);
                } },
            ...{ class: "btn-danger-sm" },
        });
    }
}
if (__VLS_ctx.varsModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.varsModal))
                    return;
                __VLS_ctx.varsModal = null;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.varsModal.tpl.name);
    for (const [v] of __VLS_getVForSourceType((__VLS_ctx.varsModal.vars))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (v),
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "fh-label" },
        });
        (v);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            placeholder: (`Valeur pour {{${v}}}`),
            ...{ class: "fh-input" },
        });
        (__VLS_ctx.varsModal.values[v]);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.applyVars) },
        ...{ class: "btn-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.varsModal))
                    return;
                __VLS_ctx.varsModal = null;
            } },
        ...{ class: "btn-secondary" },
    });
}
if (__VLS_ctx.previewTarget) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewTarget))
                    return;
                __VLS_ctx.previewTarget = null;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.previewTarget.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewTarget))
                    return;
                __VLS_ctx.previewTarget = null;
            } },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "discord-preview-wrap" },
    });
    if (__VLS_ctx.previewPayload(__VLS_ctx.previewTarget).content) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "preview-content" },
        });
        (__VLS_ctx.previewPayload(__VLS_ctx.previewTarget).content);
    }
    for (const [embed, i] of __VLS_getVForSourceType((__VLS_ctx.previewPayload(__VLS_ctx.previewTarget).embeds ?? []))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "preview-embed" },
            ...{ style: ({ borderLeftColor: embed.color ? '#' + embed.color.toString(16).padStart(6, '0') : '#5865F2' }) },
        });
        if (embed.author?.name) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pe-author" },
            });
            (embed.author.name);
        }
        if (embed.title) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pe-title" },
            });
            (embed.title);
        }
        if (embed.description) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pe-desc" },
            });
            (embed.description);
        }
        if (embed.fields?.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pe-fields" },
            });
            for (const [f] of __VLS_getVForSourceType((embed.fields))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (f.name),
                    ...{ class: "pe-field" },
                    ...{ class: ({ inline: f.inline }) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "pe-fname" },
                });
                (f.name);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "pe-fval" },
                });
                (f.value);
            }
        }
        if (embed.footer?.text) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pe-footer" },
            });
            (embed.footer.text);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewTarget))
                    return;
                __VLS_ctx.use(__VLS_ctx.previewTarget);
                __VLS_ctx.previewTarget = null;
            } },
        ...{ class: "btn-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewTarget))
                    return;
                __VLS_ctx.previewTarget = null;
            } },
        ...{ class: "btn-secondary" },
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
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.editing ? 'Modifier template' : 'Nouveau template');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Ex: Annonce mise à jour",
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
        placeholder: "Description courte...",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "general",
        ...{ class: "fh-input" },
        list: "tpl-categories",
    });
    (__VLS_ctx.form.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.datalist, __VLS_intrinsicElements.datalist)({
        id: "tpl-categories",
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.allCategories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
            key: (c),
            value: (c),
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "#5865F2",
        ...{ class: "fh-input" },
    });
    (__VLS_ctx.form.preview_color);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "fh-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.form.payloadStr),
        placeholder: '{"content":"...","embeds":[...]}',
        ...{ class: "fh-textarea" },
        rows: "8",
    });
    if (__VLS_ctx.formVars.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "vars-detected" },
        });
        for (const [v] of __VLS_getVForSourceType((__VLS_ctx.formVars))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (v),
                ...{ class: "var-chip" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vText)(null, { ...__VLS_directiveBindingRestFields, value: ('{{' + v + '}}') }, null, null);
        }
    }
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
    (__VLS_ctx.editing ? 'Modifier' : 'Créer');
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
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-search']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['cat-pills']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['category-group']} */ ;
/** @type {__VLS_StyleScopedClasses['category-label']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-3']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['template-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-name']} */ ;
/** @type {__VLS_StyleScopedClasses['vars-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['vars-chips']} */ ;
/** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['discord-preview-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-embed']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-author']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-fields']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-field']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-fname']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-fval']} */ ;
/** @type {__VLS_StyleScopedClasses['pe-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
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
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['vars-detected']} */ ;
/** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            templates: templates,
            showForm: showForm,
            editing: editing,
            formError: formError,
            form: form,
            search: search,
            sortBy: sortBy,
            filterCat: filterCat,
            previewTarget: previewTarget,
            varsModal: varsModal,
            allCategories: allCategories,
            formVars: formVars,
            filteredTemplates: filteredTemplates,
            groupedFiltered: groupedFiltered,
            vars: vars,
            previewPayload: previewPayload,
            openPreview: openPreview,
            openForm: openForm,
            openEdit: openEdit,
            submit: submit,
            use: use,
            applyVars: applyVars,
            duplicate: duplicate,
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
