<template>
  <div class="tutorial-editor">
    <div class="editor-topbar">
      <input v-model="tutorial.title" placeholder="Titre du tutoriel..." class="fh-input title-input" />
      <div class="topbar-actions">
        <button @click="showTplModal = true" class="btn-secondary" title="Templates pré-faits">📋 Templates</button>
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
      <div v-for="(block, i) in tutorial.blocks" :key="block.id" class="block-wrapper">
        <div class="block-controls">
          <span class="drag-handle" title="Déplacer">⠿</span>
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
          <textarea v-model="block.content"
            placeholder="Texte — **gras**, *italique*, `code`, [lien](url), ~~barré~~"
            class="fh-textarea block-textarea" rows="5" />
        </div>

        <!-- Image block -->
        <div v-else-if="block.type === 'image'" class="block-content">
          <input v-model="block.content.url" placeholder="URL de l'image" class="fh-input" />
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
          <textarea v-model="block.content.text" placeholder="Contenu du callout..." class="fh-textarea" rows="3" />
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import EmbedPreview from '../components/preview/EmbedPreview.vue'
import api from '../api/client'
import { emptyEmbed } from '../types/discord'
import type { Tutorial, TutorialBlock } from '../types/app'

const route = useRoute()
const router = useRouter()
const previewMode = ref(false)
const saving = ref(false)
const saveMsg = ref('')
const showTplModal = ref(false)

const tutorial = ref<Tutorial>({ id: 0, title: '', description: '', blocks: [], published: 0 })

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
.block-wrapper { background: var(--bg-secondary); border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border); overflow: hidden; }
.block-controls { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); }
.drag-handle { cursor: grab; font-size: 16px; color: var(--text-muted); user-select: none; }
.block-type-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent); letter-spacing: 0.5px; flex: 1; }
.block-btns { display: flex; gap: 4px; }
.ctrl-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 13px; }
.ctrl-btn:hover { color: #fff; border-color: var(--text-muted); }
.ctrl-btn.danger:hover { color: var(--danger); border-color: var(--danger); }
.ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.block-content { padding: 14px; }
.block-textarea { min-height: 100px; }
.code-ta { font-family: 'Consolas', monospace; font-size: 13px; }
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
