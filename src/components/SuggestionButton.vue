<template>
  <q-btn
    flat
    no-caps
    :dense="dense"
    color="primary"
    icon="lightbulb"
    :label="ui('Suggérer une amélioration')"
    @click="open"
  />
  <q-dialog v-model="dialog" :maximized="$q.screen.lt.sm" @hide="reset">
    <q-card class="suggestion-card">
      <q-form @submit="send">
        <q-card-section>
          <h2>{{ ui('Suggérer une amélioration') }}</h2>
          <p class="text-muted">{{
            ui(
              'Votre suggestion est privée : seul l’éditeur de {app} (et l’équipe de modération si nécessaire) pourra la lire. Pour un avis public, utilisez la section Avis.',
              { app: appName }
            )
          }}</p>
        </q-card-section>
        <q-card-section class="workspace-form">
          <q-input
            v-model="title"
            outlined
            :label="ui('Titre')"
            :maxlength="SUGGESTION_LIMITS.maxTitleLength"
            counter
            :rules="[v => v.trim().length >= 3 || ui('Indiquez un titre.')]"
          />
          <div>
            <q-editor
              v-model="body"
              min-height="10rem"
              :toolbar="toolbar"
              :placeholder="ui('Décrivez votre idée, ce qu’elle apporterait…')"
              :aria-label="ui('Votre suggestion')"
            />
            <div
              class="text-caption q-mt-xs"
              :class="textTooLong ? 'text-negative' : 'text-muted'"
              >{{
                ui('{n} / {max} caractères', {
                  n: textLength,
                  max: SUGGESTION_LIMITS.maxTextLength
                })
              }}</div
            >
          </div>

          <div class="attachments">
            <div class="row items-center q-gutter-sm">
              <q-btn
                outline
                no-caps
                icon="attach_file"
                color="primary"
                :label="ui('Joindre des fichiers')"
                :disable="files.length >= SUGGESTION_LIMITS.maxFiles"
                @click="picker.click()"
              />
              <span class="text-caption text-muted">{{
                ui(
                  'Captures ou documents : PNG, JPEG, WebP, GIF, PDF ou TXT. {max} fichiers, 2 Mo chacun au maximum.',
                  { max: SUGGESTION_LIMITS.maxFiles }
                )
              }}</span>
            </div>
            <input
              ref="picker"
              type="file"
              multiple
              :accept="SUGGESTION_ACCEPT"
              class="hidden-input"
              @change="pick"
            />
            <ul v-if="fileErrors.length" class="file-errors" role="alert">
              <li v-for="(message, i) in fileErrors" :key="i">{{ message }}</li>
            </ul>
            <div v-if="files.length" class="previews">
              <div v-for="(item, i) in files" :key="item.key" class="preview">
                <img v-if="item.url" :src="item.url" :alt="item.file.name" />
                <q-icon
                  v-else
                  :name="
                    item.file.name.toLowerCase().endsWith('.pdf')
                      ? 'picture_as_pdf'
                      : 'description'
                  "
                  size="36px"
                  color="grey-7"
                />
                <div class="preview-meta">
                  <span class="ellipsis">{{ item.file.name }}</span>
                  <small class="text-muted">{{
                    formatFileSize(item.file.size)
                  }}</small>
                </div>
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  :aria-label="ui('Retirer {name}', { name: item.file.name })"
                  @click="removeFile(i)"
                />
              </div>
            </div>
          </div>
          <q-banner v-if="error" class="workspace-alert" role="alert">{{
            error
          }}</q-banner>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            :label="ui('Envoyer la suggestion')"
            :disable="!canSend"
            :loading="busy"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, onBeforeUnmount, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMessage } from '@/services/account'
import { suggestionsApi } from '@/services/suggestions'
import {
  checkSuggestionFiles,
  formatFileSize,
  isImageFile,
  richTextLength,
  SUGGESTION_ACCEPT,
  SUGGESTION_LIMITS
} from '@/utils/suggestions'

const props = defineProps({
  appId: { type: Number, required: true },
  appName: { type: String, default: '' },
  dense: Boolean
})
const $q = useQuasar(),
  auth = useAuthStore(),
  router = useRouter(),
  route = useRoute()
const dialog = ref(false),
  title = ref(''),
  body = ref(''),
  files = ref([]),
  fileErrors = ref([]),
  busy = ref(false),
  error = ref(''),
  picker = ref(null)
let counter = 0

// No image, video or HTML source button: files are attached outside the editor.
const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered', 'quote'],
  ['link', 'removeFormat'],
  ['undo', 'redo']
]
const textLength = computed(() => richTextLength(body.value))
const textTooLong = computed(
  () => textLength.value > SUGGESTION_LIMITS.maxTextLength
)
const canSend = computed(
  () =>
    title.value.trim().length >= 3 &&
    textLength.value >= SUGGESTION_LIMITS.minTextLength &&
    !textTooLong.value
)

function open() {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  error.value = ''
  dialog.value = true
}

function rejection({ file, reason }) {
  const name = file.name
  return {
    size: () =>
      ui('« {name} » dépasse 2 Mo ({size}). Réduisez-le ou compressez-le.', {
        name,
        size: formatFileSize(file.size)
      }),
    type: () =>
      ui(
        '« {name} » n’est pas accepté. Formats possibles : PNG, JPEG, WebP, GIF, PDF ou TXT.',
        { name }
      ),
    empty: () => ui('« {name} » est vide.', { name }),
    duplicate: () => ui('« {name} » est déjà joint.', { name }),
    count: () =>
      ui('« {name} » n’a pas été ajouté : {max} fichiers au maximum.', {
        name,
        max: SUGGESTION_LIMITS.maxFiles
      })
  }[reason]()
}

function pick(event) {
  const picked = [...(event.target.files || [])]
  event.target.value = ''
  const { accepted, rejected } = checkSuggestionFiles(
    files.value.map(item => item.file),
    picked
  )
  fileErrors.value = rejected.map(rejection)
  files.value.push(
    ...accepted.map(file => ({
      key: ++counter,
      file,
      url: isImageFile(file) ? URL.createObjectURL(file) : null
    }))
  )
}

function removeFile(index) {
  const [item] = files.value.splice(index, 1)
  if (item?.url) URL.revokeObjectURL(item.url)
}

function reset() {
  files.value.forEach(item => item.url && URL.revokeObjectURL(item.url))
  files.value = []
  fileErrors.value = []
  if (!busy.value) error.value = ''
}

async function send() {
  if (!canSend.value) return
  busy.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('title', title.value.trim())
    form.append('body', body.value)
    files.value.forEach(item => form.append('files[]', item.file))
    await suggestionsApi.create(props.appId, form)
    title.value = ''
    body.value = ''
    dialog.value = false
    $q.notify({
      type: 'positive',
      get message() {
        return ui(
          'Merci ! Votre suggestion a été transmise à l’éditeur. Suivez-la dans « Mes suggestions ».'
        )
      }
    })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(reset)
</script>
<style scoped>
.suggestion-card {
  width: min(720px, 100vw);
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 4px;
}
.hidden-input {
  display: none;
}
.file-errors {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--q-negative);
  font-size: 13px;
}
.previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.12));
  border-radius: 10px;
  min-width: 0;
}
.preview img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
}
.preview-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  font-size: 12px;
}
</style>
