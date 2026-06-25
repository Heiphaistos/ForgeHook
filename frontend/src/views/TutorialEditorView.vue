<template>
  <div class="tutorial-editor">
    <input ref="imageFileInput" type="file" accept="image/*" style="display:none" @change="handleImageUpload" />
    <div class="editor-topbar">
      <input v-model="tutorial.title" placeholder="Titre du tutoriel..." class="fh-input title-input" />
      <div class="topbar-actions">
        <button @click="showTplModal = true" class="btn-secondary" title="Templates pré-faits">📋 Templates</button>
        <button @click="openSendModal" class="btn-secondary" title="Envoyer sur Discord">🚀 Envoyer</button>
        <button @click="openTplConvert" class="btn-secondary" title="Convertir en template embed">📤 En template</button>
        <button @click="previewMode = !previewMode" class="btn-secondary">
          {{ previewMode ? '✏️ Éditer' : '👁 Aperçu' }}
        </button>
        <label class="publish-toggle">
          <input type="checkbox" :checked="!!tutorial.published" @change="tutorial.published = tutorial.published ? 0 : 1" />
          Publié
        </label>
        <button @click="save" class="btn-primary" :disabled="saving">
          {{ saving ? 'Sauvegarde...' : '💾 Sauvegarder' }}
        </button>
        <router-link to="/tutorials" class="btn-secondary">← Retour</router-link>
      </div>
    </div>

    <input v-model="tutorial.description" placeholder="Description courte (optionnel)" class="fh-input desc-input" />

    <!-- Éditeur de blocs -->
    <div v-if="!previewMode" class="blocks-area">
      <div v-for="(block, i) in tutorial.blocks" :key="block.id"
        class="block-wrapper"
        :class="{ 'block-dragging': dragBlockIdx === i, 'block-dragover': dropBlockIdx === i }"
        draggable="true"
        @dragstart.self="dragBlockIdx = i"
        @dragend="dragBlockIdx = -1; dropBlockIdx = -1"
        @dragover.prevent="dropBlockIdx = i"
        @dragleave.self="dropBlockIdx = -1"
        @drop.prevent="dropBlock(i)">
        <div class="block-controls">
          <span class="drag-handle" title="Glisser pour réordonner">⠿</span>
          <span class="block-type-label">{{ blockLabel(block.type) }}</span>
          <div class="block-btns">
            <button @click="duplicate(i)" title="Dupliquer" class="ctrl-btn">⧉</button>
            <button @click="moveBlock(i, -1)" :disabled="i === 0" class="ctrl-btn">↑</button>
            <button @click="moveBlock(i, 1)" :disabled="i === tutorial.blocks.length - 1" class="ctrl-btn">↓</button>
            <button @click="removeBlock(i)" class="ctrl-btn danger">✕</button>
          </div>
        </div>

        <!-- Text block -->
        <div v-if="block.type === 'text'" class="block-content">
          <div class="block-textarea-row">
            <textarea
              :ref="(el) => { if (el) blockTextareaRefs.set(block.id, el as HTMLTextAreaElement) }"
              v-model="block.content"
              placeholder="Texte — **gras**, *italique*, `code`, [lien](url), ~~barré~~"
              class="fh-textarea block-textarea" rows="5" />
            <EmojiPicker @select="(e) => insertBlockEmoji(block.id, 'content', e)" />
          </div>
        </div>

        <!-- Image block -->
        <div v-else-if="block.type === 'image'" class="block-content">
          <div class="img-upload-row">
            <input v-model="block.content.url" placeholder="URL de l'image" class="fh-input" />
            <button @click="triggerImageUpload(i)" class="btn-secondary upload-btn" :disabled="uploadingIdx === i" title="Uploader une image">
              {{ uploadingIdx === i ? '⏳' : '📤' }}
            </button>
          </div>
          <input v-model="block.content.caption" placeholder="Légende (optionnel)" class="fh-input mt-1" />
          <div v-if="block.content.url" class="img-preview">
            <img :src="block.content.url" alt="" @error="($event.target as HTMLImageElement).style.display='none'" />
          </div>
        </div>

        <!-- Video block -->
        <div v-else-if="block.type === 'video'" class="block-content">
          <input v-model="block.content.url" placeholder="URL vidéo (YouTube, MP4 direct...)" class="fh-input" />
          <input v-model="block.content.caption" placeholder="Légende (optionnel)" class="fh-input mt-1" />
          <div v-if="isYoutube(block.content.url)" class="video-embed-preview">
            <iframe :src="youtubeEmbed(block.content.url)" allowfullscreen width="480" height="270" />
          </div>
        </div>

        <!-- Code block -->
        <div v-else-if="block.type === 'code'" class="block-content">
          <div class="row mb-2">
            <input v-model="block.content.language" placeholder="js" class="fh-input" style="width:100px" />
            <input v-model="block.content.filename" placeholder="Nom du fichier (optionnel)" class="fh-input" />
          </div>
          <textarea v-model="block.content.code" placeholder="// Code ici" class="fh-textarea code-ta" rows="8" spellcheck="false" />
        </div>

        <!-- Embed block -->
        <div v-else-if="block.type === 'embed'" class="block-content embed-in-tutorial">
          <EmbedBuilder v-model="block.content" />
          <div class="embed-preview-inline">
            <EmbedPreview :embed="block.content" />
          </div>
        </div>

        <!-- Separator -->
        <div v-else-if="block.type === 'separator'" class="block-content separator-block">
          <hr />
          <span style="font-size:11px;color:var(--text-muted)">Séparateur</span>
        </div>

        <!-- Callout block -->
        <div v-else-if="block.type === 'callout'" class="block-content">
          <select v-model="block.content.type" class="fh-select mb-2">
            <option value="info">ℹ️ Info</option>
            <option value="warning">⚠️ Avertissement</option>
            <option value="success">✅ Succès</option>
            <option value="danger">❌ Danger</option>
          </select>
          <div class="block-textarea-row">
            <textarea
              :ref="(el) => { if (el) blockCalloutRefs.set(block.id, el as HTMLTextAreaElement) }"
              v-model="block.content.text" placeholder="Contenu du callout..." class="fh-textarea" rows="3" />
            <EmojiPicker @select="(e) => insertBlockEmoji(block.id, 'callout', e)" />
          </div>
        </div>
      </div>

      <!-- Add block palette -->
      <div class="add-palette">
        <span class="palette-label">+ Ajouter un bloc</span>
        <button v-for="bt in blockTypes" :key="bt.type" @click="addBlock(bt.type)" class="add-block-btn">
          {{ bt.icon }} {{ bt.label }}
        </button>
      </div>
    </div>

    <!-- Preview mode -->
    <div v-else class="preview-render">
      <article class="tutorial-article">
        <h1>{{ tutorial.title }}</h1>
        <p v-if="tutorial.description" class="article-desc">{{ tutorial.description }}</p>
        <hr />
        <div v-for="block in tutorial.blocks" :key="block.id" class="rendered-block">
          <div v-if="block.type === 'text'" class="text-render" v-html="renderText(block.content)" />
          <figure v-else-if="block.type === 'image'" class="img-render">
            <img :src="block.content.url" alt="" />
            <figcaption v-if="block.content.caption">{{ block.content.caption }}</figcaption>
          </figure>
          <div v-else-if="block.type === 'video'" class="video-render">
            <iframe v-if="isYoutube(block.content.url)" :src="youtubeEmbed(block.content.url)" allowfullscreen width="640" height="360" />
            <video v-else :src="block.content.url" controls style="max-width:100%" />
            <p v-if="block.content.caption" class="caption">{{ block.content.caption }}</p>
          </div>
          <div v-else-if="block.type === 'code'" class="code-render">
            <div class="code-header">
              <span v-if="block.content.filename">{{ block.content.filename }}</span>
              <span class="code-lang">{{ block.content.language }}</span>
            </div>
            <pre><code>{{ block.content.code }}</code></pre>
          </div>
          <EmbedPreview v-else-if="block.type === 'embed'" :embed="block.content" />
          <hr v-else-if="block.type === 'separator'" />
          <div v-else-if="block.type === 'callout'" :class="['callout', `callout-${block.content.type}`]" v-html="renderText(block.content.text)" />
        </div>
      </article>
    </div>

    <p v-if="saveMsg" class="save-toast">{{ saveMsg }}</p>

    <!-- Modal : Envoyer sur Discord -->
    <div v-if="showSendModal" class="modal-overlay" @click.self="showSendModal = false">
      <div class="modal send-modal">
        <h3>🚀 Envoyer sur Discord</h3>

        <!-- Onglets Webhook / Bot -->
        <div class="send-tabs">
          <button :class="['send-tab', { active: sendMode === 'webhook' }]" @click="sendMode = 'webhook'">🔗 Webhook</button>
          <button :class="['send-tab', { active: sendMode === 'bot' }]" @click="sendMode = 'bot'">🤖 Bot</button>
        </div>

        <!-- Mode Webhook -->
        <template v-if="sendMode === 'webhook'">
          <div class="section">
            <label class="fh-label">Webhook *</label>
            <select v-model="sendWebhookId" class="fh-select">
              <option :value="null" disabled>— Choisir un webhook —</option>
              <option v-for="w in sendWebhooks" :key="w.id" :value="w.id">{{ w.name }} ({{ w.category }})</option>
            </select>
          </div>
          <div class="section">
            <label class="fh-label">Thread ID <span style="color:var(--text-muted);font-weight:400">(optionnel)</span></label>
            <input v-model="sendThreadId" placeholder="ID du thread Discord" class="fh-input" />
          </div>
        </template>

        <!-- Mode Bot -->
        <template v-else>
          <div class="section">
            <label class="fh-label">Bot *</label>
            <select v-model="sendBotId" class="fh-select">
              <option :value="null" disabled>— Choisir un bot —</option>
              <option v-for="b in sendBots" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>

          <!-- Liste destinations ajoutées -->
          <div v-if="botDestinations.length" class="section">
            <label class="fh-label">📌 Destinations ({{ botDestinations.length }})</label>
            <div class="dest-list">
              <div v-for="(d, i) in botDestinations" :key="i" class="dest-tag">
                <span>#{{ d.label }}</span>
                <button @click="removeDestination(i)" class="dest-remove">✕</button>
              </div>
            </div>
          </div>

          <!-- Picker pour ajouter une destination -->
          <div class="section">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <label class="fh-label" style="margin:0">
                {{ botDestinations.length ? '➕ Ajouter un canal' : 'Canal *' }}
              </label>
              <button v-if="!pickingDest && botDestinations.length" @click="pickingDest = true"
                class="btn-secondary" style="font-size:11px;padding:3px 8px">+ Ajouter</button>
            </div>
            <div v-if="!botDestinations.length || pickingDest">
              <BotChannelPicker :bot-id="sendBotId" @select="onBotChannelSelect" />
              <div v-if="pickingDest" style="display:flex;gap:6px;margin-top:6px">
                <button @click="addDestination" class="btn-primary"
                  :disabled="!lastPickedDest" style="font-size:12px;padding:5px 12px">
                  ✓ Ajouter ce canal
                </button>
                <button @click="pickingDest = false" class="btn-secondary" style="font-size:12px;padding:5px 10px">Annuler</button>
              </div>
            </div>
          </div>
        </template>

        <!-- Aperçu commun -->
        <div v-if="sendParts.length" class="section">
          <div class="send-preview-header">Aperçu — <strong>{{ sendParts.length }}</strong> message{{ sendParts.length > 1 ? 's' : '' }} à envoyer</div>
          <div class="send-parts-list">
            <div v-for="(p, i) in sendParts" :key="i" class="send-part">
              <span class="send-part-num">Message {{ i + 1 }}</span>
              <span class="send-part-type">{{ p.embeds?.length ? '📦 embed' : '💬 texte' }}</span>
              <span class="send-part-preview">{{ partPreview(p) }}</span>
            </div>
          </div>
        </div>

        <div v-if="sendProgress > 0 && sending" class="progress-bar-wrap">
          <div class="progress-bar" :style="{ width: (sendProgress / sendParts.length * 100) + '%' }"></div>
          <span class="progress-label">{{ sendProgress }} / {{ sendParts.length }}</span>
        </div>
        <p v-if="sendError" class="error">{{ sendError }}</p>

        <div class="modal-actions">
          <button @click="doSend" class="btn-primary"
            :disabled="(sendMode === 'webhook' ? !sendWebhookId : (!sendBotChannelId && !botDestinations.length)) || sending || !sendParts.length">
            {{ sending
              ? `⏳ Envoi ${sendProgress}/${sendParts.length * Math.max(1, botDestinations.length)}…`
              : `🚀 Envoyer${botDestinations.length > 1 ? ` × ${botDestinations.length} canaux` : ''} (${sendParts.length} msg)` }}
          </button>
          <button @click="showSendModal = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal : Convertir en template embed -->
    <div v-if="showTplConvertModal" class="modal-overlay" @click.self="showTplConvertModal = false">
      <div class="modal tpl-convert-modal">
        <h3>📤 Convertir en template embed</h3>
        <div class="section">
          <label class="fh-label">Nom du template *</label>
          <input v-model="tplConvertName" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Catégorie</label>
          <input v-model="tplConvertCategory" placeholder="tutoriaux" class="fh-input" />
        </div>
        <div class="section">
          <label class="fh-label">Couleur (hex)</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input v-model="tplConvertColor" placeholder="#5865F2" class="fh-input" style="max-width:130px" />
            <span class="color-dot" :style="{ background: tplConvertColor }"></span>
          </div>
        </div>
        <div v-if="tplConvertEmbed" class="section">
          <label class="fh-label">Aperçu Discord</label>
          <div class="tpl-convert-preview">
            <EmbedPreview :embed="tplConvertEmbed" />
          </div>
        </div>
        <p v-if="tplConvertError" class="error">{{ tplConvertError }}</p>
        <div class="modal-actions">
          <button @click="doTplConvert" class="btn-primary" :disabled="tplConvertSaving">
            {{ tplConvertSaving ? '⏳ Sauvegarde…' : '💾 Sauver comme template' }}
          </button>
          <button @click="showTplConvertModal = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Modal templates pré-faits -->
    <div v-if="showTplModal" class="modal-overlay" @click.self="showTplModal = false">
      <div class="modal tpl-modal">
        <h3>📋 Templates de tutoriel</h3>
        <div class="tpl-grid">
          <div v-for="tpl in tutorialTemplates" :key="tpl.name"
            class="tpl-card" @click="applyTemplate(tpl)">
            <div class="tpl-icon">{{ tpl.icon }}</div>
            <div class="tpl-name">{{ tpl.name }}</div>
            <div class="tpl-desc">{{ tpl.desc }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showTplModal = false" class="btn-secondary">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import EmbedPreview from '../components/preview/EmbedPreview.vue'
import BotChannelPicker from '../components/bots/BotChannelPicker.vue'
import EmojiPicker from '../components/shared/EmojiPicker.vue'
import api from '../api/client'
import { emptyEmbed } from '../types/discord'
import type { Tutorial, TutorialBlock, Webhook } from '../types/app'

const route = useRoute()
const router = useRouter()
const previewMode = ref(false)
const saving = ref(false)
const saveMsg = ref('')
const imageFileInput = ref<HTMLInputElement | null>(null)
const uploadingIdx = ref<number | null>(null)
let uploadTargetIdx = -1
const showTplModal = ref(false)

const blockTextareaRefs = ref(new Map<string, HTMLTextAreaElement>())
const blockCalloutRefs = ref(new Map<string, HTMLTextAreaElement>())

function insertBlockEmoji(blockId: string, field: 'content' | 'callout', emoji: string) {
  const block = tutorial.value.blocks.find(b => b.id === blockId)
  if (!block) return
  const el = field === 'content' ? blockTextareaRefs.value.get(blockId) : blockCalloutRefs.value.get(blockId)
  const cur = field === 'content' ? (block.content as string ?? '') : (block.content?.text ?? '')
  const start = el?.selectionStart ?? cur.length
  const end = el?.selectionEnd ?? cur.length
  const newVal = cur.slice(0, start) + emoji + cur.slice(end)
  if (field === 'content') block.content = newVal
  else block.content.text = newVal
  nextTick(() => {
    if (el) {
      el.setSelectionRange(start + emoji.length, start + emoji.length)
      el.focus()
    }
  })
}

const tutorial = ref<Tutorial>({ id: 0, title: '', description: '', blocks: [], published: 0 })

let loaded = false
const isDirty = ref(false)
watch(tutorial, () => { if (loaded) isDirty.value = true }, { deep: true })

onBeforeRouteLeave((_to, _from, next) => {
  if (isDirty.value && !confirm('Modifications non sauvegardées. Quitter quand même ?')) {
    next(false)
  } else {
    next()
  }
})

const blockTypes = [
  { type: 'text', icon: '📝', label: 'Texte' },
  { type: 'image', icon: '🖼', label: 'Image' },
  { type: 'video', icon: '🎬', label: 'Vidéo' },
  { type: 'code', icon: '💻', label: 'Code' },
  { type: 'embed', icon: '📦', label: 'Embed Discord' },
  { type: 'callout', icon: '💡', label: 'Callout' },
  { type: 'separator', icon: '─', label: 'Séparateur' },
] as const

const blockTypeLabels: Record<string, string> = {
  text: '📝 Texte', image: '🖼 Image', video: '🎬 Vidéo',
  code: '💻 Code', embed: '📦 Embed', callout: '💡 Callout', separator: '─ Séparateur'
}
function blockLabel(t: string) { return blockTypeLabels[t] ?? t }

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
]

