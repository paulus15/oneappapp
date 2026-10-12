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
          :label="ui('Télécharger')"
          :disable="busy"
          @click="download(doc)"
        />
        <q-btn
          flat
          no-caps
          color="negative"
          :label="ui('Supprimer')"
          :disable="busy"
          @click="remove(doc)"
        />
      </div>
    </article>
  </section>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { ref, watch } from 'vue'
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
  busy = ref(false)
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
    link.download = `justificatif.${{ 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }[doc.mime] || 'bin'}`
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
</style>
