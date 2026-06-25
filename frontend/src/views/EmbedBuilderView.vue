<template>
  <div class="builder-layout">
    <!-- Panneau gauche : éditeur -->
    <div class="editor-panel">
      <div class="panel-header">
        <h2>⚡ Constructeur d'embed</h2>
        <div class="actions">
          <button @click="embedStore.undo()" class="btn-secondary" :disabled="!embedStore.undoStack.length" title="Annuler (Ctrl+Z)">↩</button>
          <button @click="embedStore.redo()" class="btn-secondary" :disabled="!embedStore.redoStack.length" title="Rétablir (Ctrl+Y)">↪</button>
          <button @click="openDiscordImport" class="btn-secondary" title="Importer depuis Discord via bot">📥 Discord</button>
          <button @click="showJsonImport = true" class="btn-secondary" title="Importer un payload JSON">📋 JSON</button>
          <button @click="showExport = true" class="btn-secondary" title="Exporter l'embed">📤 Export</button>
          <button @click="showFonts = true" class="btn-secondary" title="Convertisseur de polices">🔤</button>
          <button @click="showTemplates = true" class="btn-secondary" title="Charger un template">📋</button>
          <button @click="saveAsTemplate" class="btn-secondary" title="Sauver comme template">💾</button>
          <button @click="showVarsInfo = true" class="btn-secondary" title="Variables dynamiques">🔄</button>
        </div>
      </div>
      <div v-if="draftRestored" class="draft-banner">
        📝 Brouillon restauré — <button @click="embedStore.reset(); draftRestored = false" style="background:none;border:none;color:inherit;cursor:pointer;font-size:12px;text-decoration:underline">Effacer</button>
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
          <span class="section-hint">{{ stepMode ? 'Une étape = un embed (titre + explication + screenshot)' : 'Cartes visuelles richement formatées' }}</span>
          <button @click="stepMode = !stepMode" class="btn-secondary step-toggle-btn">
            {{ stepMode ? '⚙️ Mode Avancé' : '📚 Mode Étapes' }}
          </button>
        </div>

        <!-- MODE ÉTAPES : titre + explication + code + screenshot par étape -->
        <template v-if="stepMode">
          <!-- Couleur globale pour toutes les étapes -->
          <div class="step-global-color">
            <label class="fh-label">🎨 Couleur de toutes les étapes</label>
            <div class="step-color-row">
              <input type="color" v-model="stepGlobalColor" @input="applyGlobalColor" class="step-color-input" />
              <span class="step-color-hex">{{ stepGlobalColor }}</span>
              <button @click="stepGlobalColor = '#5865F2'; applyGlobalColor()" class="btn-secondary" style="font-size:11px;padding:3px 8px">Reset</button>
            </div>
          </div>

          <div v-for="(embed, i) in embedStore.message.embeds" :key="i" class="step-card"
            :class="{ dragging: dragIdx === i, dragover: dropIdx === i }"
            draggable="true"
            @dragstart="dragIdx = i"
            @dragend="dragIdx = -1; dropIdx = -1"
            @dragover.prevent="dropIdx = i"
            @dragleave="dropIdx = -1"
            @drop.prevent="dropStep(i)">
            <div class="step-card-header">
              <span class="drag-handle" title="Glisser pour réordonner">⠿</span>
              <span class="step-badge">Étape {{ i + 1 }}</span>
              <div style="display:flex;gap:6px">
                <button @click="toggleStepCode(i)" class="btn-secondary step-code-btn"
                  :class="{ active: stepShowCode[i] }" title="Ajouter un bloc de code">💻 Code</button>
                <button v-if="embedStore.message.embeds.length > 1"
                  @click="embedStore.removeEmbed(i)" class="btn-danger-sm">✕</button>
              </div>
            </div>
            <div class="step-fields">
              <input v-model="embed.title" placeholder="Titre de l'étape (ex: Installation)" class="fh-input" maxlength="256" />
              <textarea v-model="embed.description" placeholder="Explication détaillée de cette étape..."
                class="fh-textarea" rows="3" />

              <!-- Bloc code inline -->
              <div v-if="stepShowCode[i]" class="step-code-editor">
                <div class="step-code-bar">
                  <select v-model="stepCodeLang[i]" class="fh-select step-lang-select">
                    <option value="">Aucun (texte brut)</option>
                    <option v-for="l in codeLangs" :key="l" :value="l">{{ l }}</option>
                  </select>
                  <button @click="insertStepCode(i)" class="btn-primary" style="font-size:12px;padding:4px 10px">
                    ↩ Insérer dans l'explication
                  </button>
                </div>
                <textarea v-model="stepCodeContent[i]" placeholder="Collez votre code ici..."
                  class="fh-textarea step-code-textarea" rows="5" spellcheck="false" />
              </div>

              <div class="step-img-row">
                <input v-model="embed.image!.url" placeholder="URL du screenshot (ou cliquer 📤 pour importer)" class="fh-input" />
                <input :ref="(el) => { if (el) stepImgInputs[i] = el as HTMLInputElement }"
                  type="file" accept="image/*" style="display:none" @change="(e) => uploadStepImage(i, e)" />
                <button @click="stepImgInputs[i]?.click()" class="btn-secondary" title="Importer un screenshot">📤</button>
              </div>
              <img v-if="embed.image?.url" :src="embed.image.url" class="step-preview-img" alt="screenshot"
                @error="($event.target as HTMLImageElement).style.display='none'" />
            </div>
          </div>

          <button @click="addStep" class="btn-add" :disabled="embedStore.message.embeds.length >= 100">
            ➕ Ajouter une étape ({{ embedStore.message.embeds.length }}/100)
          </button>
          <div v-if="embedStore.message.embeds.length > 10" class="embed-chunk-hint">
            ℹ️ {{ Math.ceil(embedStore.message.embeds.length / 10) }} messages Discord seront envoyés (10 étapes/message)
          </div>
        </template>

        <!-- MODE AVANCÉ : éditeur embed complet -->
        <template v-else>
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
            :disabled="embedStore.message.embeds.length >= 100">
            + Ajouter un embed ({{ embedStore.message.embeds.length }}/100)
          </button>
          <div v-if="embedStore.message.embeds.length > 10" class="embed-chunk-hint">
            ℹ️ {{ Math.ceil(embedStore.message.embeds.length / 10) }} messages Discord seront envoyés (max 10 embeds/message)
          </div>
        </template>
      </div>

      <!-- SECTION 4 : Envoyer -->
      <div class="editor-section send-section">
        <div class="section-title">
          <span class="section-num">4</span>
          <span>{{ isEditMode ? '✏️ Mettre à jour le message' : 'Envoyer' }}</span>
          <span v-if="isEditMode" class="edit-mode-badge">Mode édition actif</span>
        </div>

        <!-- Bannière mode édition -->
        <div v-if="isEditMode" class="edit-mode-banner">
          ✏️ Tu modifies un message existant — clique <strong>Mettre à jour</strong> pour appliquer les changements sur Discord.
          <button @click="router.push('/embed')" class="btn-secondary" style="font-size:11px;padding:3px 8px;margin-left:8px">✕ Annuler édition</button>
        </div>

        <!-- Mode toggle -->
        <div class="send-mode-tabs">
          <button :class="{ active: sendMode === 'webhook' }" @click="sendMode = 'webhook'">🔗 Webhook</button>
          <button :class="{ active: sendMode === 'bot' }" @click="sendMode = 'bot'">🤖 Bot Discord</button>
          <button :class="{ active: sendMode === 'schedule' }" @click="sendMode = 'schedule'">⏰ Programmer</button>
        </div>

        <!-- Mode Webhook -->
        <div v-if="sendMode === 'webhook'" class="send-area" style="flex-direction:column;gap:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <select v-model="embedStore.selectedWebhookId" class="fh-select" style="flex:1">
              <option :value="null" disabled>Choisir un webhook principal</option>
              <option v-for="w in webhookStore.webhooks" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
            <input v-model="threadId" placeholder="Thread ID (opt.)" class="fh-input" style="width:130px" />
          </div>
          <!-- Multi-webhook -->
          <div class="multi-wh-row">
            <label class="fh-label" style="margin-bottom:4px">
              Envoyer aussi vers :
              <span class="field-hint">Sélectionner plusieurs webhooks supplémentaires</span>
            </label>
            <div class="multi-wh-checks">
              <label v-for="w in webhookStore.webhooks.filter(w => w.id !== embedStore.selectedWebhookId)" :key="w.id" class="multi-wh-check">
                <input type="checkbox" :value="w.id" v-model="multiWebhookIds" style="accent-color:var(--accent)" />
                {{ w.name }}
              </label>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button @click="sendWebhook" class="btn-primary send-btn"
              :disabled="embedStore.sending || !embedStore.selectedWebhookId">
              {{ embedStore.sending ? '⏳ Envoi...' : isEditMode ? '✏️ Mettre à jour' : (multiWebhookIds.length ? `🚀 Envoyer (${1 + multiWebhookIds.length})` : '🚀 Envoyer') }}
            </button>
            <button @click="embedStore.reset()" class="btn-secondary">🗑</button>
          </div>
        </div>

        <!-- Mode Bot -->
        <div v-else-if="sendMode === 'bot'" class="send-bot-area">
          <div class="bot-select-row">
            <label class="fh-label" style="margin-bottom:4px">Bot</label>
            <select v-model="selectedBotId" class="fh-select">
              <option :value="null" disabled>Choisir un bot</option>
              <option v-for="b in bots" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <BotChannelPicker v-if="selectedBotId" :bot-id="selectedBotId" @select="onChannelSelect" />
          <div class="send-area" style="margin-top:10px">
            <button @click="sendViaBot" class="btn-primary send-btn"
              :disabled="botSending || !selectedBotId || !selectedChannelId">
              {{ botSending ? '⏳ Envoi...' : '🤖 Envoyer via bot' }}
            </button>
            <button @click="embedStore.reset()" class="btn-secondary">🗑</button>
          </div>
        </div>

        <!-- Mode Schedule -->
        <div v-else-if="sendMode === 'schedule'" class="send-area" style="flex-direction:column;gap:10px">
          <div>
            <label class="fh-label">Nom du job</label>
            <input v-model="schedName" placeholder="Ex: Annonce hebdo" class="fh-input" />
          </div>
          <div>
            <label class="fh-label">Webhook</label>
            <select v-model="embedStore.selectedWebhookId" class="fh-select">
              <option :value="null" disabled>Choisir un webhook</option>
              <option v-for="w in webhookStore.webhooks" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="fh-label">Expression cron</label>
            <input v-model="schedCron" placeholder="0 9 * * 1 (lundi 9h)" class="fh-input" />
            <div class="cron-presets">
              <button @click="schedCron='0 9 * * *'" class="preset-btn">Chaque jour 9h</button>
              <button @click="schedCron='0 9 * * 1'" class="preset-btn">Chaque lundi 9h</button>
              <button @click="schedCron='0 9 1 * *'" class="preset-btn">1er du mois 9h</button>
              <button @click="schedCron='0 */4 * * *'" class="preset-btn">Toutes les 4h</button>
            </div>
          </div>
          <button @click="createSchedule" class="btn-primary send-btn"
            :disabled="!schedName || !schedCron || !embedStore.selectedWebhookId">
            ⏰ Créer le job planifié
          </button>
        </div>

        <p v-if="sendMode === 'webhook' && !embedStore.selectedWebhookId" class="send-hint">⚠️ Sélectionnez un webhook</p>
        <p v-if="sendMode === 'bot' && selectedBotId && !selectedChannelId" class="send-hint">⚠️ Sélectionnez un serveur et un channel</p>
        <p v-if="embedStore.lastError || botError" class="error mt-2">⚠️ {{ embedStore.lastError || botError }}</p>
        <p v-if="sent" class="success mt-2">✅ Message envoyé ! Redirection vers l'historique...</p>
      </div>
    </div>

    <!-- Panneau droit : preview -->
    <div class="preview-panel">
      <div class="panel-header">
        <h2>👁 Aperçu Discord</h2>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <button @click="previewLight = !previewLight" class="btn-secondary" style="font-size:12px"
            :title="previewLight ? 'Passer en sombre' : 'Passer en clair'">
            {{ previewLight ? '🌙 Sombre' : '☀️ Clair' }}
          </button>
          <button @click="previewMobile = !previewMobile" class="btn-secondary" style="font-size:12px"
            :title="previewMobile ? 'Vue bureau' : 'Vue mobile'">
            {{ previewMobile ? '🖥 Bureau' : '📱 Mobile' }}
          </button>
          <button @click="showJson = !showJson" class="btn-secondary" style="font-size:12px">
            {{ showJson ? 'Masquer JSON' : 'JSON' }}
          </button>
        </div>
      </div>

      <div class="preview-legend">
        <div class="legend-item"><span class="leg-tag tag-content">1</span> Message de base (content)</div>
        <div class="legend-item"><span class="leg-tag tag-embed">3</span> Embed (carte)</div>
      </div>

      <div class="preview-scroll-area" :class="{ 'preview-mobile': previewMobile, 'preview-light-mode': previewLight }">
        <DiscordPreview :message="embedStore.message" :show-bot-tag="true" />
        <div v-if="showJson" class="mt-4">
          <label class="fh-label">Payload JSON</label>
          <pre class="json-block">{{ JSON.stringify(embedStore.message, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Modaux -->
    <EmbedTemplatesModal
      v-model="showTemplates"
      :user-templates="templates"
      @load-template="loadUserTemplate"
      @load-preset="loadPreset"
    />

    <EmbedFontsModal v-model="showFonts" @inject="applyFontToField" />

    <!-- Modal Import Discord -->
    <div v-if="showDiscordImport" class="modal-overlay" @click.self="showDiscordImport = false">
      <div class="modal di-modal">
        <h3>📥 Importer depuis Discord</h3>

        <!-- Étape 1 : choisir le bot + channel -->
        <div v-if="diStep === 1">
          <div class="section">
            <label class="fh-label">Bot</label>
            <select v-model="diBotId" class="fh-select" @change="diChannelId = ''">
              <option :value="null" disabled>-- Choisir un bot --</option>
              <option v-for="b in bots" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div v-if="diBotId" class="section">
            <label class="fh-label">Salon / Post de forum</label>
            <BotChannelPicker :bot-id="diBotId" @select="onDiChannelSelect" />
          </div>
          <div class="modal-actions">
            <button @click="fetchDiscordMessages" class="btn-primary"
              :disabled="!diChannelId || diFetching">
              {{ diFetching ? '⏳ Récupération...' : '🔍 Récupérer les messages' }}
            </button>
            <button @click="showDiscordImport = false" class="btn-secondary">Annuler</button>
          </div>
          <p v-if="diError" class="error mt-2">⚠️ {{ diError }}</p>
        </div>

        <!-- Étape 2 : aperçu + options avant import -->
        <div v-else-if="diStep === 2">
          <div class="di-summary">
            <span class="di-badge">{{ diSteps.length }} étape{{ diSteps.length > 1 ? 's' : '' }} détectée{{ diSteps.length > 1 ? 's' : '' }}</span>
            <span class="di-badge">{{ diSteps.filter(s => s.imageUrl).length }} image{{ diSteps.filter(s => s.imageUrl).length !== 1 ? 's' : '' }}</span>
            <span v-if="diSteps.filter(s => !s.imageUrl).length" class="di-badge di-badge-warn">
              {{ diSteps.filter(s => !s.imageUrl).length }} sans image
            </span>
          </div>

          <div class="di-preview-list">
            <div v-for="(s, i) in diSteps" :key="i" class="di-preview-item">
              <div class="di-preview-num">{{ i + 1 }}</div>
              <div class="di-preview-content">
                <div class="di-preview-text">{{ s.text.slice(0, 100) }}{{ s.text.length > 100 ? '…' : '' }}</div>
                <div v-if="s.imageUrl" class="di-preview-img-row">
                  🖼 <span class="di-url">{{ s.imageUrl.slice(0, 60) }}…</span>
                </div>
                <div v-else class="di-preview-no-img">
                  📎 Pas d'image — tu pourras en uploader une dans Mode Étapes
                  <input type="file" accept="image/*" style="display:none"
                    :ref="(el) => { if (el) diUploadInputs[i] = el as HTMLInputElement }"
                    @change="(e) => uploadDiImage(i, e)" />
                  <button @click="diUploadInputs[i]?.click()" class="btn-secondary"
                    style="font-size:11px;padding:3px 8px;margin-left:6px">📤 Uploader</button>
                  <span v-if="s.imageUrl" style="color:#57f287;font-size:11px;margin-left:4px">✅ uploadé</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="applyDiscordImport" class="btn-primary">✅ Créer le template</button>
            <button @click="diStep = 1" class="btn-secondary">← Retour</button>
            <button @click="showDiscordImport = false" class="btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    </div>

    <ExportModal
      v-model="showExport"
      :payload="embedStore.message"
      :webhook-url="currentWebhookUrl"
    />

    <!-- Modal Import JSON -->
    <div v-if="showJsonImport" class="modal-overlay" @click.self="showJsonImport = false">
      <div class="modal" style="max-width:580px">
        <h3>📋 Importer un payload JSON</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">
          Collez ici un payload Discord JSON (format webhook ou embed direct).
        </p>
        <textarea v-model="jsonImportRaw" class="fh-textarea" rows="10"
          placeholder='{"content":"","embeds":[{"title":"..."}]}' spellcheck="false" />
        <p v-if="jsonImportError" class="error mt-2">⚠️ {{ jsonImportError }}</p>
        <div class="modal-actions">
          <button @click="applyJsonImport" class="btn-primary">✅ Importer</button>
          <button @click="showJsonImport = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>

    <!-- Variables dynamiques info -->
    <div v-if="showVarsInfo" class="modal-overlay" @click.self="showVarsInfo = false">
      <div class="modal" style="max-width:500px">
        <h3>🔄 Variables dynamiques</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
          Ces variables sont automatiquement remplacées lors de l'envoi :
        </p>
        <div class="vars-table">
          <div v-for="v in dynamicVars" :key="v.var" class="var-row">
            <code class="var-code" @click="copyVar(v.var)">{{ v.var }}</code>
            <span class="var-desc">{{ v.desc }}</span>
            <span class="var-example">{{ v.example }}</span>
          </div>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">Cliquer sur une variable pour la copier.</p>
        <div class="modal-actions">
          <button @click="showVarsInfo = false" class="btn-secondary">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Modal save template -->
    <div v-if="showSaveTemplate" class="modal-overlay" @click.self="showSaveTemplate = false">
      <div class="modal">
        <h3>💾 Sauver comme template</h3>
        <div class="section">
          <label class="fh-label">Nom <span style="color:#ed4245">*</span></label>
          <input v-model="tplForm.name" placeholder="Nom du template" class="fh-input"
            :style="tplNameError ? 'border-color:#ed4245' : ''"
            @input="tplNameError = false" />
          <p v-if="tplNameError" style="color:#ed4245;font-size:12px;margin-top:4px">⚠️ Le nom est obligatoire</p>
        </div>
        <div class="section">
          <label class="fh-label">Description</label>
          <input v-model="tplForm.description" placeholder="Description courte (optionnel)" class="fh-input" />
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
          <button @click="submitTemplate" class="btn-primary">💾 Sauver</button>
          <button @click="showSaveTemplate = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import EmbedBuilder from '../components/embed/EmbedBuilder.vue'
import DiscordPreview from '../components/preview/DiscordPreview.vue'
import EmbedTemplatesModal from '../components/modals/EmbedTemplatesModal.vue'
import EmbedFontsModal from '../components/modals/EmbedFontsModal.vue'
import ExportModal from '../components/modals/ExportModal.vue'
import BotChannelPicker from '../components/bots/BotChannelPicker.vue'
import { useEmbedStore } from '../stores/embed'
import { useWebhooksStore } from '../stores/webhooks'
import { useUiStore } from '../stores/ui'
import { emptyEmbed } from '../types/discord'
import type { Template } from '../types/app'
import api from '../api/client'

const router = useRouter()
const route = useRoute()
const embedStore = useEmbedStore()

// Mode édition : /embed?edit_webhook=X&edit_message=Y
const editWebhookId = computed(() => route.query.edit_webhook ? Number(route.query.edit_webhook) : null)
const editMessageId = computed(() => route.query.edit_message as string | null ?? null)
const isEditMode = computed(() => !!(editWebhookId.value && editMessageId.value))
const webhookStore = useWebhooksStore()
const ui = useUiStore()

const threadId = ref('')
const sent = ref(false)
const showJson = ref(false)
const stepMode = ref(false)
const stepImgInputs = ref<HTMLInputElement[]>([])
const stepShowCode = ref<boolean[]>([])
const stepCodeLang = ref<string[]>([])
const stepCodeContent = ref<string[]>([])
const stepGlobalColor = ref('#5865F2')
const dragIdx = ref(-1)
const dropIdx = ref(-1)
const schedName = ref('')
const schedCron = ref('')

const codeLangs = ['bash', 'python', 'javascript', 'typescript', 'json', 'html', 'css', 'sql', 'yaml', 'dockerfile', 'rust', 'go', 'java', 'php', 'csharp', 'cpp', 'xml']

// ─── Import Discord ───────────────────────────────────────────────
const showDiscordImport = ref(false)
const diStep = ref(1)
const diBotId = ref<number | null>(null)
const diChannelId = ref('')
const diFetching = ref(false)
const diError = ref('')
const diUploadInputs = ref<HTMLInputElement[]>([])

interface DiStep { text: string; imageUrl: string }
const diSteps = ref<DiStep[]>([])
const showTemplates = ref(false)
const showSaveTemplate = ref(false)
const showFonts = ref(false)
const showExport = ref(false)
const sendMode = ref<'webhook' | 'bot' | 'schedule'>('webhook')
const templates = ref<Template[]>([])
const tplForm = ref({ name: '', description: '', category: 'Annonces' })
const tplNameError = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

// Preview modes (#17 light, #25 mobile)
const previewLight = ref(false)
const previewMobile = ref(false)

// Draft banner
const draftRestored = ref(false)

// Multi-webhook (#9)
const multiWebhookIds = ref<number[]>([])

// JSON import (#7)
const showJsonImport = ref(false)
const jsonImportRaw = ref('')
const jsonImportError = ref('')

// Variables dynamiques (#22)
const showVarsInfo = ref(false)
const dynamicVars = [
  { var: '{{date}}', desc: 'Date du jour', example: new Date().toLocaleDateString('fr-FR') },
  { var: '{{time}}', desc: 'Heure actuelle', example: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
  { var: '{{datetime}}', desc: 'Date + heure', example: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
  { var: '{{week_number}}', desc: 'Numéro de semaine', example: `Semaine ${getWeekNumber(new Date())}` },
  { var: '{{day}}', desc: 'Jour de la semaine', example: new Date().toLocaleDateString('fr-FR', { weekday: 'long' }) },
  { var: '{{month}}', desc: 'Mois en cours', example: new Date().toLocaleDateString('fr-FR', { month: 'long' }) },
  { var: '{{year}}', desc: 'Année', example: String(new Date().getFullYear()) },
  { var: '{{timestamp}}', desc: 'Timestamp Unix', example: String(Math.floor(Date.now() / 1000)) },
]

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function resolveDynamicVars(str: string): string {
  const now = new Date()
  return str
    .replace(/\{\{date\}\}/g, now.toLocaleDateString('fr-FR'))
    .replace(/\{\{time\}\}/g, now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    .replace(/\{\{datetime\}\}/g, now.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    .replace(/\{\{week_number\}\}/g, String(getWeekNumber(now)))
    .replace(/\{\{day\}\}/g, now.toLocaleDateString('fr-FR', { weekday: 'long' }))
    .replace(/\{\{month\}\}/g, now.toLocaleDateString('fr-FR', { month: 'long' }))
    .replace(/\{\{year\}\}/g, String(now.getFullYear()))
    .replace(/\{\{timestamp\}\}/g, String(Math.floor(Date.now() / 1000)))
}

function copyVar(v: string) {
  navigator.clipboard.writeText(v).catch(() => {})
  ui.notify(`${v} copié !`)
}

// Bot send
const bots = ref<{ id: number; name: string }[]>([])
const selectedBotId = ref<number | null>(null)
const selectedChannelId = ref('')
const selectedChannelName = ref('')
const botSending = ref(false)
const botError = ref('')

const currentWebhookUrl = computed(() => {
  const wh = webhookStore.webhooks.find(w => w.id === embedStore.selectedWebhookId)
  return (wh as any)?.url ?? ''
})

function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); embedStore.undo() }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); embedStore.redo() }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); embedStore.saveDraftNow(); ui.notify('Brouillon sauvegardé') }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (embedStore.selectedWebhookId) sendWebhook() }
}

