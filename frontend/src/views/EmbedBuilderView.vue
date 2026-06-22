<template>
  <div class="builder-layout">
    <!-- Panneau gauche : éditeur -->
    <div class="editor-panel">
      <div class="panel-header">
        <h2>⚡ Constructeur d'embed</h2>
        <div class="actions">
          <select v-model="embedStore.selectedWebhookId" class="fh-select">
            <option :value="null" disabled>Choisir un webhook</option>
            <option v-for="w in webhookStore.webhooks" :key="w.id" :value="w.id">
              {{ w.name }}
            </option>
          </select>
          <button @click="showFonts = true" class="btn-secondary" title="Convertisseur de polices">🔤 Fonts</button>
          <button @click="showTemplates = true" class="btn-secondary" title="Charger un template">📋 Templates</button>
          <button @click="saveAsTemplate" class="btn-secondary" title="Sauver comme template">💾</button>
        </div>
      </div>

      <!-- SECTION 1 : Message de base -->
      <div class="editor-section">
        <div class="section-title">
          <span class="section-num">1</span>
          <span>Message de base</span>
          <span class="section-hint">Texte envoyé au-dessus des embeds</span>
        </div>
        <div class="section">
          <label class="fh-label">
            Contenu du message
            <span class="field-hint">Texte libre, @everyone, @here, mentions, markdown Discord</span>
          </label>
          <textarea v-model="embedStore.message.content"
            placeholder="Ex: @everyone Nouvelle annonce ! 🎉  ← Ce texte apparaît AVANT l'embed"
            class="fh-textarea" rows="2" />
        </div>
      </div>

      <!-- SECTION 2 : Identité du webhook -->
      <div class="editor-section">
        <div class="section-title">
          <span class="section-num">2</span>
          <span>Identité du webhook</span>
          <span class="section-hint">Personnaliser le nom et l'avatar affiché</span>
        </div>
        <div class="section row">
          <div class="half">
            <label class="fh-label">
              Nom affiché
              <span class="field-hint">Remplace le nom par défaut du webhook</span>
            </label>
            <input v-model="embedStore.message.username" placeholder="Ex: Bot Annonces" class="fh-input" />
          </div>
          <div class="half">
            <label class="fh-label">
              Avatar
              <span class="field-hint">URL ou importer une image</span>
            </label>
            <div class="avatar-row">
              <input v-model="embedStore.message.avatar_url" placeholder="https://..." class="fh-input" />
              <button @click="triggerAvatarUpload" class="btn-secondary avatar-upload-btn" title="Importer une image">📤</button>
              <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="uploadAvatar" />
            </div>
            <img v-if="embedStore.message.avatar_url" :src="embedStore.message.avatar_url"
              class="avatar-preview" alt="avatar" @error="($event.target as HTMLImageElement).style.display='none'" />
          </div>
        </div>
        <div class="section">
          <label class="inline-toggle fh-label">
            <input type="checkbox" v-model="embedStore.message.tts" style="accent-color:#5865f2" />
            TTS (Text-to-Speech) — lire le message à voix haute
          </label>
        </div>
      </div>

      <!-- SECTION 3 : Embeds -->
      <div class="editor-section">
        <div class="section-title">
          <span class="section-num">3</span>
          <span>Embeds Discord</span>
          <span class="section-hint">Cartes visuelles richement formatées</span>
        </div>

        <div v-for="(_, i) in embedStore.message.embeds" :key="i" class="embed-section">
          <div class="embed-header">
            <h3>Embed {{ i + 1 }}/{{ embedStore.message.embeds.length }}</h3>
            <div class="flex gap-2">
              <button @click="duplicateEmbed(i)" class="btn-secondary" title="Dupliquer">⧉</button>
              <button @click="embedStore.removeEmbed(i)" class="btn-danger-sm">✕ Supprimer</button>
            </div>
          </div>
          <EmbedBuilder v-model="embedStore.message.embeds[i]" />
        </div>

        <button @click="embedStore.addEmbed()" class="btn-add"
          :disabled="embedStore.message.embeds.length >= 10">
          + Ajouter un embed ({{ embedStore.message.embeds.length }}/10)
        </button>
      </div>

      <!-- SECTION 4 : Envoi -->
      <div class="editor-section send-section">
        <div class="section-title">
          <span class="section-num">4</span>
          <span>Envoyer</span>
        </div>
        <div class="send-area">
          <input v-model="threadId" placeholder="Thread ID (optionnel)" class="fh-input" style="width:180px" />
          <button @click="send" class="btn-primary send-btn"
            :disabled="embedStore.sending || !embedStore.selectedWebhookId">
            {{ embedStore.sending ? '⏳ Envoi...' : '🚀 Envoyer sur Discord' }}
          </button>
          <button @click="embedStore.reset()" class="btn-secondary">🗑 Réinitialiser</button>
        </div>
        <p v-if="!embedStore.selectedWebhookId" class="send-hint">⚠️ Sélectionnez un webhook pour envoyer</p>
        <p v-if="embedStore.lastError" class="error mt-2">⚠️ {{ embedStore.lastError }}</p>
        <p v-if="sent" class="success mt-2">✅ Message envoyé ! Redirection vers l'historique...</p>
      </div>
    </div>

    <!-- Panneau droit : preview -->
    <div class="preview-panel">
      <div class="panel-header">
        <h2>👁 Aperçu Discord</h2>
        <div style="display:flex;gap:8px">
          <button @click="showJson = !showJson" class="btn-secondary" style="font-size:12px">
            {{ showJson ? 'Masquer JSON' : 'JSON' }}
          </button>
        </div>
      </div>

      <div class="preview-legend">
        <div class="legend-item"><span class="leg-tag tag-content">1</span> Message de base (content)</div>
        <div class="legend-item"><span class="leg-tag tag-embed">3</span> Embed (carte)</div>
      </div>

      <DiscordPreview :message="embedStore.message" :show-bot-tag="true" />

      <div v-if="showJson" class="mt-4">
        <label class="fh-label">Payload JSON</label>
        <pre class="json-block">{{ JSON.stringify(embedStore.message, null, 2) }}</pre>
      </div>
    </div>

    <!-- Modal templates -->
    <div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates = false">
      <div class="modal" style="max-width:700px">
        <h3>📋 Templates pré-faits</h3>

        <!-- Catégories -->
        <div class="tpl-categories">
          <button v-for="cat in templateCategories" :key="cat"
            :class="['tpl-cat-btn', activeCat === cat ? 'active' : '']"
            @click="activeCat = cat">{{ cat }}</button>
        </div>

        <div class="tpl-grid mt-2">
          <!-- Templates sauvegardés -->
          <div v-for="t in filteredUserTemplates" :key="`user-${t.id}`" class="tpl-card user-tpl" @click="loadTemplate(t)">
            <div class="flex items-center gap-2 mb-1">
              <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0" :style="{ background: t.preview_color }" />
              <strong style="font-size:13px">{{ t.name }}</strong>
              <span class="badge badge-info" style="font-size:10px;margin-left:auto">Perso</span>
            </div>
            <p style="color:var(--text-muted);font-size:11px">{{ t.description }}</p>
          </div>

          <!-- Templates pré-faits -->
          <div v-for="t in filteredPresetTemplates" :key="`preset-${t.name}`" class="tpl-card" @click="loadPreset(t)">
            <div class="tpl-card-icon">{{ t.icon }}</div>
            <strong style="font-size:13px">{{ t.name }}</strong>
            <p style="color:var(--text-muted);font-size:11px;margin-top:2px">{{ t.desc }}</p>
            <span class="badge badge-success" style="font-size:10px;margin-top:6px">Prêt à l'emploi</span>
          </div>

          <div v-if="!filteredUserTemplates.length && !filteredPresetTemplates.length" style="color:var(--text-muted);text-align:center;padding:24px;grid-column:1/-1">
            Aucun template dans cette catégorie.
          </div>
        </div>
        <div class="modal-actions"><button @click="showTemplates = false" class="btn-secondary">Fermer</button></div>
      </div>
    </div>

    <!-- Modal Discord Fonts -->
    <div v-if="showFonts" class="modal-overlay" @click.self="showFonts = false">
      <div class="modal fonts-modal">
        <div class="fonts-modal-header">
          <h3>🔤 Discord Fonts</h3>
          <button @click="showFonts = false" class="close-btn">✕</button>
        </div>

        <div class="fonts-modal-controls">
          <div class="fonts-input-row">
            <textarea v-model="fontsInput" placeholder="Texte à convertir..." class="fh-textarea" rows="2" style="flex:1" autofocus />
            <div class="fonts-target-col">
              <label class="fh-label" style="font-size:11px">Insérer dans</label>
              <select v-model="fontsTargetField" class="fh-select">
                <option value="description">Description</option>
                <option value="title">Titre</option>
                <option value="content">Message (content)</option>
                <option value="footer">Footer</option>
                <option value="author">Auteur</option>
              </select>
            </div>
          </div>
          <div class="fonts-cats">
            <button v-for="cat in ['Tous', ...CATEGORIES]" :key="cat"
              :class="['font-cat-btn', fontsCat === cat ? 'active' : '']"
              @click="fontsCat = cat">{{ cat }}</button>
          </div>
        </div>

        <div class="fonts-modal-grid">
          <div v-for="font in filteredFontsInline" :key="font.name"
            class="font-mini-card"
            :class="{ 'copied': fontsCopied === font.name }">
            <div class="font-mini-preview">
              {{ fontsInput ? convertFont(fontsInput, font) : font.desc }}
            </div>
            <div class="font-mini-name">{{ font.name }}</div>
            <div class="font-mini-actions">
              <button @click="copyFontInline(font)" class="btn-icon" title="Copier">📋</button>
              <button @click="injectFontInline(font)" class="btn-icon inject" title="Insérer dans l'embed">⚡</button>
            </div>
          </div>
        </div>

        <p v-if="fontsToast" class="fonts-toast">{{ fontsToast }}</p>
      </div>
    </div>

    <!-- Modal save template -->
    <div v-if="showSaveTemplate" class="modal-overlay" @click.self="showSaveTemplate = false">
      <div class="modal">
        <h3>💾 Sauver comme template</h3>
        <div class="section">
          <label class="fh-label">Nom</label>
          <input v-model="tplForm.name" placeholder="Nom du template" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Description</label>
          <input v-model="tplForm.description" placeholder="Description courte" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Catégorie</label>
          <input v-model="tplForm.category" placeholder="Ex: annonces, jeux, logs" class="fh-input" list="cat-list" />
          <datalist id="cat-list">
            <option value="Annonces" /><option value="Jeux" /><option value="Films & Séries" />
            <option value="Serveur" /><option value="Modération" /><option value="Événements" />
          </datalist>
        </div>
        <div class="modal-actions">
          <button @click="submitTemplate" class="btn-primary">Sauver</button>
          <button @click="showSaveTemplate = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import DiscordPreview from '../components/preview/DiscordPreview.vue'
