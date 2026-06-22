/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
const props = defineProps();
const emit = defineEmits();
function loadTemplate(t) {
    emit('load-template', t);
    emit('update:modelValue', false);
}
const activeCat = ref('Tous');
const presetTemplates = [
    { cat: 'Jeux', icon: '🎮', name: 'Annonce de jeu', desc: "Sortie ou mise à jour d'un jeu",
        payload: { content: '@everyone 🎮 Nouvelle sortie !', embeds: [{ title: '🎮 [Nom du jeu] — Maintenant disponible !', description: "[Description du jeu]\n\n> *\"[Citation ou slogan]\"*", color: 0x5865F2, image: { url: '' }, thumbnail: { url: '' }, fields: [{ name: '🕹 Genre', value: 'RPG / Action', inline: true }, { name: '💻 Plateformes', value: 'PC / PS5 / Xbox', inline: true }, { name: '💰 Prix', value: '29,99€', inline: true }, { name: '🔗 Liens', value: '[Steam](https://steam.com) • [Site officiel](https://...)', inline: false }], footer: { text: 'Disponible dès maintenant !' } }] } },
    { cat: 'Jeux', icon: '📋', name: 'Patch Notes', desc: 'Notes de mise à jour de jeu',
        payload: { content: '', embeds: [{ title: '📋 Patch Notes — Version [X.Y.Z]', description: '*Mise à jour du [date]*\n\nRésumé des changements principaux...', color: 0x57F287, fields: [{ name: '✨ Nouveautés', value: '• Feature 1\n• Feature 2', inline: false }, { name: '⚡ Améliorations', value: '• Amélioration 1', inline: false }, { name: '🐛 Corrections', value: '• Fix bug critique', inline: false }], footer: { text: 'Patch Notes officiel' }, timestamp: new Date().toISOString() }] } },
    { cat: 'Jeux', icon: '🏆', name: 'Annonce de tournoi', desc: 'Tournoi / compétition gaming',
        payload: { content: '@everyone 🏆 Un tournoi arrive !', embeds: [{ title: '🏆 Tournoi [Nom du jeu]', description: 'Rejoignez notre tournoi exclusif !', color: 0xFEE75C, fields: [{ name: '📅 Date', value: '[Date début] → [Date fin]', inline: true }, { name: '👥 Format', value: '1v1 / 5v5', inline: true }, { name: '💰 Prize Pool', value: '[Montant] €', inline: true }, { name: '📝 Inscription', value: 'Réagissez avec ✅', inline: false }], footer: { text: "Inscriptions ouvertes jusqu'au [date]" } }] } },
    { cat: 'Jeux', icon: '📣', name: 'Résultats match', desc: "Résultats d'une compétition",
        payload: { content: '', embeds: [{ title: '📣 Résultats — [Événement]', description: 'Les résultats sont là !', color: 0xED4245, fields: [{ name: '🥇 1er place', value: '[Joueur] — [Score]', inline: false }, { name: '🥈 2ème place', value: '[Joueur] — [Score]', inline: false }, { name: '🥉 3ème place', value: '[Joueur] — [Score]', inline: false }], footer: { text: 'GG à tous les participants !' } }] } },
    { cat: 'Films & Séries', icon: '🎬', name: 'Sortie film/série', desc: 'Annonce de sortie',
        payload: { content: '', embeds: [{ title: '🎬 [Titre] — En salle / Streaming !', description: '**Genre :** [Genre]\n**Réalisateur :** [Nom]\n\n[Synopsis]', color: 0xEB459E, image: { url: '' }, fields: [{ name: '📅 Date de sortie', value: '[Date]', inline: true }, { name: '⭐ Note Presse', value: '[X]/10', inline: true }, { name: '📺 Où regarder', value: '[Netflix](https://netflix.com) • [Disney+](https://disneyplus.com)', inline: false }], footer: { text: 'Disponible dès maintenant' } }] } },
    { cat: 'Films & Séries', icon: '⭐', name: 'Critique / Review', desc: 'Critique avec notation',
        payload: { content: '', embeds: [{ title: '⭐ Review : [Titre]', description: "[Votre avis]\n\n> *\"[Citation mémorable]\"*", color: 0xFEE75C, thumbnail: { url: '' }, fields: [{ name: '🎭 Scénario', value: '★★★★☆', inline: true }, { name: '🎨 Réalisation', value: '★★★★★', inline: true }, { name: '📊 Note globale', value: '**★★★★☆ 8/10**', inline: true }, { name: '✅ Verdict', value: 'À voir absolument !', inline: true }], footer: { text: 'Critique par [auteur]' }, timestamp: new Date().toISOString() }] } },
    { cat: 'Films & Séries', icon: '📺', name: "Résumé d'épisode", desc: "Recap d'un épisode de série",
        payload: { content: '', embeds: [{ title: '📺 [Série] — S[XX]E[XX] : "[Titre épisode]"', description: '**🚨 SPOILERS** — Résumé\n\n[Résumé de l\'épisode]', color: 0x5865F2, fields: [{ name: '⭐ Note', value: '[X]/10', inline: true }, { name: '⏱ Durée', value: '[X] min', inline: true }, { name: '🔮 Théories', value: '[Vos théories]', inline: false }], footer: { text: 'Prochain épisode : [date]' } }] } },
    { cat: 'Serveur', icon: '👋', name: 'Message de bienvenue', desc: 'Accueil des nouveaux membres',
        payload: { content: '', embeds: [{ title: '👋 Bienvenue sur [Nom du serveur] !', description: "Nous sommes ravis de t'accueillir !\n\nCe serveur est dédié à [sujet]. Lisez nos règles avant de participer.", color: 0x57F287, fields: [{ name: '📜 Règles', value: 'Lisez #📜-règles', inline: false }, { name: '🎭 Rôles', value: 'Récupérez vos rôles dans #🎭-rôles', inline: false }, { name: '💬 Chat', value: 'Dites bonjour dans #💬-général', inline: false }], footer: { text: 'Bonne expérience sur le serveur !' } }] } },
    { cat: 'Serveur', icon: '📜', name: 'Règles du serveur', desc: 'Liste des règles de la communauté',
        payload: { content: '', embeds: [{ title: '📜 Règles du serveur [Nom]', description: 'Veuillez lire et respecter ces règles. Le non-respect entraînera des sanctions.', color: 0xED4245, fields: [{ name: '1️⃣ Respect', value: 'Respectez tous les membres. Insultes et harcèlement interdits.', inline: false }, { name: '2️⃣ Contenu adapté', value: 'Postez du contenu approprié dans les bons channels.', inline: false }, { name: '3️⃣ Anti-spam', value: 'Pas de spam, flood, ou pub non autorisée.', inline: false }, { name: '⚠️ Sanctions', value: 'Avertissement → Mute → Kick → Ban selon la gravité.', inline: false }], footer: { text: 'En rejoignant ce serveur, vous acceptez ces règles.' } }] } },
    { cat: 'Serveur', icon: '🎁', name: 'Giveaway', desc: 'Cadeau / concours',
        payload: { content: '@everyone 🎁 GIVEAWAY !', embeds: [{ title: '🎁 GIVEAWAY — [Nom du lot]', description: '**Valeur estimée :** [valeur]\n\nUn gagnant sélectionné au hasard !', color: 0xFEE75C, fields: [{ name: '✅ Pour participer', value: 'Réagissez avec 🎉 sous ce message', inline: false }, { name: '⏰ Durée', value: 'Se termine dans **[durée]**', inline: true }, { name: '🏆 Gagnants', value: '**[nombre]** gagnant(s)', inline: true }], footer: { text: 'Bonne chance à tous !' }, timestamp: new Date().toISOString() }] } },
    { cat: 'Serveur', icon: '📣', name: 'Annonce générale', desc: 'Annonce pour tous les membres',
        payload: { content: '@everyone', embeds: [{ title: "📣 [Titre de l'annonce]", description: '[Corps de votre annonce]\n\nExplication détaillée de l\'annonce.', color: 0x5865F2, fields: [{ name: "📅 Date d'effet", value: '[Quand cela prend effet]', inline: true }, { name: '👥 Concerne', value: 'Tous les membres', inline: true }], footer: { text: "— L'équipe de modération" }, timestamp: new Date().toISOString() }] } },
    { cat: 'Serveur', icon: '⚡', name: 'Événement', desc: "Annonce d'événement / soirée",
        payload: { content: '@everyone 📅 Événement à venir !', embeds: [{ title: "📅 [Nom de l'événement]", description: "[Description de l'événement]", color: 0xEB459E, fields: [{ name: '🕐 Quand', value: '[Date] à [heure]', inline: true }, { name: '📍 Où', value: '[Channel / Plateforme]', inline: true }, { name: '📝 Pour participer', value: 'Réagissez avec ✅', inline: false }], footer: { text: 'On vous attend nombreux !' } }] } },
    { cat: 'Annonces', icon: '🆕', name: 'Nouvelle fonctionnalité', desc: 'Feature / produit',
        payload: { content: '', embeds: [{ title: '🆕 Nouveauté : [Nom de la feature]', description: "[Description]\n\nCette mise à jour apporte **[bénéfice principal]**.", color: 0x57F287, fields: [{ name: '✨ Ce qui change', value: '• Point 1\n• Point 2', inline: false }, { name: '📅 Disponible depuis', value: '[Date / Version]', inline: true }], footer: { text: 'Disponible maintenant' }, timestamp: new Date().toISOString() }] } },
    { cat: 'Annonces', icon: '🛑', name: 'Maintenance / Panne', desc: 'Interruption de service',
        payload: { content: '@everyone 🛑 Maintenance en cours', embeds: [{ title: '🛑 Maintenance — [Nom du service]', description: 'Une maintenance est en cours. Nous nous excusons pour la gêne.', color: 0xED4245, fields: [{ name: '⏰ Début', value: '[Heure]', inline: true }, { name: '⏳ Durée estimée', value: '[Durée]', inline: true }, { name: '📢 Statut', value: '🔴 En cours / 🟡 Dégradé / 🟢 Résolu', inline: false }], footer: { text: 'Nous communiquerons sur la résolution.' }, timestamp: new Date().toISOString() }] } },
    { cat: 'Annonces', icon: '✅', name: 'Service rétabli', desc: 'Fin de maintenance ou résolution',
        payload: { content: '', embeds: [{ title: '✅ Service rétabli — [Nom du service]', description: 'La maintenance est terminée. Merci pour votre patience !', color: 0x57F287, fields: [{ name: '⏱ Durée totale', value: '[X] heure(s)', inline: true }, { name: '✅ Statut', value: '🟢 Opérationnel', inline: true }], footer: { text: 'Service rétabli le [date]' }, timestamp: new Date().toISOString() }] } },
    { cat: 'Annonces', icon: '💼', name: 'Recrutement', desc: 'Offre de staff / modérateurs',
        payload: { content: '', embeds: [{ title: '💼 Recrutement — [Poste]', description: 'Nous recrutons de nouveaux membres pour renforcer notre équipe !', color: 0xFEE75C, fields: [{ name: '🎯 Poste recherché', value: '[Modérateur / Admin / Helper]', inline: true }, { name: '👥 Places disponibles', value: '[X] poste(s)', inline: true }, { name: '📋 Prérequis', value: '• Être membre depuis [durée]\n• Disponible [X]h/semaine', inline: false }, { name: '📝 Candidater', value: 'Remplissez le formulaire : [lien]', inline: false }], footer: { text: "Rejoignez l'équipe !" } }] } },
];
const allCategories = computed(() => ['Tous', ...new Set(presetTemplates.map(t => t.cat)), 'Mes templates']);
const filteredPresets = computed(() => {
    if (activeCat.value === 'Mes templates')
        return [];
    if (activeCat.value === 'Tous')
        return presetTemplates;
    return presetTemplates.filter(t => t.cat === activeCat.value);
});
const filteredUserTemplates = computed(() => {
    if (activeCat.value === 'Tous' || activeCat.value === 'Mes templates')
        return props.userTemplates;
    return [];
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tpl-cat-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-cat-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tpl-categories" },
    });
    for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.allCategories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.activeCat = cat;
                } },
            key: (cat),
            ...{ class: (['tpl-cat-btn', __VLS_ctx.activeCat === cat ? 'active' : '']) },
        });
        (cat);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tpl-grid mt-2" },
    });
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.filteredUserTemplates))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.loadTemplate(t);
                } },
            key: (`user-${t.id}`),
            ...{ class: "tpl-card user-tpl" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2 mb-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ style: {} },
            ...{ style: ({ background: t.preview_color }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
            ...{ style: {} },
        });
        (t.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "badge badge-info" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: {} },
        });
        (t.description);
    }
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.filteredPresets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.modelValue))
                        return;
                    __VLS_ctx.$emit('load-preset', t.payload);
                } },
            key: (`preset-${t.name}`),
            ...{ class: "tpl-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tpl-card-icon" },
        });
        (t.icon);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
            ...{ style: {} },
        });
        (t.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: {} },
        });
        (t.desc);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "badge badge-success" },
            ...{ style: {} },
        });
    }
    if (!__VLS_ctx.filteredUserTemplates.length && !__VLS_ctx.filteredPresets.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.modelValue))
                    return;
                __VLS_ctx.$emit('update:modelValue', false);
            } },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-categories']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-card']} */ ;
/** @type {__VLS_StyleScopedClasses['user-tpl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-info']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-success']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loadTemplate: loadTemplate,
            activeCat: activeCat,
            allCategories: allCategories,
            filteredPresets: filteredPresets,
            filteredUserTemplates: filteredUserTemplates,
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