function mk(type: string, content: any): TutorialBlock {
  return { id: crypto.randomUUID(), type: type as TutorialBlock['type'], content }
}

// ─── Envoyer sur Discord ──────────────────────────────────────────
const showSendModal = ref(false)
const sendMode = ref<'webhook' | 'bot'>('webhook')
const sendWebhookId = ref<number | null>(null)
const sendWebhooks = ref<Webhook[]>([])
const sendThreadId = ref('')
const sendBotId = ref<number | null>(null)
const sendBots = ref<{ id: number; name: string }[]>([])
const sendBotChannelId = ref('')
const sendError = ref('')
const sending = ref(false)
const sendProgress = ref(0)

// Multi-destinations (mode bot)
interface BotDest { channelId: string; label: string }
const botDestinations = ref<BotDest[]>([])
const pickingDest = ref(false)
const lastPickedDest = ref<{ channelId: string; channelName: string } | null>(null)

function onBotChannelSelect(sel: { channelId: string; channelName: string } | null) {
  sendBotChannelId.value = sel?.channelId ?? ''
  lastPickedDest.value = sel ? { channelId: sel.channelId, channelName: sel.channelName } : null
}

function addDestination() {
  if (!lastPickedDest.value) return
  const already = botDestinations.value.some(d => d.channelId === lastPickedDest.value!.channelId)
  if (!already) botDestinations.value.push({ channelId: lastPickedDest.value.channelId, label: lastPickedDest.value.channelName })
  pickingDest.value = false
}