onMounted(async () => {
  await webhookStore.load()
  const [tplRes, botRes] = await Promise.all([api.get('/templates'), api.get('/bots')])
  templates.value = tplRes.data
  bots.value = botRes.data
  if (embedStore.message.embeds.length === 0) {
    const restored = embedStore.loadDraft()
    if (restored) draftRestored.value = true
    if (embedStore.message.embeds.length === 0) embedStore.addEmbed()
  }
  embedStore.startAutosave()
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  embedStore.stopAutosave()
  document.removeEventListener('keydown', onKeyDown)
})

function applyVarsToMessage(msg: any): any {
  const resolve = (s: string) => typeof s === 'string' ? resolveDynamicVars(s) : s
  const m = JSON.parse(JSON.stringify(msg))
  if (m.content) m.content = resolve(m.content)
  if (m.embeds) {
    m.embeds = m.embeds.map((e: any) => {
      if (e.title) e.title = resolve(e.title)
      if (e.description) e.description = resolve(e.description)
      if (e.footer?.text) e.footer.text = resolve(e.footer.text)
      if (e.author?.name) e.author.name = resolve(e.author.name)
      if (e.fields) e.fields = e.fields.map((f: any) => ({ ...f, name: resolve(f.name), value: resolve(f.value) }))
      return e
    })
  }
  return m
}