import { useEmbedStore } from '../stores/embed'
import { useWebhooksStore } from '../stores/webhooks'
import { useUiStore } from '../stores/ui'
import { emptyEmbed } from '../types/discord'
import { FONT_LIST, CATEGORIES, convertFont } from '../utils/discordFonts'
import type { Template } from '../types/app'
import api from '../api/client'

const router = useRouter()
const embedStore = useEmbedStore()
const webhookStore = useWebhooksStore()
const ui = useUiStore()

const threadId = ref('')
const sent = ref(false)
const showJson = ref(false)
const showTemplates = ref(false)
const showSaveTemplate = ref(false)
const showFonts = ref(false)
const fontsInput = ref('')
const fontsTargetField = ref<'title' | 'description' | 'content' | 'footer' | 'author'>('description')
const fontsCat = ref('Tous')
const fontsCopied = ref('')
const fontsToast = ref('')

const filteredFontsInline = computed(() =>
  fontsCat.value === 'Tous' ? FONT_LIST : FONT_LIST.filter(f => f.category === fontsCat.value)
)

function copyFontInline(font: typeof FONT_LIST[0]) {
  if (!fontsInput.value) return
  const result = convertFont(fontsInput.value, font)
  navigator.clipboard.writeText(result)
  fontsCopied.value = font.name
  fontsToast.value = `✅ Copié !`
  setTimeout(() => { fontsCopied.value = ''; fontsToast.value = '' }, 2000)
}