function removeDestination(i: number) { botDestinations.value.splice(i, 1) }

function tutorialToDiscordParts(blocks: TutorialBlock[], title: string): any[] {
  const calloutEmoji: Record<string, string> = { warning: '⚠️', success: '✅', danger: '❌', info: 'ℹ️' }
  const embeds: any[] = []
  let textBuf = ''

  for (const b of blocks) {
    if (b.type === 'text') {
      textBuf += (textBuf ? '\n' : '') + b.content
    } else if (b.type === 'code') {
      const lang = b.content?.language ?? ''
      textBuf += (textBuf ? '\n' : '') + `\`\`\`${lang}\n${b.content?.code ?? ''}\n\`\`\``
    } else if (b.type === 'callout') {
      const emoji = calloutEmoji[b.content?.type ?? 'info'] ?? 'ℹ️'
      textBuf += (textBuf ? '\n' : '') + `> ${emoji} ${(b.content?.text ?? '').replace(/\n/g, '\n> ')}`
    } else if (b.type === 'separator') {
      textBuf += (textBuf ? '\n' : '') + '──────────'
    } else if (b.type === 'video') {
      textBuf += (textBuf ? '\n' : '') + (b.content?.url ?? '')
    } else if (b.type === 'image') {
      // Texte accumulé + image → un seul embed
      const embed: any = {}
      if (textBuf.trim()) embed.description = textBuf.trim().slice(0, 4096)
      if (b.content?.url) embed.image = { url: b.content.url }
      if (embed.description || embed.image) embeds.push(embed)
      textBuf = ''
    } else if (b.type === 'embed') {
      if (textBuf.trim()) { embeds.push({ description: textBuf.trim().slice(0, 4096) }); textBuf = '' }
      embeds.push(b.content)
    }
  }
  // Flush texte restant sans image suivante
  if (textBuf.trim()) embeds.push({ description: textBuf.trim().slice(0, 4096) })

  if (!embeds.length) return []

  // Regrouper en messages de max 10 embeds (limite Discord)
  const messages: any[] = []
  for (let i = 0; i < embeds.length; i += 10) {
    const msg: any = { embeds: embeds.slice(i, i + 10) }
    if (i === 0) msg.content = `**${title}**`
    messages.push(msg)
  }
  return messages
}