function checkEmbedLimit(): boolean {
  const n = embedStore.message.embeds.length
  if (n > 100) {
    ui.notify(`❌ ${n} embeds — maximum 100 supporté. Supprimez ${n - 100} embed(s).`, 'error')
    return false
  }
  return true
}

function chunkEmbeds(embeds: any[]): any[][] {
  if (!embeds.length) return [[]]
  const chunks: any[][] = []
  for (let i = 0; i < embeds.length; i += 10) chunks.push(embeds.slice(i, i + 10))
  return chunks
}

async function sendWebhook() {
  if (!checkEmbedLimit()) return
  if (isEditMode.value && editWebhookId.value && editMessageId.value) {
    // Mode édition : Discord limite à 10 embeds par message, on tronque
    try {
      await api.patch(`/discord/messages/${editWebhookId.value}/${editMessageId.value}`, {
        content: embedStore.message.content || undefined,
        embeds: embedStore.message.embeds.length ? embedStore.message.embeds.slice(0, 10) : undefined,
      })
      sent.value = true
      ui.notify(embedStore.message.embeds.length > 10 ? 'Message mis à jour ✅ (10 premiers embeds)' : 'Message mis à jour ✅')
      setTimeout(() => { router.push('/history') }, 2000)
    } catch (e: any) {
      ui.notify(e?.response?.data?.error ?? 'Erreur mise à jour', 'error')
    }
    return
  }
  await embedStore.send(threadId.value || undefined)
  if (!embedStore.lastError) {
    // Multi-webhook supplémentaires — même chunking
    if (multiWebhookIds.value.length) {
      const baseMsg = applyVarsToMessage({
        content: embedStore.message.content || undefined,
        username: embedStore.message.username || undefined,
        avatar_url: embedStore.message.avatar_url || undefined,
        embeds: embedStore.message.embeds,
      })
      const chunks = chunkEmbeds(baseMsg.embeds ?? [])
      for (const chunk of chunks) {
        await Promise.allSettled(multiWebhookIds.value.map(wid =>
          api.post('/discord/send', {
            webhook_id: wid,
            payload: { ...baseMsg, embeds: chunk.length ? chunk : undefined },
            thread_id: threadId.value || undefined,
          })
        ))
      }
    }
    sent.value = true
    const total = 1 + multiWebhookIds.value.length
    ui.notify(total > 1 ? `Message envoyé sur ${total} webhooks !` : 'Message envoyé !')
    setTimeout(() => { router.push('/history') }, 2000)
  }
}

