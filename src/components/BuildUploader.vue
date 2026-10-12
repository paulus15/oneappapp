<template>
  <q-form class="build-uploader" @submit="upload()">
    <div class="uploader-grid">
      <q-input
        v-model="form.version_number"
        outlined
        dense
        :label="t('builder.versionNumber')"
        :hint="t('builder.versionHint')"
        :rules="[v => !!v?.trim() || t('builder.versionRequired')]"
        :disable="disable"
      />
      <q-file
        v-model="form.zip_file"
        outlined
        dense
        accept=".zip"
        :label="t('builder.zip')"
        :hint="t('builder.zipHint')"
        :rules="[v => !!v || t('builder.zipRequired')]"
        :disable="disable"
      >
        <template #prepend><q-icon name="folder_zip" /></template>
      </q-file>
    </div>
    <q-input
      v-model="form.release_notes"
      outlined
      dense
      autogrow
      type="textarea"
      maxlength="2000"
      :label="t('builder.releaseNotes')"
      :disable="disable"
    />
    <fieldset class="uploader-permissions" :disabled="disable">
      <legend>{{ t('builder.permissions') }}</legend>
      <q-checkbox
        v-for="perm in PERMISSIONS"
        :key="perm"
        v-model="form.permissions_required"
        :val="perm"
        :label="t(`builder.permission.${perm}`)"
        dense
      />
    </fieldset>
    <q-linear-progress
      v-if="busy"
      :value="progress"
      :indeterminate="progress >= 1"
      class="q-my-sm"
      :aria-label="t('builder.uploading')"
    />
    <div
      v-if="failure"
      class="uploader-failure workspace-alert q-pa-md"
      role="alert"
    >
      <strong>{{ t('builder.refused') }}</strong>
      <ul>
        <li v-for="item in failure.errors" :key="item">{{ item }}</li>
      </ul>
      <template v-if="failure.warnings.length">
        <strong>{{ t('builder.warnings') }}</strong>
        <ul>
          <li v-for="item in failure.warnings" :key="item">{{ item }}</li>
        </ul>
      </template>
    </div>
    <q-btn
      type="submit"
      color="primary"
      unelevated
      no-caps
      icon="upload"
      :label="t('builder.submit')"
      :loading="busy"
      :disable="disable"
    />
  </q-form>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { accountApi, apiMessage } from '@/services/account'

// The one place where a build is uploaded; the server analyses it at once.
const props = defineProps({
  appId: { type: [Number, String], required: true },
  disable: { type: Boolean, default: false }
})
const emit = defineEmits(['uploaded'])
const PERMISSIONS = [
  'camera',
  'location',
  'notifications',
  'contacts',
  'storage',
  'audio'
]
const q = useQuasar()
const { t } = useI18n()
const blank = () => ({
  version_number: '',
  release_notes: '',
  zip_file: null,
  permissions_required: []
})
const form = reactive(blank())
const busy = ref(false),
  progress = ref(0),
  failure = ref(null)

async function upload(generatePwa = false) {
  busy.value = true
  progress.value = 0
  failure.value = null
  const data = new FormData()
  data.append('application_id', props.appId)
  data.append('version_number', form.version_number.trim())
  if (form.release_notes) data.append('release_notes', form.release_notes)
  data.append('zip_file', form.zip_file)
  form.permissions_required.forEach((perm, i) =>
    data.append(`permissions_required[${i}]`, perm)
  )
  if (generatePwa) data.append('auto_generate_pwa', 1)
  try {
    const { data: version } = await accountApi.uploadVersion(data, {
      onUploadProgress: e => (progress.value = e.total ? e.loaded / e.total : 0)
    })
    q.notify({
      type: 'positive',
      message: t(
        'builder.done',
        { n: version.detected_domains?.length || 0 },
        version.detected_domains?.length || 0
      )
    })
    Object.assign(form, blank())
    emit('uploaded', version)
  } catch (e) {
    const body = e.response?.data || {}
    if (body.error_code === 'MISSING_PWA_FILES') {
      q.dialog({
        title: t('builder.missingTitle'),
        message: t('builder.missingMessage'),
        cancel: { label: t('builder.missingCancel'), flat: true },
        ok: { label: t('builder.missingOk'), color: 'primary' },
        persistent: true
      }).onOk(() => upload(true))
    } else if (body.analysis) {
      failure.value = {
        errors: body.analysis.errors || [],
        warnings: (body.analysis.warnings || []).filter(Boolean)
      }
    } else {
      failure.value = { errors: [apiMessage(e)], warnings: [] }
    }
  } finally {
    busy.value = false
  }
}
</script>
<style scoped>
.build-uploader {
  display: grid;
  gap: 12px;
}
.uploader-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.uploader-permissions {
  border: 1px solid var(--outline, rgba(0, 0, 0, 0.12));
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.uploader-permissions legend {
  padding: 0 6px;
  font-size: 13px;
}
.uploader-failure ul {
  margin: 4px 0 8px;
  padding-left: 18px;
  overflow-wrap: anywhere;
}
</style>
