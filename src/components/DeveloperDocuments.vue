<template>
  <section class="q-mt-lg">
    <h2>{{ ui('Justificatifs') }}</h2>
    <p>{{
      ui(
        'Pièce d’identité et documents demandés de façon motivée. Les fichiers restent privés et peuvent être supprimés à tout moment.'
      )
    }}</p>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-linear-progress v-if="busy" indeterminate />
    <q-btn
      v-if="admin"
      outline
      no-caps
      :label="ui('Demander un justificatif')"
      :disable="busy"
      @click="requestDocument"
    />
    <p v-if="!busy && !documents.length">{{
      ui('Aucun justificatif demandé.')
    }}</p>
    <article v-for="doc in documents" :key="doc.id" class="q-mt-md">
      <p>{{ doc.reason }}</p>
      <p class="text-caption"
        >{{ ui('Conservation jusqu’au') }}
        {{ new Date(doc.expires_at).toLocaleDateString(currentLocale()) }}.</p
      >
      <q-file
        v-if="!admin && doc.kind !== 'identity'"
        outlined
        :model-value="null"
        accept=".pdf,.jpg,.jpeg,.png"
        :label="ui('Déposer un fichier (PDF, JPEG ou PNG, 5 Mo maximum)')"
        :disable="busy"
        @update:model-value="file => upload(doc, file)"
      />
      <div class="workspace-actions q-mt-sm">
        <q-btn
          v-if="doc.uploaded_at"
          flat
          no-caps
          color="primary"
          icon="visibility"
          :label="ui('Lire le justificatif')"
          :disable="busy"
          :loading="readingId === doc.id"
          @click="view(doc)"
        />
        <q-btn
          v-if="doc.uploaded_at"
          flat
          no-caps
          icon="download"
          :label="ui('Télécharger')"
          :disable="busy"
          @click="download(doc)"
        />
        <q-btn
          flat
          no-caps
          icon="delete"
          color="negative"
          :label="ui('Supprimer')"
          :disable="busy"
          @click="remove(doc)"
        />
      </div>
    </article>

    <!-- Visionneuse de justificatif (toutes extensions) -->
    <q-dialog
      v-model="viewerOpen"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
      @hide="closeViewer"
    >
      <q-card class="doc-viewer-card">
        <q-toolbar class="doc-viewer-toolbar">
          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
            :aria-label="ui('Fermer')"
          />
          <q-toolbar-title class="doc-viewer-title">
            <span class="ellipsis">{{
              activeDoc?.reason || ui('Fichier justificatif')
            }}</span>
          </q-toolbar-title>
          <q-badge color="primary" class="q-mr-sm" :label="fileTypeBadge" />
          <span v-if="activeSize" class="text-caption text-muted q-mr-md gt-xs">
            {{ formatBytes(activeSize) }}
          </span>
          <q-btn
            flat
            no-caps
            icon="open_in_new"
            :label="ui('Ouvrir dans un nouvel onglet')"
            class="gt-xs"
            @click="openInNewTab"
          />
          <q-btn
            flat
            no-caps
            icon="download"
            :label="ui('Télécharger')"
            @click="activeDoc && download(activeDoc)"
          />
        </q-toolbar>

        <q-card-section class="doc-viewer-body">
          <!-- Image -->
          <div v-if="activeType === 'image'" class="doc-viewer-image-wrap">
            <img
              :src="activeBlobUrl"
              :alt="activeDoc?.reason || ui('Fichier justificatif')"
              class="doc-viewer-image"
            />
          </div>

          <!-- PDF -->
          <div v-else-if="activeType === 'pdf'" class="doc-viewer-frame-wrap">
            <iframe :src="activeBlobUrl" class="doc-viewer-frame" title="PDF" />
          </div>

          <!-- Texte / Code -->
          <div v-else-if="activeType === 'text'" class="doc-viewer-text-wrap">
            <pre class="doc-viewer-code"><code>{{ viewerText }}</code></pre>
          </div>

          <!-- Audio -->
          <div v-else-if="activeType === 'audio'" class="doc-viewer-media-wrap">
            <audio controls :src="activeBlobUrl" class="full-width" />
          </div>

          <!-- Vidéo -->
          <div v-else-if="activeType === 'video'" class="doc-viewer-media-wrap">
            <video controls :src="activeBlobUrl" class="doc-viewer-video" />
          </div>

          <!-- Autre extension (Word, tableur, archive, etc.) -->
          <div v-else class="doc-viewer-fallback-wrap">
            <object
              :data="activeBlobUrl"
              :type="activeMime"
              class="doc-viewer-fallback-object"
            >
              <div class="doc-viewer-fallback-card">
                <q-icon name="description" size="72px" color="primary" />
                <h3 class="q-mt-md q-mb-xs">{{
                  activeDoc?.reason || ui('Document justificatif')
                }}</h3>
                <p class="text-caption text-muted">
                  {{ activeMime }} · {{ formatBytes(activeSize) }}
                </p>
                <p class="doc-viewer-hint">
                  {{
                    ui(
                      'Ce format de fichier ne peut pas être prévisualisé directement.'
                    )
                  }}
                </p>
                <div class="row q-gutter-sm justify-center q-mt-md">
                  <q-btn
                    unelevated
                    color="primary"
                    no-caps
                    icon="open_in_new"
                    :label="ui('Ouvrir dans un nouvel onglet')"
                    @click="openInNewTab"
                  />
                  <q-btn
                    outline
                    no-caps
                    icon="download"
                    :label="ui('Télécharger le fichier')"
                    @click="activeDoc && download(activeDoc)"
                  />
                </div>
              </div>
            </object>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
