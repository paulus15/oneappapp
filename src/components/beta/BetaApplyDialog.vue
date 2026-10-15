<template>
  <q-dialog v-model="model" :maximized="$q.screen.lt.sm" @hide="onHide">
    <q-card
      class="apply-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <form novalidate @submit.prevent="send">
        <q-card-section>
          <h2 :id="titleId">{{
            ui('Participer à « {name} »', { name: campaign.name })
          }}</h2>
          <p class="text-muted">{{
            ui(
              'Le développeur choisit ses testeurs parmi les candidatures. Vous recevrez une notification dès qu’il aura répondu.'
            )
          }}</p>
        </q-card-section>

        <q-card-section class="apply-fields">
          <fieldset
            v-for="(question, index) in questions"
            :key="question.id"
            class="question"
            :class="{ invalid: showErrors && missing.includes(question.id) }"
            :data-question="question.id"
            :aria-describedby="
              showErrors && missing.includes(question.id)
                ? `${titleId}-err-${question.id}`
                : undefined
            "
          >
            <legend>
              <span>{{ index + 1 }}. {{ question.label }}</span>
              <span v-if="question.required" class="required">
                <span aria-hidden="true">*</span>
                <span class="sr-only">{{ ui('(obligatoire)') }}</span>
              </span>
            </legend>

            <textarea
              v-if="question.type === 'text'"
              v-model="answers[question.id]"
              class="answer-text"
              rows="3"
              :maxlength="BETA_LIMITS.answer"
              :aria-label="question.label"
              :aria-required="question.required ? 'true' : undefined"
            />

            <div v-else-if="question.type === 'choice'" class="choices">
              <label
                v-for="option in question.options || []"
                :key="option"
                class="choice"
              >
                <input
                  v-model="answers[question.id]"
                  type="radio"
                  :name="`q-${question.id}`"
                  :value="option"
                  :required="question.required"
                />
                <span>{{ option }}</span>
              </label>
            </div>

            <div v-else-if="question.type === 'rating'" class="rating">
              <label v-for="n in 5" :key="n" class="star">
                <input
                  v-model.number="answers[question.id]"
                  type="radio"
                  class="sr-only"
                  :name="`q-${question.id}`"
                  :value="n"
                  :required="question.required"
                />
                <span
                  class="star-face"
                  :class="{ on: Number(answers[question.id]) >= n }"
                  aria-hidden="true"
                  ><q-icon
                    :name="
                      Number(answers[question.id]) >= n
                        ? 'star'
                        : 'star_outline'
                    "
                /></span>
                <span class="sr-only">{{ ui('{n} sur 5', { n }) }}</span>
              </label>
              <small class="rating-help text-muted">{{
                ui('1 = pas du tout, 5 = tout à fait')
              }}</small>
            </div>

            <p
              v-if="showErrors && missing.includes(question.id)"
              :id="`${titleId}-err-${question.id}`"
              class="field-error"
              role="alert"
              >{{ ui('Réponse obligatoire.') }}</p
            >
          </fieldset>

          <label class="check">
            <input v-model="shareName" type="checkbox" class="share-name" />
            <span>
              <strong>{{ ui('Montrer mon nom au développeur') }}</strong>
              <small class="text-muted">{{
                ui(
                  'Sinon, il ne voit qu’un pseudonyme (« Testeur n° 12 ») et votre pays.'
                )
              }}</small>
            </span>
          </label>

          <label
            class="check terms"
            :class="{ invalid: showErrors && !acceptTerms }"
          >
            <input
              v-model="acceptTerms"
              type="checkbox"
              class="accept-terms"
              required
              aria-required="true"
            />
            <span>
              <strong>{{ ui('J’accepte les conditions du test') }}</strong>
              <ul class="terms-list">
                <li>{{
                  ui(
                    'La version bêta est confidentielle : je ne partage ni son adresse, ni ses captures, ni son contenu.'
                  )
                }}</li>
                <li>{{
                  ui(
                    'Mes retours sont privés : seul le développeur de l’application (et l’équipe PWA Store si nécessaire) peut les lire.'
                  )
                }}</li>
                <li>{{
                  ui(
                    'Je peux me retirer du test à tout moment depuis « Mes tests ».'
                  )
                }}</li>
              </ul>
            </span>
          </label>
          <p
            v-if="showErrors && !acceptTerms"
            class="field-error"
            role="alert"
            >{{
              ui(
                'Acceptez les conditions du test pour envoyer votre candidature.'
              )
            }}</p
          >

          <q-banner
            v-if="error"
            class="workspace-alert apply-error"
            role="alert"
            >{{ error }}</q-banner
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            class="send-application"
            :label="ui('Envoyer ma candidature')"
            :loading="busy"
          />
        </q-card-actions>
      </form>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaPublicApi } from '@/services/beta'