const sendParts = computed(() =>
  tutorial.value.blocks.length ? tutorialToDiscordParts(tutorial.value.blocks, tutorial.value.title || 'Tutoriel') : []
)

function partPreview(p: any): string {
  const ec = p.embeds?.length ?? 0
  if (ec > 0) {
    const imgs = p.embeds.filter((e: any) => e.image?.url).length
    return `${ec} embed${ec > 1 ? 's' : ''} — ${imgs} image${imgs !== 1 ? 's' : ''}`
  }
  return p.content?.slice(0, 80).replace(/\n/g, ' ') ?? '(vide)'
}

async function openSendModal() {
  sendError.value = ''
  sendProgress.value = 0
  sendThreadId.value = ''
  sendBotChannelId.value = ''
  const [wh, bots] = await Promise.all([
    sendWebhooks.value.length ? null : api.get('/webhooks'),
    sendBots.value.length ? null : api.get('/bots'),
  ])
  if (wh) sendWebhooks.value = wh.data
  if (bots) sendBots.value = bots.data
  showSendModal.value = true
}

async function sendPartsTo(channelId: string | null) {
  for (let pi = 0; pi < sendParts.value.length; pi++) {
    const part = sendParts.value[pi]
    let attempts = 3
    while (attempts > 0) {
      try {
        if (sendMode.value === 'webhook') {
          if (!sendWebhookId.value) return
          await api.post('/discord/send', {
            webhook_id: sendWebhookId.value,
            payload: part,
            thread_id: sendThreadId.value || undefined,
          })
        } else {
          const cid = channelId ?? sendBotChannelId.value
          if (!sendBotId.value || !cid) return
          await api.post('/bots/send', { bot_id: sendBotId.value, channel_id: cid, payload: part })
        }
        sendProgress.value++
        break
      } catch (e: any) {
        let retryAfter: number | null = null
        const errStr = e?.response?.data?.error
        if (typeof errStr === 'string') {
          try { retryAfter = JSON.parse(errStr)?.retry_after ?? null } catch {}
        }
        if (retryAfter && attempts > 1) {
          await new Promise(r => setTimeout(r, Math.ceil(retryAfter! * 1000) + 300))
          attempts--
        } else {
          let msg = errStr ?? 'Erreur lors de l\'envoi'
          try { msg = JSON.parse(msg)?.message ?? msg } catch {}
          throw new Error(msg)
        }
      }
    }
    if (pi < sendParts.value.length - 1) await new Promise(r => setTimeout(r, 600))
  }
}