function injectFontInline(font: typeof FONT_LIST[0]) {
  if (!fontsInput.value) return
  const result = convertFont(fontsInput.value, font)
  applyFontToField(result)
}

function applyFontToField(text: string) {
  const embed = embedStore.message.embeds[0]
  if (fontsTargetField.value === 'content') {
    embedStore.message.content = text
  } else if (fontsTargetField.value === 'title') {
    if (embed) embed.title = text
  } else if (fontsTargetField.value === 'description') {
    if (embed) embed.description = text
  } else if (fontsTargetField.value === 'footer') {
    if (embed) embed.footer = { text, icon_url: embed.footer?.icon_url ?? '' }
  } else if (fontsTargetField.value === 'author') {
    if (embed) embed.author = { name: text, url: embed.author?.url ?? '', icon_url: embed.author?.icon_url ?? '' }
  }
  showFonts.value = false
  ui.notify(`Texte inséré dans "${fontsTargetField.value}" !`)
}
const templates = ref<Template[]>([])
const tplForm = ref({ name: '', description: '', category: 'Annonces' })
const avatarInput = ref<HTMLInputElement | null>(null)
const activeCat = ref('Tous')
const uploadingAvatar = ref(false)

// Templates pré-faits
const presetTemplates = [
  // Jeux
  {
    cat: 'Jeux', icon: '🎮', name: 'Annonce de jeu', desc: 'Sortie ou mise à jour d\'un jeu',
    payload: {
      content: '@everyone 🎮 Nouvelle sortie !',
      embeds: [{
        title: '🎮 [Nom du jeu] — Maintenant disponible !',
        description: '[Description du jeu — genre, univers, gameplay en 2-3 lignes]\n\n> *"[Citation ou slogan]"*',
        color: 0x5865F2,
        image: { url: 'https://via.placeholder.com/800x400?text=Game+Banner' },
        thumbnail: { url: 'https://via.placeholder.com/128x128?text=Logo' },
        fields: [
          { name: '🕹 Genre', value: 'RPG / Action', inline: true },
          { name: '💻 Plateformes', value: 'PC / PS5 / Xbox', inline: true },
          { name: '💰 Prix', value: '29,99€ / Gratuit', inline: true },
          { name: '🔗 Liens', value: '[Steam](https://steam.com) • [Epic](https://epicgames.com) • [Site officiel](https://...)', inline: false },
        ],
        footer: { text: 'Disponible dès maintenant !' },
      }]
    }
  },
  {
    cat: 'Jeux', icon: '📋', name: 'Patch Notes', desc: 'Notes de mise à jour de jeu',
    payload: {
      content: '',
      embeds: [{
        title: '📋 Patch Notes — Version [X.Y.Z]',
        description: '*Mise à jour du [date]*\n\nRésumé des changements principaux...',
        color: 0x57F287,
        fields: [
          { name: '✨ Nouveautés', value: '• Feature 1\n• Feature 2\n• Feature 3', inline: false },
          { name: '⚡ Améliorations', value: '• Amélioration 1\n• Amélioration 2', inline: false },
          { name: '🐛 Corrections', value: '• Fix bug critique\n• Fix crash serveur', inline: false },
        ],
        footer: { text: 'Patch Notes officiel' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Jeux', icon: '🏆', name: 'Annonce de tournoi', desc: 'Tournoi / compétition gaming',
    payload: {
      content: '@everyone 🏆 Un tournoi arrive !',
      embeds: [{
        title: '🏆 Tournoi [Nom du jeu] — [Édition]',
        description: 'Rejoignez notre tournoi exclusif et affrontez les meilleurs joueurs !',
        color: 0xFEE75C,
        fields: [
          { name: '📅 Date', value: '[Date début] → [Date fin]', inline: true },
          { name: '👥 Format', value: '1v1 / 5v5 / Solo', inline: true },
          { name: '💰 Prize Pool', value: '[Montant] €', inline: true },
          { name: '📝 Inscription', value: 'Réagissez avec ✅ ou tapez `/inscription`', inline: false },
        ],
        footer: { text: 'Inscriptions ouvertes jusqu\'au [date limite]' },
      }]
    }
  },
  {
    cat: 'Jeux', icon: '📣', name: 'Résultats match', desc: 'Résultats d\'une compétition',
    payload: {
      content: '',
      embeds: [{
        title: '📣 Résultats — [Événement]',
        description: 'Les résultats de la compétition sont là !',
        color: 0xED4245,
        fields: [
          { name: '🥇 1er place', value: '[Joueur/Équipe] — [Score]', inline: false },
          { name: '🥈 2ème place', value: '[Joueur/Équipe] — [Score]', inline: false },
          { name: '🥉 3ème place', value: '[Joueur/Équipe] — [Score]', inline: false },
        ],
        footer: { text: 'GG à tous les participants !' },
      }]
    }
  },
  // Films & Séries
  {
    cat: 'Films & Séries', icon: '🎬', name: 'Sortie film/série', desc: 'Annonce de sortie',
    payload: {
      content: '',
      embeds: [{
        title: '🎬 [Titre] — En salle / Streaming !',
        description: '**Genre :** [Genre]\n**Réalisateur :** [Nom]\n**Durée :** [X]h[X]\n\n[Synopsis en 2-3 lignes sans spoilers]',
        color: 0xEB459E,
        image: { url: 'https://via.placeholder.com/800x400?text=Movie+Banner' },
        fields: [
          { name: '📅 Date de sortie', value: '[Date]', inline: true },
          { name: '⭐ Note Presse', value: '[X]/10', inline: true },
          { name: '🔞 Classification', value: 'Tout public / -12 / -16 / -18', inline: true },
          { name: '📺 Où regarder', value: '[Netflix](https://netflix.com) • [Disney+](https://disneyplus.com) • [Prime](https://primevideo.com)', inline: false },
        ],
        footer: { text: 'Disponible dès maintenant' },
      }]
    }
  },
  {
    cat: 'Films & Séries', icon: '⭐', name: 'Critique / Review', desc: 'Critique avec notation',
    payload: {
      content: '',
      embeds: [{
        title: '⭐ Review : [Titre du film/série]',
        description: '[Votre avis en quelques lignes — sans trop de spoilers]\n\n> *"[Citation mémorable du film]"*',
        color: 0xFEE75C,
        thumbnail: { url: 'https://via.placeholder.com/128x128?text=Poster' },
        fields: [
          { name: '🎭 Scénario', value: '★★★★☆', inline: true },
          { name: '🎨 Réalisation', value: '★★★★★', inline: true },
          { name: '🎵 Musique', value: '★★★★☆', inline: true },
          { name: '🎬 Acteurs', value: '★★★☆☆', inline: true },
          { name: '📊 Note globale', value: '**★★★★☆ 8/10**', inline: true },
          { name: '✅ Verdict', value: 'À voir absolument !', inline: true },
        ],
        footer: { text: 'Critique par [auteur]' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Films & Séries', icon: '📺', name: 'Résumé d\'épisode', desc: 'Recap d\'un épisode de série',
    payload: {
      content: '',
      embeds: [{
        title: '📺 [Nom de la série] — S[XX]E[XX] : "[Titre épisode]"',
        description: '**🚨 SPOILERS** — Résumé de l\'épisode\n\n[Résumé de l\'épisode en quelques paragraphes]',
        color: 0x5865F2,
        fields: [
          { name: '⭐ Note épisode', value: '[X]/10', inline: true },
          { name: '⏱ Durée', value: '[X] min', inline: true },
          { name: '📅 Diffusion', value: '[Date]', inline: true },
          { name: '🔮 Théories pour la suite', value: '[Vos théories sur la suite]', inline: false },
        ],
        footer: { text: 'Prochain épisode : [date/infos]' },
      }]
    }
  },
  // Serveur Discord
  {
    cat: 'Serveur', icon: '👋', name: 'Message de bienvenue', desc: 'Accueil des nouveaux membres',
    payload: {
      content: '',
      embeds: [{
        title: '👋 Bienvenue sur [Nom du serveur] !',
        description: 'Nous sommes ravis de t\'accueillir parmi nous !\n\nCe serveur est dédié à [description du sujet/communauté]. Avant tout, veuillez lire nos règles.',
        color: 0x57F287,
        thumbnail: { url: 'https://via.placeholder.com/128x128?text=Logo' },
        fields: [
          { name: '📜 Règles', value: 'Lisez #📜-règles avant de participer', inline: false },
          { name: '🎭 Rôles', value: 'Récupérez vos rôles dans #🎭-rôles', inline: false },
          { name: '💬 Chat principal', value: 'Dites bonjour dans #💬-général', inline: false },
          { name: '🆘 Besoin d\'aide ?', value: 'Ouvrez un ticket dans #🎫-support', inline: false },
        ],
        footer: { text: 'Bonne expérience sur le serveur !' },
      }]
    }
  },
  {
    cat: 'Serveur', icon: '📜', name: 'Règles du serveur', desc: 'Liste des règles de la communauté',
    payload: {
      content: '',
      embeds: [{
        title: '📜 Règles du serveur [Nom]',
        description: 'Veuillez lire et respecter ces règles. Le non-respect entraînera des sanctions.',
        color: 0xED4245,
        fields: [
          { name: '1️⃣ Respect', value: 'Respectez tous les membres. Les insultes, le harcèlement et la discrimination sont interdits.', inline: false },
          { name: '2️⃣ Contenu adapté', value: 'Postez du contenu approprié dans les bons channels. Pas de NSFW hors zones désignées.', inline: false },
          { name: '3️⃣ Anti-spam', value: 'Pas de spam, flood, ou pub non autorisée.', inline: false },
          { name: '4️⃣ Langue', value: 'Ce serveur est principalement en [langue]. Restez dans la langue du channel.', inline: false },
          { name: '5️⃣ Confidentialité', value: 'Ne partagez pas d\'informations personnelles d\'autres membres sans leur consentement.', inline: false },
          { name: '⚠️ Sanctions', value: 'Avertissement → Mute → Kick → Ban selon la gravité.', inline: false },
        ],
        footer: { text: 'En rejoignant ce serveur, vous acceptez ces règles.' },
      }]
    }
  },
  {
    cat: 'Serveur', icon: '🎁', name: 'Giveaway', desc: 'Cadeau / concours',
    payload: {
      content: '@everyone 🎁 GIVEAWAY !',
      embeds: [{
        title: '🎁 GIVEAWAY — [Nom du lot]',
        description: '**Valeur estimée :** [valeur]\n\nUn gagnant sélectionné au hasard parmi les participants !',
        color: 0xFEE75C,
        thumbnail: { url: 'https://via.placeholder.com/128x128?text=Gift' },
        fields: [
          { name: '✅ Pour participer', value: 'Réagissez avec 🎉 sous ce message', inline: false },
          { name: '⏰ Durée', value: 'Se termine dans **[durée]**', inline: true },
          { name: '🏆 Gagnants', value: '**[nombre]** gagnant(s)', inline: true },
          { name: '📋 Conditions', value: '[Conditions : être membre depuis X jours, avoir un certain rôle, etc.]', inline: false },
        ],
        footer: { text: 'Bonne chance à tous !' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Serveur', icon: '📣', name: 'Annonce générale', desc: 'Annonce pour tous les membres',
    payload: {
      content: '@everyone',
      embeds: [{
        title: '📣 [Titre de l\'annonce]',
        description: '[Corps de votre annonce]\n\nExplication détaillée de l\'annonce, nouveauté, changement, ou information importante à communiquer à votre communauté.',
        color: 0x5865F2,
        fields: [
          { name: '📅 Date d\'effet', value: '[Quand cela prend effet]', inline: true },
          { name: '👥 Concerne', value: 'Tous les membres', inline: true },
        ],
        footer: { text: '— L\'équipe de modération' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Serveur', icon: '⚡', name: 'Événement', desc: 'Annonce d\'événement / soirée',
    payload: {
      content: '@everyone 📅 Événement à venir !',
      embeds: [{
        title: '📅 [Nom de l\'événement]',
        description: '[Description de l\'événement — de quoi il s\'agit, ce que les participants peuvent attendre]',
        color: 0xEB459E,
        fields: [
          { name: '🕐 Quand', value: '[Date] à [heure] (heure Paris)', inline: true },
          { name: '📍 Où', value: '[Channel vocal / Discord / Plateforme]', inline: true },
          { name: '👥 Participants', value: '[Ouvert à tous / Sur inscription]', inline: true },
          { name: '📝 Pour participer', value: 'Réagissez avec ✅ pour confirmer votre présence', inline: false },
        ],
        footer: { text: 'On vous attend nombreux !' },
      }]
    }
  },
  {
    cat: 'Serveur', icon: '🔨', name: 'Avertissement / Sanction', desc: 'Message de modération',
    payload: {
      content: '',
      embeds: [{
        title: '⚠️ Avertissement',
        description: 'Un membre a reçu un avertissement pour non-respect des règles.',
        color: 0xED4245,
        fields: [
          { name: '👤 Membre', value: '[Nom#0000]', inline: true },
          { name: '⚠️ Raison', value: '[Raison de l\'avertissement]', inline: true },
          { name: '📊 Sanction', value: 'Avertissement #[X] / Mute / Kick / Ban', inline: true },
          { name: '📜 Règle enfreinte', value: 'Règle [X] — [Nom de la règle]', inline: false },
        ],
        footer: { text: 'Message de modération' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  // Annonces
  {
    cat: 'Annonces', icon: '🆕', name: 'Nouvelle fonctionnalité', desc: 'Feature / produit',
    payload: {
      content: '',
      embeds: [{
        title: '🆕 Nouveauté : [Nom de la feature]',
        description: '[Description de la nouvelle fonctionnalité]\n\nCette mise à jour apporte **[bénéfice principal]** à tous les utilisateurs.',
        color: 0x57F287,
        fields: [
          { name: '✨ Ce qui change', value: '• Point 1\n• Point 2\n• Point 3', inline: false },
          { name: '📅 Disponible depuis', value: '[Date / Version]', inline: true },
          { name: '🔗 En savoir plus', value: '[Documentation](https://...)', inline: true },
        ],
        footer: { text: 'Disponible maintenant pour tous les utilisateurs' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Annonces', icon: '🛑', name: 'Maintenance / Panne', desc: 'Interruption de service',
    payload: {
      content: '@everyone 🛑 Maintenance en cours',
      embeds: [{
        title: '🛑 Maintenance — [Nom du service]',
        description: 'Une maintenance est actuellement en cours sur nos serveurs. Nous nous excusons pour la gêne occasionnée.',
        color: 0xED4245,
        fields: [
          { name: '⏰ Début', value: '[Heure de début]', inline: true },
          { name: '⏳ Durée estimée', value: '[Durée]', inline: true },
          { name: '🔧 Raison', value: '[Raison : mise à jour critique / réparation]', inline: false },
          { name: '📢 Statut', value: '🔴 En cours / 🟡 Dégradé / 🟢 Résolu', inline: false },
        ],
        footer: { text: 'Nous communiquerons sur la résolution.' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Annonces', icon: '✅', name: 'Résolu / Retour service', desc: 'Fin de maintenance ou résolution',
    payload: {
      content: '',
      embeds: [{
        title: '✅ Service rétabli — [Nom du service]',
        description: 'La maintenance est terminée. Tous les services sont de nouveau opérationnels.\n\nMerci pour votre patience !',
        color: 0x57F287,
        fields: [
          { name: '⏱ Durée totale', value: '[X] heure(s)', inline: true },
          { name: '✅ Statut', value: '🟢 Opérationnel', inline: true },
          { name: '📋 Ce qui a changé', value: '[Résumé des changements apportés]', inline: false },
        ],
        footer: { text: 'Service rétabli le [date] à [heure]' },
        timestamp: new Date().toISOString(),
      }]
    }
  },
  {
    cat: 'Annonces', icon: '💼', name: 'Recrutement', desc: 'Offre de staff / modérateurs',
    payload: {
      content: '',
      embeds: [{
        title: '💼 Recrutement — [Poste]',
        description: 'Nous recrutons de nouveaux membres pour renforcer notre équipe !\n\nVous êtes passionné(e), disponible et motivé(e) ? Ce poste est fait pour vous.',
        color: 0xFEE75C,
        fields: [
          { name: '🎯 Poste recherché', value: '[Modérateur / Admin / Helper / Graphiste]', inline: true },
          { name: '👥 Places disponibles', value: '[X] poste(s)', inline: true },
          { name: '📋 Prérequis', value: '• Être membre depuis [durée]\n• Avoir au moins [X] ans\n• Disponible [X]h/semaine\n• [Autre critère]', inline: false },
          { name: '📝 Candidater', value: 'Remplissez le formulaire : [lien] ou ouvrez un ticket', inline: false },
          { name: '⏰ Candidatures jusqu\'au', value: '[Date limite]', inline: false },
        ],
        footer: { text: 'Rejoignez l\'équipe !' },
      }]
    }
  },
]

const templateCategories = computed(() => ['Tous', ...new Set(presetTemplates.map(t => t.cat)), 'Mes templates'])
const filteredPresetTemplates = computed(() => {
  if (activeCat.value === 'Mes templates') return []
  if (activeCat.value === 'Tous') return presetTemplates
  return presetTemplates.filter(t => t.cat === activeCat.value)
})
const filteredUserTemplates = computed(() => {
  if (activeCat.value === 'Tous' || activeCat.value === 'Mes templates') return templates.value
  return []
})

onMounted(async () => {
  await webhookStore.load()
  const { data } = await api.get('/templates')
  templates.value = data
  if (embedStore.message.embeds.length === 0) embedStore.addEmbed()
})

async function send() {
  await embedStore.send(threadId.value || undefined)
  if (!embedStore.lastError) {
    sent.value = true
    ui.notify('Message envoyé !')
    setTimeout(() => { router.push('/history') }, 2000)
  }
}

function duplicateEmbed(i: number) {
  const copy = JSON.parse(JSON.stringify(embedStore.message.embeds[i]))
  embedStore.message.embeds.push(copy)
}

function loadTemplate(t: Template) {
  try {
    const payload = JSON.parse(t.payload)
    embedStore.loadTemplate(payload)
    showTemplates.value = false
    ui.notify(`Template "${t.name}" chargé`)
  } catch {
    ui.notify('Impossible de parser le template', 'error')
  }
}

function loadPreset(t: typeof presetTemplates[0]) {
  embedStore.loadTemplate(t.payload as any)
  showTemplates.value = false
  ui.notify(`Template "${t.name}" chargé`)
}

function saveAsTemplate() {
  tplForm.value = { name: '', description: '', category: 'Annonces' }
  showSaveTemplate.value = true
}

async function submitTemplate() {
  if (!tplForm.value.name) return
  await api.post('/templates', {
    name: tplForm.value.name,
    description: tplForm.value.description,
    payload: JSON.parse(JSON.stringify(embedStore.message)),
    category: tplForm.value.category,
    preview_color: embedStore.message.embeds[0]?.color
      ? '#' + embedStore.message.embeds[0].color.toString(16).padStart(6, '0')
      : '#5865F2',
  })
  showSaveTemplate.value = false
  ui.notify('Template sauvegardé !')
  const { data } = await api.get('/templates')
  templates.value = data
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function uploadAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingAvatar.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    embedStore.message.avatar_url = data.url
    ui.notify('Avatar uploadé !')
  } catch (err: any) {
    ui.notify(err?.response?.data?.error ?? 'Erreur upload', 'error')
  } finally {
    uploadingAvatar.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}
</script>

<style scoped>
.inline-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }

/* Sections */
.editor-section { margin-bottom: 0; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 16px; }
.section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.section-num { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.section-hint { font-size: 11px; color: var(--text-muted); margin-left: auto; }
.field-hint { font-size: 10px; color: var(--text-muted); font-weight: 400; margin-left: 6px; }

/* Avatar */
.avatar-row { display: flex; gap: 6px; align-items: center; }
.avatar-upload-btn { padding: 6px 10px; flex-shrink: 0; }
.avatar-preview { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-top: 6px; border: 2px solid var(--border); }

/* Send */
.send-section { border-bottom: none; margin-bottom: 0; }
.send-btn { font-size: 14px; padding: 10px 20px; }
.send-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

/* Preview legend */
.preview-legend { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.leg-tag { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700; }
.tag-content { background: #57F287; color: #000; }
.tag-embed { background: #5865F2; color: #fff; }

/* Template modal */
.tpl-categories { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.tpl-cat-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px; padding: 4px 12px; cursor: pointer; font-size: 12px; transition: all .15s; }
.tpl-cat-btn.active, .tpl-cat-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
.tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; max-height: 400px; overflow-y: auto; }
.tpl-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 12px; cursor: pointer; transition: all .15s; }
.tpl-card:hover { border-color: var(--accent); background: rgba(88,101,242,.1); transform: translateY(-1px); }
.tpl-card-icon { font-size: 24px; margin-bottom: 6px; }
.user-tpl { border-left: 3px solid var(--accent); }
.mt-2 { margin-top: 8px; }

/* Fonts modal */
.fonts-modal { max-width: 820px; width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
.fonts-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.fonts-modal-header h3 { margin: 0; }
.close-btn { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { color: #fff; background: var(--bg-tertiary); }
.fonts-modal-controls { margin-bottom: 12px; }
.fonts-input-row { display: flex; gap: 10px; margin-bottom: 8px; }
.fonts-target-col { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
.fonts-cats { display: flex; gap: 5px; flex-wrap: wrap; }
.font-cat-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px; padding: 3px 10px; cursor: pointer; font-size: 11px; transition: all .15s; }
.font-cat-btn.active, .font-cat-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
.fonts-modal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; overflow-y: auto; flex: 1; padding-right: 4px; }
.font-mini-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 10px; transition: all .15s; }
.font-mini-card:hover { border-color: var(--accent); }
.font-mini-card.copied { border-color: #57f287; background: rgba(87,242,135,.05); }
.font-mini-preview { font-size: 15px; color: #dcddde; min-height: 36px; word-break: break-all; line-height: 1.4; margin-bottom: 6px; }
.font-mini-name { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
.font-mini-actions { display: flex; gap: 4px; }
.btn-icon { flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 5px; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 14px; text-align: center; transition: all .12s; }
.btn-icon:hover { color: #fff; border-color: var(--text-muted); }
.btn-icon.inject:hover { background: rgba(87,242,135,.2); border-color: #57f287; color: #57f287; }
.fonts-toast { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: #57f287; color: #000; font-weight: 700; padding: 8px 18px; border-radius: 8px; font-size: 13px; }
</style>
