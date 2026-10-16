<template>
  <section
    class="workspace-card lab-assistant"
    aria-labelledby="assistant-heading"
  >
    <header class="assistant-heading">
      <div
        ><h2 id="assistant-heading">{{ ui('Assistant PWA') }}</h2
        ><p>{{
          ui(
            'Comprendre ce diagnostic et préparer vos corrections avec DeepSeek.'
          )
        }}</p></div
      >
      <q-icon name="auto_awesome" color="primary" size="28px" />
    </header>
    <p class="assistant-notice">{{
      ui(
        'Votre question et le contexte du diagnostic seront envoyés à DeepSeek. Ne partagez ni secrets ni données personnelles. Vérifiez les suggestions avant de les appliquer.'
      )
    }}</p>
    <div v-if="loading" role="status"
      ><q-skeleton type="rect" height="90px" /><span class="sr-only">{{
        ui('Chargement…')
      }}</span></div
    >
    <template v-else>
      <q-banner v-if="error" class="workspace-alert" role="alert"
        >{{ error
        }}<q-btn
          v-if="!ready"
          flat
          no-caps
          :label="ui('Réessayer')"
          @click="load"
      /></q-banner>
      <p v-if="!available && !error" role="status">{{
        ui(
          'L’assistant est indisponible. L’administrateur doit configurer une clé API, choisir un modèle et activer le service.'
        )
      }}</p>
      <q-form v-if="available" class="assistant-form" @submit="ask">
        <q-banner v-if="check" class="workspace-alert"
          >{{ ui('Point sélectionné :') }} {{ check.label
          }}<q-btn
            flat
            dense
            no-caps
            :label="ui('Diagnostic complet')"
            @click="clearCheck"
        /></q-banner>
        <q-select
          v-model="action"
          outlined
          emit-value
          map-options
          :options="actions"
          :label="ui('Aide souhaitée')"
          :disable="sending"
        />
        <q-input
          v-model="question"
          outlined
          type="textarea"
          autogrow
          maxlength="1000"
          counter
          :label="ui('Votre question (facultatif)')"
          :disable="sending"
        />
        <div class="assistant-actions"
          ><q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            icon="auto_awesome"
            :label="ui('Demander à l’assistant')"
            :loading="sending"
            :disable="quota?.remaining_today === 0"
          /><span v-if="quota">{{
            ui('{n} questions restantes aujourd’hui', {
              n: quota.remaining_today
            })
          }}</span></div
        >
        <p v-if="sending" role="status">{{
          ui('L’assistant prépare sa réponse…')
        }}</p>
      </q-form>
      <div v-if="records.length" class="assistant-history">
        <h3>{{ ui('Historique de ce diagnostic') }}</h3>
        <article
          v-for="record in records"
          :key="record.id"
          class="assistant-answer"
        >
          <small>{{ date(record.created_at) }} · {{ record.model }}</small>
          <p v-if="record.question" class="assistant-question">{{
            record.question
          }}</p>
          <p class="answer-text">{{
            record.answer ||
            ui(
              'Cette demande n’a pas produit de réponse. Vous pouvez réessayer.'
            )
          }}</p>
        </article>
      </div>
      <p v-else-if="ready && available" class="text-muted">{{
        ui(
          'Aucune question pour ce diagnostic. Commencez par demander les améliorations prioritaires.'
        )
      }}</p>
      <q-btn
        v-if="page < lastPage"
        outline
        no-caps
        color="primary"
        :label="ui('Voir plus')"
        :loading="loadingMore"
        @click="more"
        ><template #loading><q-spinner-dots /></template
      ></q-btn>
    </template>
  </section>
</template>
<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { assistantApi } from '@/services/assistant'
import { apiMessage } from '@/services/account'
import { ui } from '@/i18n/text'
import { labDate as date } from '@/utils/lab'

const props = defineProps({
  analysisId: { type: [Number, String], required: true },
  selectedCheck: { type: Object, default: null }
})
const check = ref(null),
  question = ref(''),
  action = ref('improve'),
  records = ref([]),
  quota = ref(null),
  available = ref(false),
  loading = ref(false),
  ready = ref(false),
  sending = ref(false),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1),
  loadingMore = ref(false)