async function doSend() {
  if (!sendParts.value.length) return
  sending.value = true
  sendError.value = ''
  sendProgress.value = 0
  try {
    const dests = sendMode.value === 'bot' && botDestinations.value.length > 0
      ? botDestinations.value.map(d => d.channelId)
      : [null]
    for (const dest of dests) {
      await sendPartsTo(dest)
      if (dests.length > 1 && dest !== dests[dests.length - 1]) await new Promise(r => setTimeout(r, 1000))
    }
    showSendModal.value = false
    const destCount = dests.length
    saveMsg.value = destCount > 1
      ? `✅ Tutoriel envoyé sur ${destCount} canaux !`
      : '✅ Tutoriel envoyé sur Discord !'
    setTimeout(() => { saveMsg.value = '' }, 3000)
  } catch (e: any) {
    sendError.value = e?.message ?? 'Erreur lors de l\'envoi'
  } finally {
    sending.value = false
  }
}

// ─── Convertir en template embed ─────────────────────────────────
const showTplConvertModal = ref(false)
const tplConvertName = ref('')
const tplConvertCategory = ref('tutoriaux')
const tplConvertColor = ref('#5865F2')
const tplConvertError = ref('')
const tplConvertSaving = ref(false)

function tutorialToEmbed(tut: Tutorial) {
  const colorHex = tplConvertColor.value.replace('#', '')
  const color = parseInt(colorHex, 16) || 0x5865f2
  const fields: { name: string; value: string; inline: boolean }[] = []
  let description = ''
  let imageUrl = ''
  let thumbnailUrl = ''
  let sectionIdx = 0

  for (const b of tut.blocks) {
    if (b.type === 'text') {
      if (!description) {
        description = (b.content as string).slice(0, 4096)
      } else {
        sectionIdx++
        const val = (b.content as string).slice(0, 1024)
        if (fields.length < 25) fields.push({ name: `Section ${sectionIdx}`, value: val, inline: false })
      }
    } else if (b.type === 'image' && b.content?.url) {
      if (!imageUrl) imageUrl = b.content.url
      else if (!thumbnailUrl) thumbnailUrl = b.content.url
    } else if (b.type === 'code') {
      const lang = b.content?.language ?? ''
      const code = (b.content?.code ?? '').slice(0, 990)
      if (fields.length < 25) fields.push({ name: `💻 Code${lang ? ` (${lang})` : ''}`, value: `\`\`\`${lang}\n${code}\n\`\`\``, inline: false })
    } else if (b.type === 'callout') {
      const emoji: Record<string, string> = { warning: '⚠️', success: '✅', danger: '❌', info: 'ℹ️' }
      const e = emoji[b.content?.type ?? 'info'] ?? 'ℹ️'
      const val = `${e} ${(b.content?.text ?? '').slice(0, 1020)}`
      if (fields.length < 25) fields.push({ name: 'Note', value: val, inline: false })
    }
  }

  return {
    title: tut.title.slice(0, 256),
    description,
    color,
    fields,
    image: imageUrl ? { url: imageUrl } : { url: '' },
    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : { url: '' },
    author: { name: '', url: '', icon_url: '' },
    footer: { text: '', icon_url: '' },
    url: '',
    timestamp: '',
  }
}

