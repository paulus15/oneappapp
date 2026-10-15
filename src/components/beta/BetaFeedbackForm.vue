<template>
  <form
    class="beta-feedback-form workspace-form"
    novalidate
    @submit.prevent="send"
  >
    <fieldset class="types">
      <legend>{{ ui('Type de retour') }}</legend>
      <label
        v-for="option in typeOptions"
        :key="option.value"
        class="type-pill"
      >
        <input
          v-model="form.type"
          type="radio"
          :name="`type-${uid}`"
          :value="option.value"
        />
        <span>{{ option.label }}</span>
      </label>
    </fieldset>

    <q-input
      v-model="form.title"
      outlined
      :label="ui('Titre')"
      :maxlength="BETA_LIMITS.title"
      counter
      :error="showErrors && !!problems.title"
      :error-message="problems.title"
    />

    <div>
      <q-editor
        v-model="form.body"
        min-height="8rem"
        :toolbar="toolbar"
        :placeholder="ui('Ce qui s’est passé, ce que vous attendiez…')"
        :aria-label="ui('Description')"
      />
      <div
        class="text-caption q-mt-xs"
        :class="bodyLength > BETA_LIMITS.body ? 'text-negative' : 'text-muted'"
        >{{
          ui('{n} / {max} caractères', { n: bodyLength, max: BETA_LIMITS.body })
        }}</div
      >
      <p v-if="showErrors && problems.body" class="field-error" role="alert">{{
        problems.body
      }}</p>
    </div>

    <q-input
      v-model="form.steps"
      outlined
      type="textarea"
      autogrow
      :label="ui('Étapes pour reproduire (facultatif)')"
      :hint="ui('1. Ouvrir… 2. Toucher… 3. Constater…')"
      :maxlength="BETA_LIMITS.steps"
    />
    <q-input
      v-model="form.device"
      outlined
      :label="ui('Appareil et navigateur (facultatif)')"
      :hint="ui('Rempli automatiquement, modifiable.')"
      :maxlength="BETA_LIMITS.device"
    />

    <div class="attachments">
      <div class="row items-center q-gutter-sm">
        <q-btn
          outline
          no-caps
          icon="add_photo_alternate"
          color="primary"
          class="pick-images"
          :label="ui('Joindre des captures')"
          :disable="files.length >= BETA_LIMITS.files || busy"
          @click="picker?.click()"
        />
        <span class="text-caption text-muted">{{
          ui('PNG, JPEG ou WebP. {max} images, 2 Mo chacune au maximum.', {
            max: BETA_LIMITS.files
          })
        }}</span>
      </div>
      <input
        ref="picker"
        type="file"
        multiple
        :accept="BETA_IMAGE_ACCEPT"
        class="hidden-input"
        @change="pick"
      />
      <ul v-if="fileErrors.length" class="file-errors" role="alert">
        <li v-for="(message, i) in fileErrors" :key="i">{{ message }}</li>
      </ul>
      <div v-if="files.length" class="previews">
        <div v-for="(item, i) in files" :key="item.key" class="preview">
          <img v-if="item.url" :src="item.url" :alt="item.file.name" />
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
            :disable="busy"
            :aria-label="ui('Retirer {name}', { name: item.file.name })"
            @click="removeFile(i)"
          />
        </div>
      </div>
    </div>

    <q-linear-progress
      v-if="busy"
      :value="progress / 100"
      class="upload-progress"
      :aria-label="ui('Envoi en cours : {n} %', { n: progress })"
    />
    <q-banner
      v-if="error"
      class="workspace-alert feedback-error"
      role="alert"
      >{{ error }}</q-banner
    >

    <div class="row justify-end">
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        icon="send"
        class="send-feedback"
        :label="ui('Envoyer le retour')"
        :loading="busy"
      />
    </div>
  </form>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaTesterApi } from '@/services/beta'
