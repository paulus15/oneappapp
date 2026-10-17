<template>
  <div class="q-mt-md q-mb-md">
    <q-toggle
      v-if="application.source_type === 'url'"
      :model-value="required"
      :disable="busy"
      :label="ui('Contrôle du script obligatoire avant soumission')"
      @update:model-value="setRequired"
    />
    <p
      v-if="application.source_type === 'url'"
      class="text-caption text-muted"
      >{{
        required
          ? ui(
              'Le script PWAStore doit être détecté sur le lien de cette application.'
            )
          : ui(
              'Le contrôle du script est facultatif pour cette application. Le contrôle de l’URL reste actif et l’exigence du manifeste PWA n’en dépend pas.'
            )
      }}</p
    >
    <q-toggle
      v-if="application.source_type === 'url'"
      :model-value="manifestRequired"
      :disable="busy"
      :label="ui('Manifeste PWA obligatoire')"
      data-test="manifest-required"
      @update:model-value="setManifestRequired"
    />
    <p
      v-if="application.source_type === 'url'"
      class="text-caption text-muted"
      >{{
        ui(
          'Décochez pour permettre la soumission de cette application sans manifeste PWA, par vous ou par le développeur. Les autres contrôles (HTTPS, accessibilité) restent obligatoires.'
        )
      }}</p
    >
    <div v-if="application.publisher_id && editable" class="row q-gutter-sm">
      <q-btn
        outline
        no-caps
        :disable="busy"
        :label="ui('Vérifier le dossier')"
        @click="check"
      />
      <q-btn
        color="primary"
        no-caps
        :loading="busy"
        :label="ui('Soumettre à validation')"
        @click="submit"
      />
    </div>
    <ul v-if="gaps.length"
      ><li v-for="gap in gaps" :key="gap">{{ gap }}</li></ul
    >
    <p v-if="error" class="text-negative" role="alert">{{ error }}</p>
    <p v-if="submitted" class="text-positive" role="status">{{
      ui(
        'Application soumise. Vous pouvez l’examiner depuis les demandes de publication.'
      )
    }}</p>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useQuasar } from 'quasar'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { ui } from '@/i18n/text'
const props = defineProps({ application: { type: Object, required: true } })
const emit = defineEmits(['submitted'])
const $q = useQuasar()
const required = ref(props.application.sdk_check_required !== false)
const manifestRequired = ref(props.application.manifest_required !== false)
const busy = ref(false),
  error = ref(''),
  gaps = ref([]),
  submitted = ref(false)
let active = true
const editable = computed(
  () =>
    !submitted.value &&
    [
      'draft',
      'rejected',
      'changes_requested',
      'published',
      'approved',
      'suspended'
    ].includes(props.application.status)
)
async function action(fn) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await fn()
  } catch (e) {
    if (active) error.value = apiMessage(e)
  } finally {
    if (active) busy.value = false
  }
}
function setRequired(value) {
  return action(async () => {
    const { data } = await adminApi.submissionSettings(props.application.id, {
      sdk_check_required: value
    })
    if (active) {
      required.value = data.sdk_check_required
      gaps.value = []
    }
  })
}
function saveManifestRequired(value) {
  return action(async () => {
    const { data } = await adminApi.submissionSettings(props.application.id, {
      manifest_required: value
    })
    if (!active) return
    manifestRequired.value = data.manifest_required
    gaps.value = []
    $q.notify({
      type: 'positive',
      message: data.manifest_required
        ? ui(
            'Le manifeste PWA est de nouveau obligatoire pour cette application.'
          )
        : ui(
            'Le manifeste PWA est désormais facultatif pour cette application.'
          )
    })
  })
}
// Waiving the manifest lets an app without one reach the reviewers: ask first.
function setManifestRequired(value) {
  if (busy.value) return
  if (value) return saveManifestRequired(true)
  $q.dialog({
    title: ui('Rendre le manifeste facultatif ?'),
    message: ui(
      'Cette application pourra être soumise sans manifeste PWA, par vous ou par le développeur. Les autres contrôles restent obligatoires.'
    ),
    cancel: { label: ui('Annuler'), flat: true },
    ok: { label: ui('Rendre facultatif'), color: 'primary' },
    persistent: true
  }).onOk(() => saveManifestRequired(false))
}
function check() {
  return action(async () => {
    const { data } = await adminApi.submissionReadiness(props.application.id)
    if (active)
      gaps.value = [
        ...data.gaps,
        ...data.blockers,
        ...(data.open_request ? [ui('Une demande est déjà en cours.')] : []),
        ...(!data.has_changes ? [ui('Aucune modification à soumettre.')] : [])
      ]
  })
}
function submit() {
  return action(async () => {
    await adminApi.submitPublisherApplication(props.application.id)
    if (active) {
      submitted.value = true
      gaps.value = []
      emit('submitted')
    }
  })
}
onBeforeUnmount(() => {
  active = false
})
</script>