const tplConvertEmbed = computed(() =>
  showTplConvertModal.value ? tutorialToEmbed(tutorial.value) : null
)

function openTplConvert() {
  tplConvertName.value = tutorial.value.title || 'Mon template'
  tplConvertCategory.value = 'tutoriaux'
  tplConvertColor.value = '#5865F2'
  tplConvertError.value = ''
  showTplConvertModal.value = true
}

async function doTplConvert() {
  if (!tplConvertName.value.trim()) { tplConvertError.value = 'Nom requis'; return }
  tplConvertSaving.value = true
  tplConvertError.value = ''
  try {
    const embed = tutorialToEmbed(tutorial.value)
    await api.post('/templates', {
      name: tplConvertName.value.trim(),
      description: tutorial.value.description ?? '',
      category: tplConvertCategory.value.trim() || 'tutoriaux',
      preview_color: tplConvertColor.value.match(/^#[0-9a-fA-F]{6}$/) ? tplConvertColor.value : '#5865F2',
      payload: { content: '', embeds: [embed] },
    })
    showTplConvertModal.value = false
    saveMsg.value = '✅ Template embed créé !'
    setTimeout(() => { saveMsg.value = '' }, 3000)
  } catch (e: any) {
    tplConvertError.value = e?.response?.data?.error ?? 'Erreur lors de la sauvegarde'
  } finally {
    tplConvertSaving.value = false
  }
}

// ─── Templates pré-faits ─────────────────────────────────────────
function applyTemplate(tpl: typeof tutorialTemplates[0]) {
  if (tutorial.value.blocks.length > 0 && !confirm('Remplacer les blocs existants par ce template ?')) return
  tutorial.value.title = tutorial.value.title || tpl.name
  tutorial.value.blocks = tpl.blocks.map(b => ({ ...b, id: crypto.randomUUID() }))
  showTplModal.value = false
}

onMounted(async () => {
  const id = route.params.id
  if (id && id !== 'new') {
    const { data } = await api.get(`/tutorials/${id}`)
    tutorial.value = data
  }
  loaded = true
})

function defaultContent(type: string): any {
  const map: Record<string, any> = {
    text: '',
    image: { url: '', caption: '' },
    video: { url: '', caption: '' },
    code: { language: 'js', code: '', filename: '' },
    embed: emptyEmbed(),
    callout: { type: 'info', text: '' },
    separator: null,
  }
  return map[type] ?? ''
}

function addBlock(type: string) {
  const block: TutorialBlock = {
    id: crypto.randomUUID(),
    type: type as TutorialBlock['type'],
    content: defaultContent(type),
  }
  tutorial.value.blocks.push(block)
}

function removeBlock(i: number) { tutorial.value.blocks.splice(i, 1) }

function triggerImageUpload(idx: number) {
  uploadTargetIdx = idx
  imageFileInput.value?.click()
}

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || uploadTargetIdx < 0) return
  const idx = uploadTargetIdx
  uploadingIdx.value = idx
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    tutorial.value.blocks[idx].content.url = data.url
  } catch {
    // silently ignore upload errors — URL field stays empty
  } finally {
    uploadingIdx.value = null
    if (imageFileInput.value) imageFileInput.value.value = ''
  }
}

