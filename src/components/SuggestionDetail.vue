<template>
  <div class="suggestion-detail">
    <!-- Sanitized twice: by the API when saved, then by sanitizeRichText() here. -->
    <div class="suggestion-body" v-html="safeBody" />
    <div v-if="suggestion.attachments?.length" class="q-mt-md">
      <strong>{{ ui('Fichiers joints') }}</strong>
      <div class="attachment-grid">
        <div
          v-for="file in suggestion.attachments"
          :key="file.id"
          class="attachment"
        >
          <img
            v-if="file.is_image && previews[file.id]"
            :src="previews[file.id]"
            :alt="file.name"
            class="attachment-image"
          />
          <q-icon
            v-else
            :name="
              file.mime === 'application/pdf' ? 'picture_as_pdf' : 'description'
            "
            size="36px"
            color="grey-7"
          />
          <div class="attachment-meta">
            <span class="ellipsis">{{ file.name }}</span>
            <small class="text-muted">{{ formatFileSize(file.size) }}</small>
          </div>
          <q-btn
            flat
            round
            dense
            icon="download"
            :loading="downloading === file.id"
            :aria-label="ui('Télécharger {name}', { name: file.name })"
            @click="download(file)"
          />
        </div>
      </div>
    </div>
    <div v-if="suggestion.developer_reply" class="reply"
      ><strong>{{
        suggestion.application
          ? ui('Réponse de l’éditeur')
          : ui('Réponse de l’équipe PWA Store')
      }}</strong>
      <p>{{ suggestion.developer_reply }}</p></div
    >
    <q-banner v-if="error" class="workspace-alert q-mt-sm" role="alert">{{
      error
    }}</q-banner>
  </div>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { apiMessage } from '@/services/account'
import { suggestionsApi } from '@/services/suggestions'
import { formatFileSize, sanitizeRichText } from '@/utils/suggestions'

const props = defineProps({
  suggestion: { type: Object, required: true },
  // (id, attachmentId) => blob response; other private files (beta feedback) reuse this view.
  fetchAttachment: { type: Function, default: null }
})
const fetchFile = (id, attachmentId) =>
  (props.fetchAttachment || suggestionsApi.attachment)(id, attachmentId)
const previews = reactive({}),
  downloading = ref(null),
  error = ref('')
const safeBody = computed(() => sanitizeRichText(props.suggestion.body))

function revokeAll() {
  for (const id of Object.keys(previews)) {
    URL.revokeObjectURL(previews[id])
    delete previews[id]
  }
}

// Images are private: they are fetched with the session and shown from a local blob address.
async function loadPreviews() {
  revokeAll()
  for (const file of props.suggestion.attachments || []) {
    if (!file.is_image) continue
    try {
      const { data } = await fetchFile(props.suggestion.id, file.id)
      previews[file.id] = URL.createObjectURL(data)
    } catch {
      // The download button stays available.
    }
  }
}

async function download(file) {
  downloading.value = file.id
  error.value = ''
  try {
    const { data } = await fetchFile(props.suggestion.id, file.id)
    const url = URL.createObjectURL(data),
      link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    downloading.value = null
  }
}

watch(() => props.suggestion.id, loadPreviews, { immediate: true })
onBeforeUnmount(revokeAll)
</script>
<style scoped>
.suggestion-body {
  overflow-wrap: anywhere;
}
.suggestion-body :deep(blockquote) {
  margin: 8px 0;
  padding-left: 10px;
  border-left: 3px solid var(--surface-border, #ccc);
}
.attachment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin-top: 6px;
}
.attachment {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.12));
  border-radius: 10px;
  min-width: 0;
}
.attachment-image {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
}
.attachment-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  font-size: 12px;
}
.reply {
  margin-top: 12px;
  padding: 8px 10px;
  border-left: 3px solid var(--pwa-primary);
  background: var(--surface-low);
  border-radius: 8px;
}
.reply p {
  margin: 4px 0 0;
  white-space: pre-line;
}
</style>