import { formatFileSize, richTextLength } from '@/utils/suggestions'
import {
  BETA_IMAGE_ACCEPT,
  BETA_LIMITS,
  checkBetaImages,
  deviceSummary,
  feedbackFormData,
  feedbackProblems,
  feedbackTypeOptions
} from '@/utils/beta'

const props = defineProps({
  participationId: { type: [Number, String], required: true }
})
const emit = defineEmits(['sent'])
const $q = useQuasar()
const uid = Math.random().toString(36).slice(2, 8)

// Same toolbar as private suggestions: no image, video or HTML source button.
const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered', 'quote'],
  ['link', 'removeFormat'],
  ['undo', 'redo']
]
const typeOptions = computed(() => feedbackTypeOptions())
const blank = () => ({
  type: 'bug',
  title: '',
  body: '',
  steps: '',
  device: deviceSummary(
    typeof navigator === 'undefined' ? '' : navigator.userAgent
  )
})
const form = reactive(blank())
const files = ref([]),
  fileErrors = ref([]),
  picker = ref(null),
  busy = ref(false),
  progress = ref(0),
  error = ref(''),
  showErrors = ref(false)
let counter = 0

const bodyLength = computed(() => richTextLength(form.body))
const problems = computed(() => feedbackProblems(form))

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
        '« {name} » n’est pas une image acceptée. Formats possibles : PNG, JPEG ou WebP.',
        {
          name
        }
      ),
    empty: () => ui('« {name} » est vide.', { name }),
    duplicate: () => ui('« {name} » est déjà joint.', { name }),
    count: () =>
      ui('« {name} » n’a pas été ajouté : {max} images au maximum.', {
        name,
        max: BETA_LIMITS.files
      })
  }[reason]()
}

function addFiles(picked) {
  const { accepted, rejected } = checkBetaImages(
    files.value.map(item => item.file),
    picked
  )
  fileErrors.value = rejected.map(rejection)
  files.value.push(
    ...accepted.map(file => ({
      key: ++counter,
      file,
      url:
        typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : null
    }))
  )
}
function pick(event) {
  const picked = [...(event.target.files || [])]
  event.target.value = ''
  addFiles(picked)
}
function removeFile(index) {
  const [item] = files.value.splice(index, 1)
  if (item?.url) URL.revokeObjectURL(item.url)
}
function clearFiles() {
  files.value.forEach(item => item.url && URL.revokeObjectURL(item.url))
  files.value = []
  fileErrors.value = []
}

async function send() {
  if (busy.value) return
  showErrors.value = true
  error.value = ''
  if (Object.keys(problems.value).length) {
    error.value = Object.values(problems.value)[0]
    return
  }
  busy.value = true
  progress.value = 0
  try {
    const { data } = await betaTesterApi.sendFeedback(
      props.participationId,
      feedbackFormData(
        form,
        files.value.map(item => item.file)
      ),
      value => (progress.value = value)
    )
    clearFiles()
    Object.assign(form, blank())
    showErrors.value = false
    emit('sent', data?.data || null)
    $q.notify({
      type: 'positive',
      message: ui('Merci ! Votre retour a été transmis au développeur.')
    })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(clearFiles)
defineExpose({ form, files, fileErrors, addFiles, send, error })
</script>
<style scoped>
.types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}
.types legend {
  width: 100%;
  margin-bottom: 6px;
  font-weight: 650;
}
.type-pill {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}
.type-pill input {
  position: absolute;
  opacity: 0;
}
.type-pill span {
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 999px;
}
.type-pill input:checked + span {
  color: #fff;
  background: var(--q-primary);
  border-color: var(--q-primary);
}
.type-pill input:focus-visible + span {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.hidden-input {
  display: none;
}
.field-error,
.file-errors {
  margin: 6px 0 0;
  color: var(--q-negative);
  font-size: 13px;
}
.file-errors {
  padding-left: 18px;
}
.previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.preview {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px;
  border: 1px solid var(--outline);
  border-radius: 10px;
}
.preview img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
}
.preview-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  font-size: 12px;
}
</style>
