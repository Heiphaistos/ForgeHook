/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EmbedBuilder from '../components/embed/EmbedBuilder.vue';
import EmbedPreview from '../components/preview/EmbedPreview.vue';
import api from '../api/client';
import { emptyEmbed } from '../types/discord';
const route = useRoute();
const router = useRouter();
const previewMode = ref(false);
const saving = ref(false);
const saveMsg = ref('');
const showTplModal = ref(false);
const tutorial = ref({ id: 0, title: '', description: '', blocks: [], published: 0 });
const blockTypes = [
    { type: 'text', icon: '📝', label: 'Texte' },
    { type: 'image', icon: '🖼', label: 'Image' },
    { type: 'video', icon: '🎬', label: 'Vidéo' },
    { type: 'code', icon: '💻', label: 'Code' },
    { type: 'embed', icon: '📦', label: 'Embed Discord' },
    { type: 'callout', icon: '💡', label: 'Callout' },
    { type: 'separator', icon: '─', label: 'Séparateur' },
];
const blockTypeLabels = {
    text: '📝 Texte', image: '🖼 Image', video: '🎬 Vidéo',
    code: '💻 Code', embed: '📦 Embed', callout: '💡 Callout', separator: '─ Séparateur'
};
function blockLabel(t) { return blockTypeLabels[t] ?? t; }
const tutorialTemplates = [
    {
        icon: '🎮', name: 'Guide de jeu', desc: 'Présentation, prérequis, étapes, astuces',
        blocks: [
            mk('text', '## 🎮 Présentation\nCe guide explique comment **[nom du mécanisme]** fonctionne dans le jeu.'),
            mk('image', { url: '', caption: 'Image du jeu' }),
            mk('callout', { type: 'info', text: '**Prérequis** : Niveau minimum requis, équipements nécessaires...' }),
            mk('text', '## 📋 Étapes\n1. Première étape\n2. Deuxième étape\n3. Troisième étape'),
            mk('image', { url: '', caption: 'Screenshot étape' }),
            mk('callout', { type: 'success', text: '**Astuce pro** : Conseil pour optimiser cette étape.' }),
            mk('text', '## ⚠️ Erreurs communes\n- Erreur 1 : explication\n- Erreur 2 : explication'),
            mk('callout', { type: 'warning', text: '**Attention** : Point important à ne pas rater.' }),
            mk('text', '## 🏆 Conclusion\nFélicitations ! Vous maîtrisez maintenant [mécanisme].\n\n*Guide rédigé par [auteur]*'),
        ]
    },
    {
        icon: '🎬', name: 'Critique de film/série', desc: 'Synopsis, avis, notation, spoilers',
        blocks: [
            mk('image', { url: '', caption: 'Affiche officielle' }),
            mk('text', '## 🎬 [Titre du film/série]\n\n**Genre :** Action / Aventure\n**Durée :** 2h15\n**Sortie :** 2024\n**Réalisateur :** [Nom]'),
            mk('separator', null),
            mk('text', '## 📖 Synopsis\n[Description du film sans spoiler majeur — 2-3 paragraphes maximum]'),
            mk('callout', { type: 'info', text: '**Avertissement spoilers** : La suite contient des révélations importantes sur le film.' }),
            mk('text', '## 🧠 Analyse\n[Vos impressions, points forts, points faibles]'),
            mk('text', '## ⭐ Note finale\n\n| Critère | Note |\n|---------|------|\n| Scénario | ★★★★☆ |\n| Effets visuels | ★★★★★ |\n| Musique | ★★★☆☆ |\n| **Global** | **★★★★☆ 8/10** |'),
            mk('callout', { type: 'success', text: '**Verdict** : À voir absolument ! / Attendez le streaming.' }),
        ]
    },
    {
        icon: '📰', name: 'Patch Notes / MàJ', desc: 'Changelog, nouveautés, corrections',
        blocks: [
            mk('text', '# 🆕 Patch Notes v[X.Y.Z]\n*Date de mise à jour : [date]*'),
            mk('callout', { type: 'info', text: 'Cette mise à jour apporte [résumé en une phrase].' }),
            mk('text', '## ✨ Nouvelles fonctionnalités\n- **Feature 1** : Description\n- **Feature 2** : Description\n- **Feature 3** : Description'),
            mk('text', '## 🐛 Corrections de bugs\n- Fix : [Bug corrigé]\n- Fix : [Bug corrigé]\n- Fix : [Bug corrigé]'),
            mk('text', '## ⚡ Améliorations de performance\n- [Amélioration 1]\n- [Amélioration 2]'),
            mk('callout', { type: 'warning', text: '**Breaking changes** : [Si applicable — changements incompatibles avec la version précédente]' }),
            mk('code', { language: 'bash', code: '# Pour mettre à jour\nnpm install\nnpm run migrate', filename: 'update.sh' }),
        ]
    },
    {
        icon: '🏆', name: 'Annonce de tournoi', desc: 'Présentation, règles, inscription, prix',
        blocks: [
            mk('text', '# 🏆 Tournoi [Nom du jeu] — [Édition]\n**Du [date début] au [date fin]**'),
            mk('image', { url: '', caption: 'Bannière du tournoi' }),
            mk('text', '## 📋 Informations générales\n- **Format** : [1v1 / 5v5 / Battle Royale]\n- **Plateformes** : [PC / Console]\n- **Inscriptions** : Ouvertes jusqu\'au [date]'),
            mk('callout', { type: 'info', text: '**Prix total** : [Montant] € répartis entre les 3 premiers.' }),
            mk('text', '## 📜 Règles\n1. [Règle 1]\n2. [Règle 2]\n3. [Règle 3]\n4. Comportement fair-play obligatoire'),
            mk('text', '## 🎁 Récompenses\n| Place | Récompense |\n|-------|------------|\n| 🥇 1er | [Prix] |\n| 🥈 2ème | [Prix] |\n| 🥉 3ème | [Prix] |'),
            mk('callout', { type: 'success', text: '**S\'inscrire** : [Lien d\'inscription ou commande Discord]' }),
        ]
    },
    {
        icon: '💡', name: 'Tutoriel technique', desc: 'Installation, configuration, utilisation',
        blocks: [
            mk('text', '# 💡 Comment [faire quelque chose]\n\n**Difficulté** : ⭐⭐☆ Intermédiaire\n**Temps estimé** : ~15 minutes'),
            mk('callout', { type: 'info', text: '**Prérequis** : Listez les logiciels/dépendances nécessaires avant de commencer.' }),
            mk('text', '## 1️⃣ Installation\nDescription de l\'étape d\'installation.'),
            mk('code', { language: 'bash', code: '# Commandes d\'installation\nnpm install package-name\n# ou\npip install package-name', filename: 'install.sh' }),
            mk('text', '## 2️⃣ Configuration\nDescription de la configuration.'),
            mk('code', { language: 'json', code: '{\n  "setting1": "value1",\n  "setting2": true\n}', filename: 'config.json' }),
            mk('text', '## 3️⃣ Utilisation\nDescription de l\'utilisation.'),
            mk('callout', { type: 'success', text: '**Ça marche ?** Si vous voyez [résultat], c\'est bon !' }),
            mk('callout', { type: 'danger', text: '**Problème ?** Vérifiez [point commun d\'erreur]. Ouvrez une issue si le problème persiste.' }),
        ]
    },
    {
        icon: '📣', name: 'Annonce serveur', desc: 'Annonce générale pour le serveur Discord',
        blocks: [
            mk('text', '# 📣 [Titre de l\'annonce]\n\nBonjour à tous !'),
            mk('text', '[Corps de votre annonce — expliquez en détail ce que vous voulez communiquer à votre communauté.]'),
            mk('callout', { type: 'info', text: 'Points importants à retenir :  \n- Point 1\n- Point 2\n- Point 3' }),
            mk('text', '**Date d\'effet** : [date]\n**Concerne** : [qui est concerné]\n\n— L\'équipe de modération'),
        ]
    },
];
function mk(type, content) {
    return { id: crypto.randomUUID(), type: type, content };
}
function applyTemplate(tpl) {
    if (tutorial.value.blocks.length > 0 && !confirm('Remplacer les blocs existants par ce template ?'))
        return;
    tutorial.value.title = tutorial.value.title || tpl.name;
    tutorial.value.blocks = tpl.blocks.map(b => ({ ...b, id: crypto.randomUUID() }));
    showTplModal.value = false;
}
onMounted(async () => {
    const id = route.params.id;
    if (id && id !== 'new') {
        const { data } = await api.get(`/tutorials/${id}`);
        tutorial.value = data;
    }
});
function defaultContent(type) {
    const map = {
        text: '',
        image: { url: '', caption: '' },
        video: { url: '', caption: '' },
        code: { language: 'js', code: '', filename: '' },
        embed: emptyEmbed(),
        callout: { type: 'info', text: '' },
        separator: null,
    };
    return map[type] ?? '';
}
function addBlock(type) {
    const block = {
        id: crypto.randomUUID(),
        type: type,
        content: defaultContent(type),
    };
    tutorial.value.blocks.push(block);
}
function removeBlock(i) { tutorial.value.blocks.splice(i, 1); }
function moveBlock(i, dir) {
    const b = tutorial.value.blocks;
    const j = i + dir;
    if (j < 0 || j >= b.length)
        return;
    [b[i], b[j]] = [b[j], b[i]];
}
function duplicate(i) {
    const copy = JSON.parse(JSON.stringify(tutorial.value.blocks[i]));
    copy.id = crypto.randomUUID();
    tutorial.value.blocks.splice(i + 1, 0, copy);
}
async function save() {
    if (!tutorial.value.title.trim()) {
        saveMsg.value = '⚠️ Titre requis';
        setTimeout(() => saveMsg.value = '', 3000);
        return;
    }
    saving.value = true;
    try {
        if (tutorial.value.id) {
            await api.put(`/tutorials/${tutorial.value.id}`, tutorial.value);
        }
        else {
            const { data } = await api.post('/tutorials', tutorial.value);
            tutorial.value.id = data.id;
            router.replace(`/tutorials/${data.id}`);
        }
        saveMsg.value = '✅ Tutoriel sauvegardé !';
        setTimeout(() => { saveMsg.value = ''; }, 3000);
    }
    catch (e) {
        saveMsg.value = `⚠️ Erreur : ${e?.response?.data?.error || 'Problème lors de la sauvegarde'}`;
        setTimeout(() => { saveMsg.value = ''; }, 5000);
    }
    finally {
        saving.value = false;
    }
}
function renderText(text) {
    if (!text)
        return '';
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
function isYoutube(url) {
    return !!url && (url.includes('youtube.com') || url.includes('youtu.be'));
}
function youtubeEmbed(url) {
    const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    return `https://www.youtube.com/embed/${id}`;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['publish-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['img-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['add-block-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tutorial-article']} */ ;
/** @type {__VLS_StyleScopedClasses['tutorial-article']} */ ;
/** @type {__VLS_StyleScopedClasses['img-render']} */ ;
/** @type {__VLS_StyleScopedClasses['code-render']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tutorial-editor" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-topbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Titre du tutoriel...",
    ...{ class: "fh-input title-input" },
});
(__VLS_ctx.tutorial.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "topbar-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showTplModal = true;
        } },
    ...{ class: "btn-secondary" },
    title: "Templates pré-faits",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.previewMode = !__VLS_ctx.previewMode;
        } },
    ...{ class: "btn-secondary" },
});
(__VLS_ctx.previewMode ? '✏️ Éditer' : '👁 Aperçu');
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "publish-toggle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.tutorial.published = __VLS_ctx.tutorial.published ? 0 : 1;
        } },
    type: "checkbox",
    checked: (!!__VLS_ctx.tutorial.published),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.save) },
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.saving),
});
(__VLS_ctx.saving ? 'Sauvegarde...' : '💾 Sauvegarder');
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/tutorials",
    ...{ class: "btn-secondary" },
}));
const __VLS_2 = __VLS_1({
    to: "/tutorials",
    ...{ class: "btn-secondary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    placeholder: "Description courte (optionnel)",
    ...{ class: "fh-input desc-input" },
});
(__VLS_ctx.tutorial.description);
if (!__VLS_ctx.previewMode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "blocks-area" },
    });
    for (const [block, i] of __VLS_getVForSourceType((__VLS_ctx.tutorial.blocks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (block.id),
            ...{ class: "block-wrapper" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "block-controls" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "drag-handle" },
            title: "Déplacer",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "block-type-label" },
        });
        (__VLS_ctx.blockLabel(block.type));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "block-btns" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.previewMode))
                        return;
                    __VLS_ctx.duplicate(i);
                } },
            title: "Dupliquer",
            ...{ class: "ctrl-btn" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.previewMode))
                        return;
                    __VLS_ctx.moveBlock(i, -1);
                } },
            disabled: (i === 0),
            ...{ class: "ctrl-btn" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.previewMode))
                        return;
                    __VLS_ctx.moveBlock(i, 1);
                } },
            disabled: (i === __VLS_ctx.tutorial.blocks.length - 1),
            ...{ class: "ctrl-btn" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.previewMode))
                        return;
                    __VLS_ctx.removeBlock(i);
                } },
            ...{ class: "ctrl-btn danger" },
        });
        if (block.type === 'text') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                value: (block.content),
                placeholder: "Texte — **gras**, *italique*, `code`, [lien](url), ~~barré~~",
                ...{ class: "fh-textarea block-textarea" },
                rows: "5",
            });
        }
        else if (block.type === 'image') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                placeholder: "URL de l'image",
                ...{ class: "fh-input" },
            });
            (block.content.url);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                placeholder: "Légende (optionnel)",
                ...{ class: "fh-input mt-1" },
            });
            (block.content.caption);
            if (block.content.url) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "img-preview" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    ...{ onError: (...[$event]) => {
                            if (!(!__VLS_ctx.previewMode))
                                return;
                            if (!!(block.type === 'text'))
                                return;
                            if (!(block.type === 'image'))
                                return;
                            if (!(block.content.url))
                                return;
                            $event.target.style.display = 'none';
                        } },
                    src: (block.content.url),
                    alt: "",
                });
            }
        }
        else if (block.type === 'video') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                placeholder: "URL vidéo (YouTube, MP4 direct...)",
                ...{ class: "fh-input" },
            });
            (block.content.url);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                placeholder: "Légende (optionnel)",
                ...{ class: "fh-input mt-1" },
            });
            (block.content.caption);
            if (__VLS_ctx.isYoutube(block.content.url)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "video-embed-preview" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.iframe)({
                    src: (__VLS_ctx.youtubeEmbed(block.content.url)),
                    allowfullscreen: true,
                    width: "480",
                    height: "270",
                });
            }
        }
        else if (block.type === 'code') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "row mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                placeholder: "js",
                ...{ class: "fh-input" },
                ...{ style: {} },
            });
            (block.content.language);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                placeholder: "Nom du fichier (optionnel)",
                ...{ class: "fh-input" },
            });
            (block.content.filename);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                value: (block.content.code),
                placeholder: "// Code ici",
                ...{ class: "fh-textarea code-ta" },
                rows: "8",
                spellcheck: "false",
            });
        }
        else if (block.type === 'embed') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content embed-in-tutorial" },
            });
            /** @type {[typeof EmbedBuilder, ]} */ ;
            // @ts-ignore
            const __VLS_4 = __VLS_asFunctionalComponent(EmbedBuilder, new EmbedBuilder({
                modelValue: (block.content),
            }));
            const __VLS_5 = __VLS_4({
                modelValue: (block.content),
            }, ...__VLS_functionalComponentArgsRest(__VLS_4));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "embed-preview-inline" },
            });
            /** @type {[typeof EmbedPreview, ]} */ ;
            // @ts-ignore
            const __VLS_7 = __VLS_asFunctionalComponent(EmbedPreview, new EmbedPreview({
                embed: (block.content),
            }));
            const __VLS_8 = __VLS_7({
                embed: (block.content),
            }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        }
        else if (block.type === 'separator') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content separator-block" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.hr)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: {} },
            });
        }
        else if (block.type === 'callout') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "block-content" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (block.content.type),
                ...{ class: "fh-select mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "info",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "warning",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "success",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "danger",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                value: (block.content.text),
                placeholder: "Contenu du callout...",
                ...{ class: "fh-textarea" },
                rows: "3",
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "add-palette" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "palette-label" },
    });
    for (const [bt] of __VLS_getVForSourceType((__VLS_ctx.blockTypes))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.previewMode))
                        return;
                    __VLS_ctx.addBlock(bt.type);
                } },
            key: (bt.type),
            ...{ class: "add-block-btn" },
        });
        (bt.icon);
        (bt.label);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-render" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "tutorial-article" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.tutorial.title);
    if (__VLS_ctx.tutorial.description) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "article-desc" },
        });
        (__VLS_ctx.tutorial.description);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.hr)({});
    for (const [block] of __VLS_getVForSourceType((__VLS_ctx.tutorial.blocks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (block.id),
            ...{ class: "rendered-block" },
        });
        if (block.type === 'text') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "text-render" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderText(block.content)) }, null, null);
        }
        else if (block.type === 'image') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.figure, __VLS_intrinsicElements.figure)({
                ...{ class: "img-render" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (block.content.url),
                alt: "",
            });
            if (block.content.caption) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.figcaption, __VLS_intrinsicElements.figcaption)({});
                (block.content.caption);
            }
        }
        else if (block.type === 'video') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "video-render" },
            });
            if (__VLS_ctx.isYoutube(block.content.url)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.iframe)({
                    src: (__VLS_ctx.youtubeEmbed(block.content.url)),
                    allowfullscreen: true,
                    width: "640",
                    height: "360",
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.video)({
                    src: (block.content.url),
                    controls: true,
                    ...{ style: {} },
                });
            }
            if (block.content.caption) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "caption" },
                });
                (block.content.caption);
            }
        }
        else if (block.type === 'code') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "code-render" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "code-header" },
            });
            if (block.content.filename) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (block.content.filename);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "code-lang" },
            });
            (block.content.language);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
            (block.content.code);
        }
        else if (block.type === 'embed') {
            /** @type {[typeof EmbedPreview, ]} */ ;
            // @ts-ignore
            const __VLS_10 = __VLS_asFunctionalComponent(EmbedPreview, new EmbedPreview({
                embed: (block.content),
            }));
            const __VLS_11 = __VLS_10({
                embed: (block.content),
            }, ...__VLS_functionalComponentArgsRest(__VLS_10));
        }
        else if (block.type === 'separator') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.hr)({});
        }
        else if (block.type === 'callout') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: (['callout', `callout-${block.content.type}`]) },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderText(block.content.text)) }, null, null);
        }
    }
}
if (__VLS_ctx.saveMsg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "save-toast" },
    });
    (__VLS_ctx.saveMsg);
}
if (__VLS_ctx.showTplModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTplModal))
                    return;
                __VLS_ctx.showTplModal = false;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal tpl-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tpl-grid" },
    });
    for (const [tpl] of __VLS_getVForSourceType((__VLS_ctx.tutorialTemplates))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showTplModal))
                        return;
                    __VLS_ctx.applyTemplate(tpl);
                } },
            key: (tpl.name),
            ...{ class: "tpl-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tpl-icon" },
        });
        (tpl.icon);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tpl-name" },
        });
        (tpl.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tpl-desc" },
        });
        (tpl.desc);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTplModal))
                    return;
                __VLS_ctx.showTplModal = false;
            } },
        ...{ class: "btn-secondary" },
    });
}
/** @type {__VLS_StyleScopedClasses['tutorial-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['title-input']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['publish-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['desc-input']} */ ;
/** @type {__VLS_StyleScopedClasses['blocks-area']} */ ;
/** @type {__VLS_StyleScopedClasses['block-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['block-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['drag-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['block-type-label']} */ ;
/** @type {__VLS_StyleScopedClasses['block-btns']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['ctrl-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['block-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['img-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['video-embed-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['code-ta']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-in-tutorial']} */ ;
/** @type {__VLS_StyleScopedClasses['embed-preview-inline']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['separator-block']} */ ;
/** @type {__VLS_StyleScopedClasses['block-content']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['add-palette']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-label']} */ ;
/** @type {__VLS_StyleScopedClasses['add-block-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-render']} */ ;
/** @type {__VLS_StyleScopedClasses['tutorial-article']} */ ;
/** @type {__VLS_StyleScopedClasses['article-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['rendered-block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-render']} */ ;
/** @type {__VLS_StyleScopedClasses['img-render']} */ ;
/** @type {__VLS_StyleScopedClasses['video-render']} */ ;
/** @type {__VLS_StyleScopedClasses['caption']} */ ;
/** @type {__VLS_StyleScopedClasses['code-render']} */ ;
/** @type {__VLS_StyleScopedClasses['code-header']} */ ;
/** @type {__VLS_StyleScopedClasses['code-lang']} */ ;
/** @type {__VLS_StyleScopedClasses['save-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-name']} */ ;
/** @type {__VLS_StyleScopedClasses['tpl-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            EmbedBuilder: EmbedBuilder,
            EmbedPreview: EmbedPreview,
            previewMode: previewMode,
            saving: saving,
            saveMsg: saveMsg,
            showTplModal: showTplModal,
            tutorial: tutorial,
            blockTypes: blockTypes,
            blockLabel: blockLabel,
            tutorialTemplates: tutorialTemplates,
            applyTemplate: applyTemplate,
            addBlock: addBlock,
            removeBlock: removeBlock,
            moveBlock: moveBlock,
            duplicate: duplicate,
            save: save,
            renderText: renderText,
            isYoutube: isYoutube,
            youtubeEmbed: youtubeEmbed,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