const actions = computed(() =>
  check.value
    ? [
        { value: 'explain', label: ui('Expliquer ce point') },
        { value: 'fix', label: ui('Proposer une correction') },
        { value: 'example', label: ui('Donner un exemple') }
      ]
    : [
        { value: 'improve', label: ui('Prioriser les améliorations') },
        { value: 'analyze', label: ui('Expliquer le diagnostic') }
      ]
)
let sequence = 0
function clearCheck() {
  check.value = null
  action.value = 'improve'
}
watch(
  () => props.selectedCheck,
  value => {
    check.value = value
    action.value = value ? 'fix' : 'improve'
  }
)
function message(e) {
  if ([403, 404].includes(e.response?.status))
    return ui('L’assistant n’est pas disponible pour ce diagnostic.')
  if (e.response?.status === 429)
    return ui('La limite de demandes est atteinte. Réessayez plus tard.')
  if (e.response?.status === 503)
    return ui(
      'L’assistant est temporairement indisponible. Réessayez plus tard.'
    )
  return apiMessage(e)
}
function applyHistory(data, append = false) {
  const incoming = Array.isArray(data?.data) ? data.data : []
  records.value = append
    ? [
        ...new Map(
          [...records.value, ...incoming].map(item => [item.id, item])
        ).values()
      ]
    : incoming
  page.value = data.current_page || 1
  lastPage.value = data.last_page || 1
  if (data.quota) quota.value = data.quota
}
async function load() {
  const seq = ++sequence
  loading.value = true
  ready.value = false
  available.value = false
  error.value = ''
  records.value = []
  quota.value = null
  page.value = 1
  lastPage.value = 1
  question.value = ''
  clearCheck()
  try {
    const { data } = await assistantApi.status()
    if (seq !== sequence) return
    available.value = data.data?.available === true
    quota.value = data.data || null
    if (available.value) {
      const response = await assistantApi.history(props.analysisId)
      if (seq !== sequence) return
      applyHistory(response.data)
    }
    ready.value = true
  } catch (e) {
    if (seq === sequence) error.value = message(e)
  } finally {
    if (seq === sequence) loading.value = false
  }
}
async function more() {
  if (loadingMore.value) return
  const seq = sequence
  loadingMore.value = true
  error.value = ''
  try {
    const { data } = await assistantApi.history(
      props.analysisId,
      page.value + 1
    )
    if (seq === sequence) applyHistory(data, true)
  } catch (e) {
    if (seq === sequence) error.value = message(e)
  } finally {
    if (seq === sequence) loadingMore.value = false
  }
}
async function ask() {
  if (sending.value || !available.value || quota.value?.remaining_today === 0)
    return
  const seq = sequence
  sending.value = true
  error.value = ''
  try {
    const { data } = await assistantApi.ask({
      analysis_id: props.analysisId,
      action: action.value,
      ...(check.value ? { check_id: check.value.id } : {}),
      ...(question.value.trim() ? { question: question.value.trim() } : {})
    })
    if (seq !== sequence) return
    records.value = [
      data.data,
      ...records.value.filter(item => item.id !== data.data.id)
    ]
    if (data.quota) quota.value = data.quota
    question.value = ''
  } catch (e) {
    if (seq === sequence) {
      error.value = message(e)
      if (e.response?.data?.quota) quota.value = e.response.data.quota
      if ([403, 404].includes(e.response?.status)) available.value = false
    }
  } finally {
    if (seq === sequence) sending.value = false
  }
}
watch(
  () => props.analysisId,
  () => {
    sending.value = false
    loadingMore.value = false
    void load()
  },
  { immediate: true }
)
onBeforeUnmount(() => sequence++)
</script>
<style scoped>
.lab-assistant {
  margin: 20px 0;
  scroll-margin-top: 90px;
}
.assistant-heading,
.assistant-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.assistant-heading h2 {
  font-size: 20px;
  margin: 0;
}
.assistant-heading p,
.assistant-notice {
  color: var(--muted);
  line-height: 1.5;
}
.assistant-form {
  display: grid;
  gap: 12px;
}
.assistant-history h3 {
  font-size: 16px;
}
.assistant-answer {
  border-top: 1px solid var(--border);
  padding: 16px 0;
}
.assistant-answer small {
  color: var(--muted);
}
.answer-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.65;
}
.assistant-question {
  font-weight: 650;
  overflow-wrap: anywhere;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
