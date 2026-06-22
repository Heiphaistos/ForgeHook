/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { FONT_LIST, CATEGORIES, convertFont } from '../utils/discordFonts';
import { useEmbedStore } from '../stores/embed';
const embedStore = useEmbedStore();
const route = useRoute();
const inputText = ref('');
const copiedFont = ref('');
const toast = ref('');
const activeCategory = ref('Tous');
const selectedLiveFont = ref(FONT_LIST[0].name);
const liveInput = ref('');
const hasEmbedTarget = computed(() => !!route.query.field);
const targetField = computed(() => route.query.field);
const filteredFonts = computed(() => activeCategory.value === 'Tous' ? FONT_LIST : FONT_LIST.filter(f => f.category === activeCategory.value));
const selectedLiveFontDef = computed(() => FONT_LIST.find(f => f.name === selectedLiveFont.value) ?? FONT_LIST[0]);
const liveOutput = computed(() => liveInput.value ? convertFont(liveInput.value, selectedLiveFontDef.value) : '');
function showToast(msg) {
    toast.value = msg;
    setTimeout(() => { toast.value = ''; }, 2200);
}
async function copyFont(font) {
    if (!inputText.value) {
        showToast('Entrez du texte!');
        return;
    }
    const result = convertFont(inputText.value, font);
    await navigator.clipboard.writeText(result);
    copiedFont.value = font.name;
    setTimeout(() => { copiedFont.value = ''; }, 2000);
    showToast('Copie: ' + font.name);
}
async function copyLive() {
    if (!liveOutput.value)
        return;
    await navigator.clipboard.writeText(liveOutput.value);
    showToast('Copie!');
}
function injectToEmbed(font) {
    if (!inputText.value)
        return;
    injectIntoEmbedStore(convertFont(inputText.value, font));
}
function sendLiveToEmbed() {
    if (!liveOutput.value)
        return;
    injectIntoEmbedStore(liveOutput.value);
}
function injectIntoEmbedStore(text) {
    const field = targetField.value;
    if (!embedStore.message.embeds.length)
        embedStore.addEmbed();
    const embed = embedStore.message.embeds[0];
    if (field === 'title')
        embed.title = text;
    else if (field === 'description')
        embed.description = text;
    else if (field === 'author') {
        embed.author = { name: text, url: '', icon_url: '' };
    }
    else if (field === 'footer') {
        embed.footer = { text, icon_url: embed.footer?.icon_url ?? '' };
    }
    else
        embed.description = (embed.description ?? '') + text;
    showToast('Insere dans Embed Builder!');
}
async function pasteFromClipboard() {
    try {
        inputText.value = await navigator.clipboard.readText();
    }
    catch {
        showToast('Impossible de lire le presse-papiers.');
    }
}
function insertSpecial(char) {
    inputText.value += char;
    navigator.clipboard.writeText(char);
    showToast('Copie!');
}
// Special characters defined with code points to avoid TS parser issues with smart quotes
function cp(...codes) { return codes.map(c => String.fromCodePoint(c)).join(''); }
const specialGroups = [
    {
        name: 'Fleches',
        chars: [
            { char: '→', label: 'Fleche droite' }, { char: '←', label: 'Fleche gauche' },
            { char: '↑', label: 'Fleche haut' }, { char: '↓', label: 'Fleche bas' },
            { char: '⇒', label: 'Double droite' }, { char: '⇔', label: 'Double sens' },
            { char: '↗', label: 'Diagonale haut-droite' }, { char: '↘', label: 'Diagonale bas-droite' },
            { char: '➜', label: 'Fleche stylee' }, { char: '➤', label: 'Triangle fleche' },
            { char: '➡', label: 'Fleche pleine' }, { char: '⬆', label: 'Haut plein' },
            { char: '⬇', label: 'Bas plein' }, { char: '↺', label: 'Rotation gauche' }, { char: '↻', label: 'Rotation droite' },
        ],
    },
    {
        name: 'Separateurs et Bordures',
        chars: [
            { char: '─', label: 'Ligne horizontale' }, { char: '━', label: 'Ligne epaisse' },
            { char: '═', label: 'Double ligne' }, { char: '│', label: 'Ligne verticale' },
            { char: '┃', label: 'Verticale epaisse' }, { char: '·', label: 'Point median' },
            { char: '•', label: 'Puce' }, { char: '◆', label: 'Losange plein' },
            { char: '◇', label: 'Losange vide' }, { char: '▸', label: 'Triangle' },
            { char: '◦', label: 'Puce creuse' }, { char: '▪', label: 'Carre plein' },
            { char: '▫', label: 'Carre vide' }, { char: '◉', label: 'Cercle pointe' },
            { char: '║', label: 'Double vertical' }, { char: '◈', label: 'Losange cercle' },
        ],
    },
    {
        name: 'Etoiles et Formes',
        chars: [
            { char: '★', label: 'Etoile pleine' }, { char: '☆', label: 'Etoile vide' },
            { char: '✦', label: 'Etoile 4 branches' }, { char: '✧', label: 'Etoile 4 br. vide' },
            { char: '✨', label: 'Sparkles' }, { char: '🌟', label: 'Etoile brillante' },
            { char: '💫', label: 'Etoile tournante' }, { char: '⭐', label: 'Etoile' },
            { char: '❤', label: 'Coeur rouge' }, { char: '♥', label: 'Coeur carte' },
            { char: '♦', label: 'Carreau' }, { char: '♣', label: 'Trefle' },
            { char: '♠', label: 'Pique' }, { char: '♛', label: 'Reine echecs' },
            { char: '♜', label: 'Tour echecs' }, { char: '♞', label: 'Cavalier echecs' },
        ],
    },
    {
        name: 'Maths et Symboles',
        chars: [
            { char: '∞', label: 'Infini' }, { char: '≈', label: 'Environ' },
            { char: '≠', label: 'Different' }, { char: '≤', label: 'Inferieur ou egal' },
            { char: '≥', label: 'Superieur ou egal' }, { char: '±', label: 'Plus ou moins' },
            { char: '×', label: 'Multiplie' }, { char: '÷', label: 'Divise' },
            { char: '∑', label: 'Somme' }, { char: '∏', label: 'Produit' },
            { char: '√', label: 'Racine carree' }, { char: 'π', label: 'Pi' },
            { char: '°', label: 'Degre' }, { char: '‰', label: 'Pour mille' },
            { char: '©', label: 'Copyright' }, { char: '®', label: 'Marque deposee' },
            { char: '™', label: 'Marque commerciale' }, { char: '§', label: 'Paragraphe' },
        ],
    },
    {
        name: 'Guillemets et Ponctuation',
        chars: [
            { char: '«', label: 'Guillemet ouvrant' }, { char: '»', label: 'Guillemet fermant' },
            { char: '‹', label: 'G. simple ouvrant' }, { char: '›', label: 'G. simple fermant' },
            // U+201C " et U+201D " via fromCodePoint pour eviter l'ambiguite TS
            { char: cp(0x201C), label: 'Guillemet double ouvrant' }, { char: cp(0x201D), label: 'Guillemet double fermant' },
            // U+2018 et U+2019 (apostrophes courbes)
            { char: cp(0x2018), label: 'Apostrophe ouvrante' }, { char: cp(0x2019), label: 'Apostrophe fermante' },
            { char: '…', label: 'Points de suspension' }, { char: '—', label: 'Tiret long' },
            { char: '–', label: 'Tiret moyen' }, { char: '‑', label: 'Trait union insecable' },
            { char: cp(0x200B), label: 'Espace zero largeur' }, { char: cp(0x00A0), label: 'Espace insecable' },
        ],
    },
    {
        name: 'Grec et Lettres speciales',
        chars: [
            { char: 'α', label: 'Alpha' }, { char: 'β', label: 'Beta' }, { char: 'γ', label: 'Gamma' },
            { char: 'δ', label: 'Delta' }, { char: 'ε', label: 'Epsilon' }, { char: 'ζ', label: 'Zeta' },
            { char: 'η', label: 'Eta' }, { char: 'θ', label: 'Theta' }, { char: 'λ', label: 'Lambda' },
            { char: 'μ', label: 'Mu' }, { char: 'ξ', label: 'Xi' }, { char: 'σ', label: 'Sigma' },
            { char: 'φ', label: 'Phi' }, { char: 'ψ', label: 'Psi' }, { char: 'ω', label: 'Omega' },
            { char: 'Ω', label: 'Omega maj.' }, { char: 'Δ', label: 'Delta maj.' },
            { char: 'Λ', label: 'Lambda maj.' }, { char: 'Σ', label: 'Sigma maj.' }, { char: 'Ψ', label: 'Psi maj.' },
        ],
    },
    {
        name: 'Exposants et Indices',
        chars: [
            { char: '⁰', label: '^0' }, { char: '¹', label: '^1' }, { char: '²', label: '^2' },
            { char: '³', label: '^3' }, { char: '⁴', label: '^4' }, { char: '⁵', label: '^5' },
            { char: '⁶', label: '^6' }, { char: '⁷', label: '^7' }, { char: '⁸', label: '^8' },
            { char: '⁹', label: '^9' }, { char: '₀', label: '_0' }, { char: '₁', label: '_1' },
            { char: '₂', label: '_2' }, { char: '₃', label: '_3' }, { char: '₄', label: '_4' },
            { char: 'ⁿ', label: '^n' }, { char: 'ˢ', label: '^s' },
        ],
    },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['fonts-header']} */ ;