async function sendViaBot() {
  if (!selectedBotId.value || !selectedChannelId.value) return
  if (!checkEmbedLimit()) return
  botSending.value = true
  botError.value = ''
  try {
    const chunks = chunkEmbeds(embedStore.message.embeds)
    for (let c = 0; c < chunks.length; c++) {
      await api.post('/bots/send', {
        bot_id: selectedBotId.value,
        channel_id: selectedChannelId.value,
        payload: {
          content: c === 0 ? (embedStore.message.content || undefined) : undefined,
          embeds: chunks[c].length ? chunks[c] : undefined,
        },
      })
    }
    sent.value = true
    ui.notify(`Message envoyé via bot dans #${selectedChannelName.value} !`)
    setTimeout(() => { router.push('/history') }, 2000)
  } catch (e: any) {
    botError.value = e?.response?.data?.error ?? 'Erreur envoi bot'
  } finally {
    botSending.value = false
  }
}

function onChannelSelect(sel: { guildId: string; channelId: string; channelName: string; guildName: string } | null) {
  selectedChannelId.value = sel?.channelId ?? ''
  selectedChannelName.value = sel?.channelName ?? ''
}

function applyFontToField(text: string, field: string) {
  const embed = embedStore.message.embeds[0]
  if (field === 'content') embedStore.message.content = text
  else if (field === 'title' && embed) embed.title = text
  else if (field === 'description' && embed) embed.description = text
  else if (field === 'footer' && embed) embed.footer = { text, icon_url: embed.footer?.icon_url ?? '' }
  else if (field === 'author' && embed) embed.author = { name: text, url: embed.author?.url ?? '', icon_url: embed.author?.icon_url ?? '' }
  ui.notify(`Texte inséré dans "${field}" !`)
}