const props = defineProps({
  profileId: { type: Number, required: true },
  admin: Boolean
})
const q = useQuasar(),
  documents = ref([]),
  error = ref(''),
  busy = ref(false),
  readingId = ref(null),
  viewerOpen = ref(false),
  activeDoc = ref(null),
  activeBlobUrl = ref(''),
  activeType = ref(''),
  activeMime = ref(''),
  activeSize = ref(0),
  viewerText = ref('')

const fileTypeBadge = computed(() => {
  switch (activeType.value) {
    case 'pdf':
      return 'PDF'
    case 'image':
      return 'IMAGE'
    case 'text':
      return 'TEXT'
    case 'audio':
      return 'AUDIO'
    case 'video':
      return 'VIDEO'
    default:
      return activeMime.value
        ? activeMime.value.split('/')[1]?.toUpperCase() || 'DOCUMENT'
        : 'DOCUMENT'
  }
})

function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['o', 'Ko', 'Mo', 'Go']
  let i = 0
  let num = bytes
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024
    i++
  }
  return `${num.toFixed(num >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

async function detectKind(blob, mimeHint = '') {
  const mime = (mimeHint || blob.type || '').split(';')[0].trim().toLowerCase()
  try {
    const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer())
    // %PDF: 0x25, 0x50, 0x44, 0x46
    if (
      head[0] === 0x25 &&
      head[1] === 0x50 &&
      head[2] === 0x44 &&
      head[3] === 0x46
    ) {
      return 'pdf'
    }
    // PNG: 89 50 4E 47
    if (
      head[0] === 0x89 &&
      head[1] === 0x50 &&
      head[2] === 0x4e &&
      head[3] === 0x47
    ) {
      return 'image'
    }
    // JPEG: FF D8 FF
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
      return 'image'
    }
    // GIF: GIF8
    if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) {
      return 'image'
    }
    // WebP: RIFF
    if (
      head[0] === 0x52 &&
      head[1] === 0x49 &&
      head[2] === 0x46 &&
      head[3] === 0x46
    ) {
      return 'image'
    }
  } catch {}

  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (
    mime.startsWith('text/') ||
    [
      'application/json',
      'application/xml',
      'application/javascript',
      'application/csv',
      'application/x-yaml',
      'application/yaml'
    ].includes(mime)
  ) {
    return 'text'
  }
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'

  try {
    const sample = await blob.slice(0, 2048).text()
    if (sample && !sample.includes('\0')) {
      return 'text'
    }
  } catch {}

  return 'other'
}

async function view(doc) {
  readingId.value = doc.id
  error.value = ''
  try {
    const { data } = await api.get(`/developer-documents/${doc.id}`, {
      responseType: 'blob'
    })
    const kind = await detectKind(data, doc.mime)
    if (kind === 'text') {
      viewerText.value = await data.text()
    } else {
      viewerText.value = ''
    }

    if (activeBlobUrl.value) {
      URL.revokeObjectURL(activeBlobUrl.value)
    }
    activeBlobUrl.value = URL.createObjectURL(data)
    activeDoc.value = doc
    activeType.value = kind
    activeMime.value = doc.mime || data.type || 'application/octet-stream'
    activeSize.value = data.size || 0
    viewerOpen.value = true
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    readingId.value = null
  }
}

function closeViewer() {
  viewerOpen.value = false
  if (activeBlobUrl.value) {
    URL.revokeObjectURL(activeBlobUrl.value)
    activeBlobUrl.value = ''
  }
  activeDoc.value = null
  viewerText.value = ''
  activeType.value = ''
  activeMime.value = ''
  activeSize.value = 0
}

function openInNewTab() {
  if (activeBlobUrl.value) {
    window.open(activeBlobUrl.value, '_blank', 'noopener,noreferrer')
  }
}

async function run(action) {
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function load() {
  const { data } = await api.get(
    `/developer-profiles/${props.profileId}/documents`
  )
  documents.value = data
}
watch(
  () => props.profileId,
  () => run(load),
  { immediate: true }
)
function requestDocument() {
  q.dialog({
    get title() {
      return ui('Justificatif nécessaire')
    },
    get message() {
      return ui('Expliquez précisément le document demandé et sa nécessité.')
    },
    prompt: {
      model: '',
      type: 'textarea',
      isValid: value => value.trim().length >= 10
    },
    cancel: true
  }).onOk(reason =>
    run(async () => {
      await api.post(`/developer-profiles/${props.profileId}/documents`, {
        reason
      })
      await load()
    })
  )
}
function upload(doc, file) {
  if (!file) return
  return run(async () => {
    const form = new FormData()
    form.append('file', file)
    await api.post(`/developer-documents/${doc.id}`, form)
    await load()
  })
}
function download(doc) {
  return run(async () => {
    const { data } = await api.get(`/developer-documents/${doc.id}`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data),
      link = document.createElement('a')
    link.href = url
    link.download = `justificatif.${
      {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'text/plain': 'txt',
        'text/csv': 'csv',
        'application/json': 'json'
      }[doc.mime || data.type] || 'bin'
    }`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
}
function remove(doc) {
  q.dialog({
    get title() {
      return ui('Supprimer le justificatif ?')
    },
    get message() {
      return ui('Le fichier et la demande seront supprimés.')
    },
    cancel: true
  }).onOk(() =>
    run(async () => {
      await api.delete(`/developer-documents/${doc.id}`)
      await load()
    })
  )
}
onBeforeUnmount(() => {
  if (activeBlobUrl.value) {
    URL.revokeObjectURL(activeBlobUrl.value)
  }
})
</script>
<style scoped>
h2 {
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
  margin: 0 0 16px;
  overflow-wrap: anywhere;
}
section {
  min-width: 0;
  margin-bottom: 24px;
}
p {
  line-height: 1.65;
  color: var(--pwa-muted);
  overflow-wrap: anywhere;
}
.doc-viewer-card {
  display: flex;
  flex-direction: column;
  background: var(--surface-low);
  color: var(--text);
  width: 100%;
  height: 100%;
}
.doc-viewer-toolbar {
  border-bottom: 1px solid var(--outline);
  background: var(--surface);
  flex-shrink: 0;
}
.doc-viewer-title {
  font-size: 16px;
  font-weight: 600;
}
.doc-viewer-body {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}
.doc-viewer-image-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.doc-viewer-image {
  max-width: 100%;
  max-height: calc(100vh - 120px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}
.doc-viewer-frame-wrap,
.doc-viewer-fallback-wrap {
  width: 100%;
  height: 100%;
}
.doc-viewer-frame,
.doc-viewer-fallback-object {
  width: 100%;
  height: calc(100vh - 100px);
  border: none;
  border-radius: 6px;
}
.doc-viewer-text-wrap {
  width: 100%;
  height: 100%;
  max-width: 1100px;
}
.doc-viewer-code {
  width: 100%;
  max-height: calc(100vh - 120px);
  overflow: auto;
  padding: 16px;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text);
}
.doc-viewer-media-wrap {
  max-width: 800px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.doc-viewer-video {
  max-width: 100%;
  max-height: calc(100vh - 140px);
  border-radius: 8px;
}
.doc-viewer-fallback-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: var(--surface-high);
  border: 1px dashed var(--outline);
  border-radius: 12px;
  max-width: 600px;
  margin: 40px auto;
}
.doc-viewer-hint {
  max-width: 440px;
  margin: 12px auto 20px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