import { BETA_LIMITS, applyPayload, missingAnswers } from '@/utils/beta'

const props = defineProps({
  campaign: { type: Object, required: true },
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'applied', 'refresh'])
const $q = useQuasar()

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})
const titleId = `beta-apply-${Math.random().toString(36).slice(2, 8)}`
const questions = computed(() => props.campaign?.questions || [])
const answers = reactive({}),
  shareName = ref(false),
  acceptTerms = ref(false),
  showErrors = ref(false),
  busy = ref(false),
  error = ref('')
const missing = computed(() => missingAnswers(questions.value, answers))
const valid = computed(() => !missing.value.length && acceptTerms.value)

function reset() {
  for (const key of Object.keys(answers)) delete answers[key]
  shareName.value = false
  acceptTerms.value = false
  showErrors.value = false
  error.value = ''
}
watch(() => props.campaign?.id, reset)
function onHide() {
  if (!busy.value) error.value = ''
}

async function send() {
  if (busy.value) return
  showErrors.value = true
  error.value = ''
  if (!valid.value) return
  const id = props.campaign.id
  busy.value = true
  try {
    const { data } = await betaPublicApi.apply(
      id,
      applyPayload(questions.value, answers, {
        acceptTerms: acceptTerms.value,
        shareName: shareName.value
      })
    )
    if (props.campaign.id !== id) return
    emit('applied', data?.data || null)
    model.value = false
    reset()
    // With automatic acceptance the tester is accepted at once.
    $q.notify({
      type: 'positive',
      message:
        data?.data?.status === 'accepted'
          ? ui(
              'Vous êtes accepté ! L’accès à la version bêta est dans « Mes tests ».'
            )
          : ui('Candidature envoyée. Suivez-la dans « Mes tests ».')
    })
  } catch (e) {
    if (props.campaign.id !== id) return
    const status = e.response?.status
    if (status === 409) {
      error.value = ui(
        'Vous avez déjà envoyé une candidature pour cette campagne.'
      )
      emit('refresh')
    } else if (status === 422) {
      // Closed, full or an invalid answer: the server explains which.
      error.value =
        e.response?.data?.errors || e.response?.data?.message
          ? apiMessage(e)
          : ui(
              'Cette campagne n’accepte plus de candidatures (complète ou terminée).'
            )
      emit('refresh')
    } else error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}

defineExpose({ answers, shareName, acceptTerms, send, missing, error })
</script>
<style scoped>
.apply-card {
  width: min(640px, 100vw);
}
h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 750;
}
.apply-fields {
  display: grid;
  gap: 14px;
}
.question {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.question.invalid,
.terms.invalid {
  border-color: var(--q-negative);
}
.question legend {
  padding: 0 4px;
  font-weight: 650;
}
.required {
  margin-left: 4px;
  color: var(--q-negative);
}
.answer-text {
  width: 100%;
  padding: 8px 10px;
  color: var(--text);
  font: inherit;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 8px;
  resize: vertical;
}
.choices {
  display: grid;
  gap: 6px;
}
.choice,
.check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}
.choice input,
.check input {
  width: 18px;
  height: 18px;
  margin-top: 3px;
  flex: none;
  accent-color: var(--q-primary);
}
.check span {
  display: grid;
  gap: 2px;
}
.terms {
  padding: 10px 12px;
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.terms-list {
  margin: 4px 0 0;
  padding-left: 18px;
  color: var(--muted);
  font-size: 13px;
}
.rating {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.star {
  position: relative;
  cursor: pointer;
}
.star-face {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--muted);
  font-size: 26px;
  border-radius: 8px;
}
.star-face.on {
  color: var(--q-warning);
}
.star input:focus-visible + .star-face,
.answer-text:focus-visible,
.choice input:focus-visible,
.check input:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.rating-help {
  flex-basis: 100%;
}
.field-error {
  margin: 6px 0 0;
  color: var(--q-negative);
  font-size: 13px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