function moveBlock(i: number, dir: -1 | 1) {
  const b = tutorial.value.blocks
  const j = i + dir
  if (j < 0 || j >= b.length) return
  ;[b[i], b[j]] = [b[j], b[i]]
}

function duplicate(i: number) {
  const copy = JSON.parse(JSON.stringify(tutorial.value.blocks[i]))
  copy.id = crypto.randomUUID()
  tutorial.value.blocks.splice(i + 1, 0, copy)
}

// Drag & drop blocs (#6)
const dragBlockIdx = ref(-1)
const dropBlockIdx = ref(-1)

function dropBlock(targetIdx: number) {
  if (dragBlockIdx.value === -1 || dragBlockIdx.value === targetIdx) return
  const blocks = tutorial.value.blocks
  const [moved] = blocks.splice(dragBlockIdx.value, 1)
  blocks.splice(targetIdx, 0, moved)
  dragBlockIdx.value = -1
  dropBlockIdx.value = -1
}

async function save() {
  if (!tutorial.value.title.trim()) { saveMsg.value = '⚠️ Titre requis'; setTimeout(() => saveMsg.value = '', 3000); return }
  saving.value = true
  try {
    if (tutorial.value.id) {
      await api.put(`/tutorials/${tutorial.value.id}`, tutorial.value)
    } else {
      const { data } = await api.post('/tutorials', tutorial.value)
      tutorial.value.id = data.id
      router.replace(`/tutorials/${data.id}`)
    }
    saveMsg.value = '✅ Tutoriel sauvegardé !'
    isDirty.value = false
    setTimeout(() => { saveMsg.value = '' }, 3000)
  } catch (e: any) {
    saveMsg.value = `⚠️ Erreur : ${e?.response?.data?.error || 'Problème lors de la sauvegarde'}`
    setTimeout(() => { saveMsg.value = '' }, 5000)
  } finally {
    saving.value = false
  }
}

function renderText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>')
}