function addStep() {
  embedStore.addEmbed()
  const last = embedStore.message.embeds[embedStore.message.embeds.length - 1]
  if (!last.image) last.image = { url: '' }
}

function toggleStepCode(i: number) {
  stepShowCode.value[i] = !stepShowCode.value[i]
  if (!stepCodeLang.value[i]) stepCodeLang.value[i] = 'bash'
  if (!stepCodeContent.value[i]) stepCodeContent.value[i] = ''
}

function insertStepCode(i: number) {
  const lang = stepCodeLang.value[i] ?? ''
  const code = stepCodeContent.value[i] ?? ''
  if (!code.trim()) return
  const block = `\`\`\`${lang}\n${code}\n\`\`\``
  const embed = embedStore.message.embeds[i]
  embed.description = embed.description ? embed.description + '\n' + block : block
  stepCodeContent.value[i] = ''
  stepShowCode.value[i] = false
}

async function uploadStepImage(index: number, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    const embed = embedStore.message.embeds[index]
    if (!embed.image) embed.image = { url: '' }
    embed.image.url = data.url
    ui.notify('Screenshot uploadé !')
  } catch {
    ui.notify('Erreur upload screenshot', 'error')
  }
}

function duplicateEmbed(i: number) {
  embedStore.message.embeds.push(JSON.parse(JSON.stringify(embedStore.message.embeds[i])))
}

