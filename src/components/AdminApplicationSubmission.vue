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
              'Le contrôle du script est facultatif pour cette application. Le contrôle de l’URL reste actif.'
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
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { ui } from '@/i18n/text'
const props = defineProps({ application: { type: Object, required: true } })
const emit = defineEmits(['submitted'])
const required = ref(props.application.sdk_check_required !== false)
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
    const { data } = await adminApi.submissionSettings(
      props.application.id,
      value
    )
    if (active) {
      required.value = data.sdk_check_required
      gaps.value = []
    }
  })
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