/** @type {__VLS_StyleScopedClasses['font-card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['inject-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['live-section']} */ ;
/** @type {__VLS_StyleScopedClasses['live-output']} */ ;
/** @type {__VLS_StyleScopedClasses['special-section']} */ ;
/** @type {__VLS_StyleScopedClasses['special-char-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['live-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fonts-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fonts-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.activeCategory),
    ...{ class: "fh-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "Tous",
});
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.CATEGORIES))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (cat),
        value: (cat),
    });
    (cat);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-zone" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "textarea-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.inputText),
    placeholder: "Ecris ton texte ici... il sera converti en temps reel dans toutes les polices",
    ...{ class: "fh-textarea main-textarea" },
    rows: "3",
    autofocus: true,
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.inputText = '';
        } },
    ...{ class: "btn-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.pasteFromClipboard) },
    ...{ class: "btn-secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "input-hint" },
});
(__VLS_ctx.inputText.length);
if (__VLS_ctx.inputText) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "discord-preview-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "discord-avatar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "discord-bubble" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "discord-user" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "discord-text" },
    });
    (__VLS_ctx.inputText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-label" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fonts-grid" },
});
for (const [font] of __VLS_getVForSourceType((__VLS_ctx.filteredFonts))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.copyFont(font);
            } },
        key: (font.name),
        ...{ class: "font-card" },
        ...{ class: ({ 'recently-copied': __VLS_ctx.copiedFont === font.name }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "font-card-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "font-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-name" },
    });
    (font.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-category" },
    });
    (font.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "font-icon" },
    });
    (font.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "font-preview" },
        ...{ class: ({ empty: !__VLS_ctx.inputText }) },
    });
    (__VLS_ctx.inputText ? __VLS_ctx.convertFont(__VLS_ctx.inputText, font) : font.desc);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "font-card-bottom" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.copyFont(font);
            } },
        ...{ class: "copy-btn" },
        ...{ class: ({ copied: __VLS_ctx.copiedFont === font.name }) },
    });
    (__VLS_ctx.copiedFont === font.name ? '✅ Copie!' : '📋 Copier');
    if (__VLS_ctx.hasEmbedTarget) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.hasEmbedTarget))
                        return;
                    __VLS_ctx.injectToEmbed(font);
                } },
            ...{ class: "inject-btn" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "live-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "live-controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.selectedLiveFont),
    ...{ class: "fh-select" },
});
for (const [f] of __VLS_getVForSourceType((__VLS_ctx.FONT_LIST))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (f.name),
        value: (f.name),
    });
    (f.icon);
    (f.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.copyLive) },
    ...{ class: "btn-primary" },
});
if (__VLS_ctx.hasEmbedTarget) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.sendLiveToEmbed) },
        ...{ class: "btn-secondary" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "live-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.liveInput),
    placeholder: "Tape ici...",
    ...{ class: "fh-textarea" },
    rows: "4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "fh-label" },
});
(__VLS_ctx.selectedLiveFont);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.copyLive) },
    ...{ class: "live-output" },
});
(__VLS_ctx.liveOutput || '...');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "special-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
for (const [group] of __VLS_getVForSourceType((__VLS_ctx.specialGroups))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (group.name),
        ...{ class: "special-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "special-group-name" },
    });
    (group.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "special-chars" },
    });
    for (const [c] of __VLS_getVForSourceType((group.chars))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.insertSpecial(c.char);
                } },
            key: (c.label),
            ...{ class: "special-char-btn" },
            title: (c.label),
        });
        (c.char);
    }
}
if (__VLS_ctx.toast) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "toast" },
    });
    (__VLS_ctx.toast);
}
/** @type {__VLS_StyleScopedClasses['fonts-page']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['input-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea-row']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['main-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['input-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['input-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['discord-preview-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['discord-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['discord-bubble']} */ ;
/** @type {__VLS_StyleScopedClasses['discord-user']} */ ;
/** @type {__VLS_StyleScopedClasses['discord-text']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fonts-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['font-card']} */ ;
/** @type {__VLS_StyleScopedClasses['font-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['font-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['font-name']} */ ;
/** @type {__VLS_StyleScopedClasses['font-category']} */ ;
/** @type {__VLS_StyleScopedClasses['font-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['font-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['font-card-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['inject-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['live-section']} */ ;
/** @type {__VLS_StyleScopedClasses['live-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['live-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-label']} */ ;
/** @type {__VLS_StyleScopedClasses['live-output']} */ ;
/** @type {__VLS_StyleScopedClasses['special-section']} */ ;
/** @type {__VLS_StyleScopedClasses['special-group']} */ ;
/** @type {__VLS_StyleScopedClasses['special-group-name']} */ ;
/** @type {__VLS_StyleScopedClasses['special-chars']} */ ;
/** @type {__VLS_StyleScopedClasses['special-char-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FONT_LIST: FONT_LIST,
            CATEGORIES: CATEGORIES,
            convertFont: convertFont,
            inputText: inputText,
            copiedFont: copiedFont,
            toast: toast,
            activeCategory: activeCategory,
            selectedLiveFont: selectedLiveFont,
            liveInput: liveInput,
            hasEmbedTarget: hasEmbedTarget,
            filteredFonts: filteredFonts,
            liveOutput: liveOutput,
            copyFont: copyFont,
            copyLive: copyLive,
            injectToEmbed: injectToEmbed,
            sendLiveToEmbed: sendLiveToEmbed,
            pasteFromClipboard: pasteFromClipboard,
            insertSpecial: insertSpecial,
            specialGroups: specialGroups,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