function loadUserTemplate(t: Template) {
  try {
    const truncated = embedStore.loadTemplate(JSON.parse(t.payload))
    ui.notify(truncated ? `Template "${t.name}" chargé (tronqué à 10 embeds)` : `Template "${t.name}" chargé`)
  } catch {
    ui.notify('Impossible de parser le template', 'error')
  }
}

function loadPreset(payload: object) {
  embedStore.loadTemplate(payload as any)
  ui.notify('Template chargé')
}

function saveAsTemplate() {
  tplForm.value = { name: '', description: '', category: 'Annonces' }
  tplNameError.value = false
  showSaveTemplate.value = true
}

async function submitTemplate() {
  if (!tplForm.value.name) { tplNameError.value = true; return }
  await api.post('/templates', {
    name: tplForm.value.name,
    description: tplForm.value.description,
    payload: JSON.stringify(embedStore.message),
    category: tplForm.value.category,
    preview_color: embedStore.message.embeds[0]?.color
      ? '#' + embedStore.message.embeds[0].color!.toString(16).padStart(6, '0')
      : '#5865F2',
  })
  showSaveTemplate.value = false
  ui.notify('Template sauvegardé !')
  const { data } = await api.get('/templates')
  templates.value = data
}

// ─── Import Discord ───────────────────────────────────────────────
function openDiscordImport() {
  diStep.value = 1
  diChannelId.value = ''
  diError.value = ''
  diSteps.value = []
  showDiscordImport.value = true
}

function onDiChannelSelect(sel: { channelId: string } | null) {
  diChannelId.value = sel?.channelId ?? ''
}

