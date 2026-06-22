<template>
  <div class="fonts-page">
    <div class="fonts-header">
      <div class="header-left">
        <h1>🔤 Discord Fonts</h1>
        <p class="subtitle">Convertisseur de texte Unicode — compatible Discord, Twitch, Twitter</p>
      </div>
      <div class="header-right">
        <select v-model="activeCategory" class="fh-select">
          <option value="Tous">Toutes les polices</option>
          <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <div class="input-zone">
      <label class="fh-label">Texte a convertir</label>
      <div class="textarea-row">
        <textarea v-model="inputText"
          placeholder="Ecris ton texte ici... il sera converti en temps reel dans toutes les polices"
          class="fh-textarea main-textarea" rows="3" autofocus />
        <div class="input-actions">
          <button @click="inputText = ''" class="btn-secondary">x Effacer</button>
          <button @click="pasteFromClipboard" class="btn-secondary">📋 Coller</button>
        </div>
      </div>
      <p class="input-hint">{{ inputText.length }} caractere(s)</p>
    </div>

    <div v-if="inputText" class="discord-preview-bar">
      <div class="discord-avatar">⚒️</div>
      <div class="discord-bubble">
        <span class="discord-user">ForgeHook</span>
        <span class="discord-text">{{ inputText }}</span>
      </div>
      <span class="preview-label">Texte normal sur Discord</span>
    </div>

    <div class="fonts-grid">
      <div v-for="font in filteredFonts" :key="font.name"
        class="font-card" :class="{ 'recently-copied': copiedFont === font.name }"
        @click="copyFont(font)">
        <div class="font-card-top">
          <div class="font-meta">
            <span class="font-name">{{ font.name }}</span>
            <span class="font-category">{{ font.category }}</span>
          </div>
          <div class="font-icon">{{ font.icon }}</div>
        </div>
        <div class="font-preview" :class="{ empty: !inputText }">
          {{ inputText ? convertFont(inputText, font) : font.desc }}
        </div>
        <div class="font-card-bottom">
          <button class="copy-btn" :class="{ copied: copiedFont === font.name }" @click.stop="copyFont(font)">
            {{ copiedFont === font.name ? '✅ Copie!' : '📋 Copier' }}
          </button>
          <button v-if="hasEmbedTarget" class="inject-btn" @click.stop="injectToEmbed(font)">
            ⚡ → Embed
          </button>
        </div>
      </div>
    </div>

    <div class="live-section">
      <h3>✏️ Mode live — Ecrire directement dans une police</h3>
      <div class="live-controls">
        <select v-model="selectedLiveFont" class="fh-select">
          <option v-for="f in FONT_LIST" :key="f.name" :value="f.name">{{ f.icon }} {{ f.name }}</option>
        </select>
        <button @click="copyLive" class="btn-primary">📋 Copier le resultat</button>
        <button @click="sendLiveToEmbed" class="btn-secondary" v-if="hasEmbedTarget">⚡ → Embed</button>
      </div>
      <div class="live-grid">
        <div>
          <label class="fh-label">Texte source</label>
          <textarea v-model="liveInput" placeholder="Tape ici..." class="fh-textarea" rows="4" />
        </div>
        <div>
          <label class="fh-label">Resultat — {{ selectedLiveFont }}</label>
          <div class="live-output" @click="copyLive">{{ liveOutput || '...' }}</div>
        </div>
      </div>
    </div>

    <div class="special-section">
      <h3>🎨 Caracteres speciaux</h3>
      <div v-for="group in specialGroups" :key="group.name" class="special-group">
        <div class="special-group-name">{{ group.name }}</div>
        <div class="special-chars">
          <button v-for="c in group.chars" :key="c.label"
            class="special-char-btn" :title="c.label" @click="insertSpecial(c.char)">
            {{ c.char }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { FONT_LIST, CATEGORIES, convertFont, type FontDef } from '../utils/discordFonts'
import { useEmbedStore } from '../stores/embed'

const embedStore = useEmbedStore()
const route = useRoute()
const inputText = ref('')
const copiedFont = ref('')
const toast = ref('')
const activeCategory = ref('Tous')
const selectedLiveFont = ref(FONT_LIST[0].name)
const liveInput = ref('')

const hasEmbedTarget = computed(() => !!route.query.field)
const targetField = computed(() => route.query.field as string | undefined)
const filteredFonts = computed(() =>
  activeCategory.value === 'Tous' ? FONT_LIST : FONT_LIST.filter(f => f.category === activeCategory.value)
)
const selectedLiveFontDef = computed(() =>
  FONT_LIST.find(f => f.name === selectedLiveFont.value) ?? FONT_LIST[0]
)
const liveOutput = computed(() =>
  liveInput.value ? convertFont(liveInput.value, selectedLiveFontDef.value) : ''
)

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2200)
}

async function copyFont(font: FontDef) {
  if (!inputText.value) { showToast('Entrez du texte!'); return }
  const result = convertFont(inputText.value, font)
  await navigator.clipboard.writeText(result)
  copiedFont.value = font.name
  setTimeout(() => { copiedFont.value = '' }, 2000)
  showToast('Copie: ' + font.name)
}