function isYoutube(url: string): boolean {
  return !!url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

function youtubeEmbed(url: string): string {
  const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
  return `https://www.youtube.com/embed/${id}`
}
</script>

<style scoped>
.tutorial-editor { display: flex; flex-direction: column; height: 100%; gap: 12px; }
.editor-topbar { display: flex; gap: 12px; align-items: center; }
.title-input { flex: 1; font-size: 18px; font-weight: 700; }
.topbar-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.desc-input { max-width: 600px; }
.publish-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--text-muted); }
.publish-toggle input { accent-color: #57f287; }

.blocks-area { flex: 1; overflow-y: auto; padding-bottom: 24px; }
.block-wrapper { background: var(--bg-secondary); border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border); overflow: hidden; cursor: default; }
.block-dragging { opacity: 0.4; }
.block-dragover { border-color: var(--accent); background: rgba(88,101,242,.08); }
.block-controls { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); }
.drag-handle { cursor: grab; font-size: 16px; color: var(--text-muted); user-select: none; }
.block-type-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent); letter-spacing: 0.5px; flex: 1; }
.block-btns { display: flex; gap: 4px; }
.ctrl-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 13px; }
.ctrl-btn:hover { color: #fff; border-color: var(--text-muted); }
.ctrl-btn.danger:hover { color: var(--danger); border-color: var(--danger); }
.ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.block-content { padding: 14px; }
.block-textarea-row { display: flex; gap: 6px; align-items: flex-start; }
.block-textarea-row .fh-textarea { flex: 1; }
.block-textarea-row .emoji-picker-wrapper { flex-shrink: 0; margin-top: 0; }
.block-textarea { min-height: 100px; }
.code-ta { font-family: 'Consolas', monospace; font-size: 13px; }
.img-upload-row { display: flex; gap: 6px; align-items: center; }
.upload-btn { padding: 6px 10px; flex-shrink: 0; }
.img-preview { margin-top: 10px; }
.img-preview img { max-width: 100%; max-height: 300px; border-radius: 6px; object-fit: cover; }
.video-embed-preview { margin-top: 10px; }
.separator-block { display: flex; align-items: center; gap: 10px; }
.add-palette { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px dashed var(--border); margin-top: 8px; }
.palette-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.add-block-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 12px; transition: all .15s; }
.add-block-btn:hover { color: #fff; border-color: var(--accent); background: rgba(88,101,242,.15); }
.embed-in-tutorial { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.embed-preview-inline { padding: 8px; background: #36393f; border-radius: 8px; }
.save-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #57f287; color: #000; padding: 10px 20px; border-radius: 8px; font-weight: 700; z-index: 999; }

/* Preview */
.preview-render { flex: 1; overflow-y: auto; }
.tutorial-article { max-width: 800px; margin: 0 auto; color: #dcddde; }
.tutorial-article h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #fff; }
.article-desc { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; }
.tutorial-article hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
.rendered-block { margin-bottom: 20px; }
.text-render { line-height: 1.7; white-space: pre-wrap; }
.img-render img { max-width: 100%; border-radius: 8px; }
.img-render figcaption { font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 4px; }
.video-render iframe { max-width: 100%; border-radius: 8px; }
.caption { font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 4px; }
.code-render { background: var(--bg-tertiary); border-radius: 8px; overflow: hidden; }
.code-header { display: flex; justify-content: space-between; padding: 6px 12px; background: rgba(0,0,0,.3); font-size: 12px; color: var(--text-muted); }
.code-render pre { padding: 12px; overflow-x: auto; font-size: 13px; }
.code-lang { text-transform: uppercase; font-weight: 700; }
.callout { padding: 12px 16px; border-radius: 8px; border-left: 4px solid; line-height: 1.6; }
.callout-info { background: rgba(88,101,242,.15); border-color: #5865f2; }
.callout-warning { background: rgba(254,231,92,.1); border-color: #fee75c; }
.callout-success { background: rgba(87,242,135,.1); border-color: #57f287; }
.callout-danger { background: rgba(237,66,69,.15); border-color: #ed4245; }

/* Send modal */
.send-modal { max-width: 600px; }
.send-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--bg-tertiary); border-radius: 8px; padding: 4px; }
.send-tab { flex: 1; padding: 7px; border: none; border-radius: 6px; background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
.send-tab.active { background: var(--accent); color: #fff; }
.send-tab:hover:not(.active) { color: #fff; }
.send-preview-header { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.send-parts-list { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; background: var(--bg-tertiary); max-height: 220px; overflow-y: auto; }
.send-part { display: flex; gap: 10px; align-items: baseline; padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 12px; }
.send-part:last-child { border-bottom: none; }
.send-part-num { color: var(--text-muted); white-space: nowrap; min-width: 70px; }
.send-part-type { color: var(--accent); white-space: nowrap; font-weight: 700; min-width: 80px; }
.send-part-preview { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.progress-bar-wrap { position: relative; height: 8px; background: var(--bg-tertiary); border-radius: 4px; margin: 10px 0; overflow: hidden; }
.progress-bar { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.3s; }
.progress-label { position: absolute; right: 0; top: -18px; font-size: 11px; color: var(--text-muted); }
.dest-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.dest-tag { display: flex; align-items: center; gap: 4px; background: rgba(88,101,242,.15); border: 1px solid rgba(88,101,242,.3); border-radius: 16px; padding: 4px 10px; font-size: 12px; color: #7289da; }
.dest-remove { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 11px; padding: 0 2px; line-height: 1; }
.dest-remove:hover { color: #ed4245; }

/* Template convert modal */
.tpl-convert-modal { max-width: 620px; }
.tpl-convert-preview { background: #36393f; border-radius: 8px; padding: 12px; margin-top: 6px; }
.color-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; }

/* Template modal */
.tpl-modal { max-width: 700px; }
.tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin: 12px 0; }
.tpl-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer; text-align: center; transition: all .15s; }
.tpl-card:hover { border-color: var(--accent); background: rgba(88,101,242,.1); transform: translateY(-1px); }
.tpl-icon { font-size: 28px; margin-bottom: 6px; }
.tpl-name { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 4px; }
.tpl-desc { font-size: 11px; color: var(--text-muted); }
.mt-1 { margin-top: 6px; }
.mb-2 { margin-bottom: 8px; }
.row { display: flex; gap: 8px; }
</style>