async function fetchDiscordMessages() {
  if (!diBotId.value || !diChannelId.value) return
  diFetching.value = true
  diError.value = ''
  try {
    const { data } = await api.get(`/bots/${diBotId.value}/channels/${diChannelId.value}/messages`, {
      params: { limit: 100 },
    })
    const msgs: any[] = data
    if (!msgs.length) { diError.value = 'Aucun message trouvé dans ce canal'; return }

    // Convertit les messages en étapes : texte + première image trouvée
    const steps: DiStep[] = []
    let textBuf = ''

    for (const m of msgs) {
      const imgUrl = m.attachments?.[0]?.url ?? m.embed_images?.[0] ?? ''
      const content = m.content?.trim() ?? ''

      if (content) {
        textBuf += (textBuf ? '\n' : '') + content
      }
      if (imgUrl) {
        steps.push({ text: textBuf || '(pas de texte)', imageUrl: imgUrl })
        textBuf = ''
      }
    }
    // Texte restant sans image
    if (textBuf.trim()) steps.push({ text: textBuf, imageUrl: '' })
    // Si aucune image dans tout l'export : un step par message
    if (!steps.length && msgs.length) {
      msgs.forEach(m => {
        if (m.content?.trim()) steps.push({ text: m.content.trim(), imageUrl: '' })
      })
    }

    diSteps.value = steps
    diStep.value = 2
  } catch (e: any) {
    diError.value = e?.response?.data?.detail ?? e?.response?.data?.error ?? 'Erreur de récupération'
  } finally {
    diFetching.value = false
  }
}

async function uploadDiImage(index: number, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    diSteps.value[index].imageUrl = data.url
    ui.notify('Image uploadée !')
  } catch { ui.notify('Erreur upload', 'error') }
}

function applyDiscordImport() {
  if (!diSteps.value.length) return
  // Remplace les embeds par les étapes importées
  embedStore.message.embeds = diSteps.value.map(s => ({
    ...emptyEmbed(),
    description: s.text,
    image: { url: s.imageUrl },
  }))
  stepMode.value = true
  stepShowCode.value = new Array(diSteps.value.length).fill(false)
  stepCodeLang.value = new Array(diSteps.value.length).fill('bash')
  stepCodeContent.value = new Array(diSteps.value.length).fill('')
  showDiscordImport.value = false
  ui.notify(`${diSteps.value.length} étapes importées depuis Discord ✅`)
}

function applyGlobalColor() {
  const hex = stepGlobalColor.value.replace('#', '')
  const color = parseInt(hex, 16)
  embedStore.message.embeds.forEach(e => { e.color = color })
}

function dropStep(targetIdx: number) {
  if (dragIdx.value === -1 || dragIdx.value === targetIdx) return
  const embeds = embedStore.message.embeds
  const moved = embeds.splice(dragIdx.value, 1)[0]
  embeds.splice(targetIdx, 0, moved)
  const reorder = <T>(arr: T[], from: number, to: number): T[] => {
    const copy = [...arr]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
  }
  stepShowCode.value = reorder(stepShowCode.value, dragIdx.value, targetIdx)
  stepCodeLang.value = reorder(stepCodeLang.value, dragIdx.value, targetIdx)
  stepCodeContent.value = reorder(stepCodeContent.value, dragIdx.value, targetIdx)
  dragIdx.value = -1
  dropIdx.value = -1
}

async function createSchedule() {
  if (!schedName.value || !schedCron.value || !embedStore.selectedWebhookId) return
  if (!checkEmbedLimit()) return
  try {
    await api.post('/scheduler', {
      name: schedName.value,
      webhook_id: embedStore.selectedWebhookId,
      payload: {
        content: embedStore.message.content || undefined,
        username: embedStore.message.username || undefined,
        avatar_url: embedStore.message.avatar_url || undefined,
        embeds: embedStore.message.embeds.length ? embedStore.message.embeds : undefined,
      },
      cron_expr: schedCron.value,
      enabled: true,
    })
    ui.notify(`Job "${schedName.value}" planifié ✅`)
    schedName.value = ''
    schedCron.value = ''
    sendMode.value = 'webhook'
  } catch (e: any) {
    ui.notify(e?.response?.data?.error ?? 'Erreur création job', 'error')
  }
}

function applyJsonImport() {
  jsonImportError.value = ''
  try {
    const parsed = JSON.parse(jsonImportRaw.value)
    if (typeof parsed !== 'object' || parsed === null) throw new Error('JSON invalide')
    let truncated = false
    if (parsed.embeds !== undefined || parsed.content !== undefined) {
      truncated = embedStore.loadTemplate(parsed)
    } else if (parsed.title !== undefined || parsed.description !== undefined) {
      truncated = embedStore.loadTemplate({ content: '', embeds: [parsed] })
    } else {
      throw new Error('Format non reconnu. Attendu: payload webhook ou embed Discord.')
    }
    showJsonImport.value = false
    jsonImportRaw.value = ''
    ui.notify(truncated ? 'JSON importé ✅ (tronqué à 10 embeds max Discord)' : 'Payload JSON importé ✅')
  } catch (e: any) {
    jsonImportError.value = e.message ?? 'JSON invalide'
  }
}

function triggerAvatarUpload() { avatarInput.value?.click() }

async function uploadAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    embedStore.message.avatar_url = data.url
    ui.notify('Avatar uploadé !')
  } catch (err: any) {
    ui.notify(err?.response?.data?.error ?? 'Erreur upload', 'error')
  } finally {
    if (avatarInput.value) avatarInput.value.value = ''
  }
}
</script>