async function copyLive() {
  if (!liveOutput.value) return
  await navigator.clipboard.writeText(liveOutput.value)
  showToast('Copie!')
}

function injectToEmbed(font: FontDef) {
  if (!inputText.value) return
  injectIntoEmbedStore(convertFont(inputText.value, font))
}

function sendLiveToEmbed() {
  if (!liveOutput.value) return
  injectIntoEmbedStore(liveOutput.value)
}

function injectIntoEmbedStore(text: string) {
  const field = targetField.value
  if (!embedStore.message.embeds.length) embedStore.addEmbed()
  const embed = embedStore.message.embeds[0]
  if (field === 'title') embed.title = text
  else if (field === 'description') embed.description = text
  else if (field === 'author') { embed.author = { name: text, url: '', icon_url: '' } }
  else if (field === 'footer') { embed.footer = { text, icon_url: embed.footer?.icon_url ?? '' } }
  else embed.description = (embed.description ?? '') + text
  showToast('Insere dans Embed Builder!')
}

async function pasteFromClipboard() {
  try {
    inputText.value = await navigator.clipboard.readText()
  } catch {
    showToast('Impossible de lire le presse-papiers.')
  }
}

function insertSpecial(char: string) {
  inputText.value += char
  navigator.clipboard.writeText(char)
  showToast('Copie!')
}

// Special characters defined with code points to avoid TS parser issues with smart quotes
function cp(...codes: number[]): string { return codes.map(c => String.fromCodePoint(c)).join('') }

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
]
</script>

<style scoped>
.fonts-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }
.fonts-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.fonts-header h1 { margin: 0; }
.subtitle { color: var(--text-muted); font-size: 13px; margin: 4px 0 0; }
.input-zone { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
.textarea-row { display: flex; gap: 8px; }
.main-textarea { flex: 1; font-size: 16px; }
.input-actions { display: flex; flex-direction: column; gap: 6px; }
.input-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.discord-preview-bar { display: flex; align-items: center; gap: 10px; background: #36393f; border-radius: 8px; padding: 10px 14px; border: 1px solid var(--border); }
.discord-avatar { width: 36px; height: 36px; border-radius: 50%; background: #5865f2; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.discord-bubble { display: flex; flex-direction: column; flex: 1; }
.discord-user { font-size: 13px; font-weight: 700; color: #fff; }
.discord-text { font-size: 14px; color: #dcddde; }
.preview-label { font-size: 11px; color: var(--text-muted); margin-left: auto; white-space: nowrap; }
.fonts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.font-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 14px; cursor: pointer; transition: all .15s; display: flex; flex-direction: column; gap: 10px; }
.font-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(88,101,242,.2); }
.font-card.recently-copied { border-color: #57f287; background: rgba(87,242,135,.05); }
.font-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
.font-meta { display: flex; flex-direction: column; gap: 2px; }
.font-name { font-weight: 700; font-size: 13px; color: #fff; }
.font-category { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; background: var(--bg-tertiary); padding: 1px 6px; border-radius: 4px; display: inline-block; }
.font-icon { font-size: 22px; opacity: .7; }
.font-preview { font-size: 17px; color: #dcddde; min-height: 44px; word-break: break-all; line-height: 1.5; flex: 1; }
.font-preview.empty { color: var(--text-muted); font-size: 13px; font-style: italic; }
.font-card-bottom { display: flex; gap: 6px; }
.copy-btn { flex: 1; padding: 6px; font-size: 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-muted); cursor: pointer; transition: all .15s; }
.copy-btn:hover, .copy-btn.copied { background: var(--accent); color: #fff; border-color: var(--accent); }
.inject-btn { padding: 6px 10px; font-size: 12px; background: rgba(87,242,135,.15); border: 1px solid rgba(87,242,135,.3); border-radius: 6px; color: #57f287; cursor: pointer; transition: all .15s; }
.inject-btn:hover { background: rgba(87,242,135,.3); }
.live-section { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
.live-section h3 { margin: 0 0 10px; }
.live-controls { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.live-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.live-output { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; padding: 12px; min-height: 100px; font-size: 18px; color: #dcddde; word-break: break-all; cursor: pointer; transition: border-color .15s; white-space: pre-wrap; }
.live-output:hover { border-color: var(--accent); }
.special-section { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
.special-section h3 { margin: 0 0 12px; }
.special-group { margin-bottom: 14px; }
.special-group-name { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 6px; }
.special-chars { display: flex; flex-wrap: wrap; gap: 4px; }
.special-char-btn { width: 36px; height: 36px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; color: #dcddde; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all .12s; }
.special-char-btn:hover { background: var(--accent); border-color: var(--accent); color: #fff; transform: scale(1.15); }
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #57f287; color: #000; font-weight: 700; padding: 10px 22px; border-radius: 8px; z-index: 9999; animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@media (max-width: 600px) { .live-grid, .fonts-grid { grid-template-columns: 1fr; } }
</style>