<style scoped>
.preview-scroll-area { flex: 1; overflow-y: auto; min-height: 0; }
.preview-scroll-area > * { flex-shrink: 0; margin-bottom: 8px; }
.inline-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.editor-section { border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 16px; }
.section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.section-num { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.section-hint { font-size: 11px; color: var(--text-muted); }
.step-toggle-btn { margin-left: auto; font-size: 12px; padding: 4px 10px; flex-shrink: 0; }
/* Step cards */
.step-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 10px; }
.step-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.step-badge { font-size: 12px; font-weight: 700; color: var(--accent); background: rgba(88,101,242,.15); padding: 3px 10px; border-radius: 12px; }
.step-fields { display: flex; flex-direction: column; gap: 8px; }
.step-img-row { display: flex; gap: 6px; align-items: center; }
.step-img-row .fh-input { flex: 1; }
.step-preview-img { max-width: 100%; max-height: 160px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); margin-top: 4px; }
/* Code editor in step mode */
.step-code-btn { font-size: 12px; padding: 3px 10px; }
.step-code-btn.active { background: #2d2f33; border-color: #5865f2; color: #5865f2; }
.step-code-editor { background: #1a1c1f; border: 1px solid #40444b; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.step-code-bar { display: flex; gap: 8px; align-items: center; }
.step-lang-select { font-size: 12px; padding: 4px 8px; flex: 1; }
.step-code-textarea { font-family: monospace; font-size: 13px; resize: vertical; background: #111214; }
/* Discord Import modal */
.di-modal { max-width: 600px; width: 90vw; max-height: 80vh; overflow-y: auto; }
.di-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.di-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: rgba(88,101,242,.2); color: #7289da; }
.di-badge-warn { background: rgba(250,166,26,.15); color: #faa61a; }
.di-preview-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; margin-bottom: 12px; }
.di-preview-item { display: flex; gap: 10px; background: var(--bg-tertiary); border-radius: 6px; padding: 8px 10px; }
.di-preview-num { min-width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.di-preview-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.di-preview-text { font-size: 13px; color: var(--text); white-space: pre-wrap; word-break: break-word; }
.di-preview-img-row { font-size: 11px; color: #3ba55c; display: flex; align-items: center; gap: 4px; }
.di-preview-no-img { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.di-url { color: #7289da; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px; }
.field-hint { font-size: 10px; color: var(--text-muted); font-weight: 400; margin-left: 6px; }
.avatar-row { display: flex; gap: 6px; align-items: center; }
.avatar-upload-btn { padding: 6px 10px; flex-shrink: 0; }
.avatar-preview { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-top: 6px; border: 2px solid var(--border); }
.send-section { border-bottom: none; margin-bottom: 0; }
.send-mode-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.send-mode-tabs button { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-muted); cursor: pointer; font-weight: 600; font-size: 13px; }
.send-mode-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.send-mode-tabs button:hover:not(.active) { background: var(--bg-secondary); color: var(--text); }
.send-btn { font-size: 14px; padding: 10px 20px; }
.send-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.bot-select-row { display: flex; flex-direction: column; margin-bottom: 10px; }
.send-bot-area { display: flex; flex-direction: column; gap: 8px; }
.preview-legend { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.leg-tag { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700; }
.tag-content { background: #57F287; color: #000; }
.tag-embed { background: #5865F2; color: #fff; }
.flex { display: flex; }
.gap-2 { gap: 8px; }
.mt-4 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }
/* Global color — step mode */
.step-global-color { background: var(--bg-tertiary); border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; }
.step-color-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.step-color-input { width: 40px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: none; padding: 0; }
.step-color-hex { font-size: 12px; color: var(--text-muted); font-family: monospace; }
/* Drag & drop */
.drag-handle { cursor: grab; color: var(--text-muted); font-size: 16px; padding: 0 4px; user-select: none; }
.step-card.dragging { opacity: 0.4; }
.step-card.dragover { border-color: var(--accent); background: rgba(88,101,242,.1); }
/* Cron presets */
.cron-presets { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.preset-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; }
.preset-btn:hover { border-color: var(--accent); color: var(--text); }
/* Edit mode */
.edit-mode-badge { font-size: 10px; background: rgba(250,166,26,.2); color: #faa61a; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.edit-mode-banner { background: rgba(250,166,26,.1); border: 1px solid rgba(250,166,26,.3); border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #faa61a; margin-bottom: 10px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
/* Draft banner */
.draft-banner { background: rgba(88,101,242,.1); border: 1px solid rgba(88,101,242,.3); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #7289da; margin-bottom: 8px; }
/* Multi-webhook */
.multi-wh-row { background: var(--bg-tertiary); border-radius: 6px; padding: 8px 10px; }
.multi-wh-checks { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.multi-wh-check { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); cursor: pointer; }
.multi-wh-check:hover { color: var(--text); }
/* Mobile preview */
.preview-mobile { max-width: 375px; margin: 0 auto; }
/* Light mode preview */
.preview-light-mode { background: #fff; border-radius: 8px; }
.preview-light-mode :deep(.discord-preview) { background: #fff; color: #2e3338; }
.preview-light-mode :deep(.channel-header) { background: #f2f3f5; border-bottom-color: #e3e5e8; }
.preview-light-mode :deep(.messages-area) { background: #fff; }
.preview-light-mode :deep(.username) { color: #060607; }
.preview-light-mode :deep(.timestamp) { color: #747f8d; }
.preview-light-mode :deep(.message-text) { color: #2e3338; }
/* Variables table */
.vars-table { display: flex; flex-direction: column; gap: 6px; }
.var-row { display: grid; grid-template-columns: 140px 1fr 100px; gap: 8px; align-items: center; background: var(--bg-tertiary); border-radius: 6px; padding: 6px 10px; }
.var-code { font-family: monospace; font-size: 12px; color: #57f287; cursor: pointer; padding: 2px 6px; background: rgba(87,242,135,.1); border-radius: 4px; }
.var-code:hover { background: rgba(87,242,135,.2); }
.var-desc { font-size: 12px; color: var(--text-muted); }
.var-example { font-size: 11px; color: #72767d; font-family: monospace; text-align: right; }
</style>
