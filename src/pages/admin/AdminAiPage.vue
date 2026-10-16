<template>
  <q-page class="workspace-page admin-ai">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Assistant IA') }}</h1
      ><p>{{
        ui(
          'L’assistant explique les résultats du Labo PWA aux développeurs et propose des corrections. Il ne s’active qu’avec une clé API et un modèle choisis ici.'
        )
      }}</p></header
    >
    <AdminNav />

    <aside class="privacy-notice" role="note">
      <q-icon name="privacy_tip" aria-hidden="true" />
      <p>{{
        ui(
          'Les questions et les résultats d’audit sont envoyés à DeepSeek (serveurs hors de votre infrastructure). Les questions peuvent contenir des données personnelles : évitez toute information sensible et mentionnez ce traitement dans votre politique de confidentialité.'
        )
      }}</p>
    </aside>

    <div v-if="loading" class="ai-skeletons" role="status">
      <span class="sr-only">{{ ui('Chargement…') }}</span>
      <q-skeleton type="rect" height="140px" />
      <q-skeleton type="rect" height="220px" />
    </div>
    <EmptyState
      v-else-if="loadError"
      class="ai-load-error"
      compact
      tone="error"
      icon="cloud_off"
      :title="ui('Les réglages de l’assistant n’ont pas pu être chargés.')"
      :text="loadError"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="load"
      />
    </EmptyState>

    <template v-else-if="settings">
      <q-banner
        v-if="settings.deployment_enabled === false"
        class="workspace-alert q-mb-md"
        role="status"
      >
        {{
          ui(
            'L’assistant est désactivé dans la configuration du serveur. Les réglages peuvent être enregistrés, mais le service ne sera disponible qu’après son activation par l’équipe technique.'
          )
        }}
      </q-banner>
      <section class="workspace-card ai-section" aria-labelledby="ai-key-title">
        <h2 id="ai-key-title" class="section-title">{{
          ui('Fournisseur et clé API')
        }}</h2>
        <p class="provider-line">
          <span class="text-muted">{{ ui('Fournisseur') }}</span>
          <strong class="provider-name">{{ providerName }}</strong>
        </p>

        <div v-if="settings.has_key && !replacing" class="stored-key">
          <p>
            <span class="text-muted">{{ ui('Clé enregistrée') }}</span>
            <code class="key-hint">{{ keyHintText(settings.key_hint) }}</code>
          </p>
          <div class="key-actions">
            <q-btn
              class="replace-key"
              outline
              no-caps
              color="primary"
              icon="sync_lock"
              :label="ui('Remplacer la clé')"
              @click="startReplace"
            />
            <q-btn
              class="remove-key"
              flat
              no-caps
              color="negative"
              icon="key_off"
              :label="ui('Supprimer la clé')"
              @click="removeOpen = true"
            />
          </div>
        </div>
        <div v-else class="key-entry">
          <q-input
            v-model="apiKey"
            class="api-key-input"
            outlined
            type="password"
            autocomplete="new-password"
            spellcheck="false"
            :label="
              settings.has_key ? ui('Nouvelle clé API') : ui('Clé API DeepSeek')
            "
            :hint="ui('La clé n’est jamais réaffichée après l’enregistrement.')"
            @update:model-value="testedKeyPending = false"
          />
          <q-btn
            v-if="replacing"
            class="cancel-replace"
            flat
            no-caps
            :label="ui('Annuler')"
            @click="cancelReplace"
          />
        </div>

        <div class="test-row">
          <q-btn
            class="test-key"
            outline
            no-caps
            color="primary"
            icon="network_check"
            :label="ui('Tester la clé')"
            :loading="testing"
            :disable="!apiKey.trim() && !settings.has_key"
            @click="test"
          />
          <small class="text-muted">{{
            apiKey.trim()
              ? ui('Teste la clé saisie, sans l’enregistrer.')
              : ui('Teste la clé enregistrée.')
          }}</small>
        </div>
        <div
          v-if="testResult"
          class="test-result"
          :class="testResult.ok ? 'test-ok' : 'test-refused'"
          role="status"
          aria-live="polite"
        >
          <q-icon
            :name="testResult.ok ? 'check_circle' : 'error'"
            aria-hidden="true"
          />
          <div>
            <strong>{{
              testResult.ok ? ui('Clé acceptée') : ui('Clé refusée')
            }}</strong>
            <p v-if="testResult.message" class="test-message">{{
              testResult.message
            }}</p>
            <p v-if="testResult.models.length" class="test-models">
              {{ ui('Modèles disponibles :') }}
              <code v-for="model in testResult.models" :key="model">{{
                model
              }}</code>
            </p>
            <q-btn
              v-if="testResult.ok && testedKeyPending"
              class="save-tested-key"
              unelevated
              no-caps
              color="primary"
              :label="ui('Enregistrer cette clé')"
              :loading="saving"
              @click="saveTestedKey"
            />
          </div>
        </div>
      </section>

      <q-form class="workspace-card ai-section ai-form" @submit="save">
        <h2 class="section-title">{{ ui('Modèle et limites') }}</h2>
        <q-select
          v-model="form.model"
          class="model-select"
          outlined
          emit-value
          map-options
          clearable
          :options="models"
          :label="ui('Modèle')"
          :hint="selectedModel?.description || ui('Choisissez un modèle.')"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <div class="enable-row">
          <q-toggle
            v-model="form.enabled"
            class="enable-toggle"
            :disable="!enableAllowed"
            :label="ui('Activer l’assistant')"
            :aria-describedby="enableAllowed ? undefined : 'enable-help'"
          />
          <p v-if="!enableAllowed" id="enable-help" class="enable-help">
            {{
              ui(
                'Enregistrez d’abord une clé API et choisissez un modèle pour activer l’assistant.'
              )
            }}
          </p>
        </div>

        <div class="limits">
          <q-input
            v-model.number="form.daily_quota"
            class="daily-quota"
            outlined
            type="number"
            :min="DAILY_QUOTA_MIN"
            :max="DAILY_QUOTA_MAX"
            :label="ui('Questions par développeur et par jour')"
            :error="Boolean(quotaError)"
            :error-message="quotaError"
          />
          <q-input
            v-model.number="form.monthly_token_budget"
            class="token-budget"
            outlined
            clearable
            type="number"
            min="1000"
            max="1000000000"
            :label="ui('Budget mensuel de jetons (facultatif)')"
            :hint="ui('Vide : pas de plafond mensuel.')"
            :error="Boolean(budgetMessage)"
            :error-message="budgetMessage"
          />
        </div>

        <p v-if="saveError" class="form-error" role="alert">{{ saveError }}</p>
        <div class="form-actions">
          <q-btn
            type="submit"
            class="save-settings"
            unelevated
            no-caps
            color="primary"
            :label="ui('Enregistrer')"
            :loading="saving"
            :disable="!dirty || Boolean(quotaError || budgetMessage)"
          />
          <small v-if="updatedLine" class="text-muted updated-line">{{
            updatedLine
          }}</small>
        </div>
      </q-form>

      <section class="workspace-card ai-section" aria-labelledby="ai-usage">
        <h2 id="ai-usage" class="section-title">{{ ui('Consommation') }}</h2>
        <dl class="usage">
          <div>
            <dt>{{ ui('Questions aujourd’hui') }}</dt>
            <dd class="usage-today">{{ formatCount(usage.requests_today) }}</dd>
          </div>
          <div>
            <dt>{{ ui('Jetons ce mois-ci') }}</dt>
            <dd class="usage-tokens">{{ formatCount(usage.tokens_month) }}</dd>
          </div>
          <div>
            <dt>{{ ui('Budget restant') }}</dt>
            <dd class="usage-budget">{{
              usage.budget_left == null
                ? ui('Sans plafond')
                : formatCount(usage.budget_left)
            }}</dd>
          </div>
        </dl>
      </section>
    </template>

    <q-dialog v-model="removeOpen">
      <q-card
        class="confirm-card"
        role="alertdialog"
        aria-labelledby="remove-title"
      >
        <q-card-section>
          <h2 id="remove-title">{{ ui('Supprimer la clé API ?') }}</h2>
          <p>{{
            ui(
              'L’assistant sera désactivé immédiatement pour tous les développeurs. Vous pourrez enregistrer une nouvelle clé plus tard.'
            )
          }}</p>
          <p v-if="removeError" class="form-error" role="alert">{{
            removeError
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            class="confirm-remove"
            unelevated
            no-caps
            color="negative"
            :label="ui('Supprimer la clé')"
            :loading="removing"
            @click="removeKey"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ui } from '@/i18n/text'
import { currentLocale } from '@/i18n'
import { apiMessage } from '@/services/account'
import { adminApi } from '@/services/admin'
import { loadPlatform } from '@/composables/usePlatform'
import { loadAdminOverview } from '@/composables/useAdminOverview'
import { formatCount } from '@/utils/adminOverview'
import {
  DAILY_QUOTA_MAX,
  DAILY_QUOTA_MIN,
  aiForm,
  aiSettingsPayload,
  budgetError,
  canEnableAssistant,
  dailyQuotaError,
  keyHintText,
  modelOptions
} from '@/utils/aiSettings'

const $q = useQuasar()

const settings = ref(null),
  form = ref(aiForm()),
  loading = ref(true),
  loadError = ref(''),
  // The typed key lives in this input only: never in Pinia nor in browser storage.
  apiKey = ref(''),
  replacing = ref(false),
  testing = ref(false),
  testResult = ref(null),
  saving = ref(false),
  saveError = ref(''),
  removeOpen = ref(false),
  removing = ref(false),
  removeError = ref(''),
  testedKeyPending = ref(false)
// A key that passed the test, kept outside the input until "Enregistrer cette clé".
let testedKey = ''
onBeforeUnmount(() => {
  testedKey = ''
  apiKey.value = ''
})

const providerName = computed(() =>
  settings.value?.provider === 'deepseek' || !settings.value?.provider
    ? 'DeepSeek'
    : settings.value.provider
)
const models = computed(() => modelOptions(settings.value))
const selectedModel = computed(() =>
  models.value.find(model => model.value === form.value.model)
)
const enableAllowed = computed(() =>
  canEnableAssistant(settings.value, form.value)
)
watch(enableAllowed, allowed => {
  if (!allowed) form.value.enabled = false
})
const usage = computed(() => settings.value?.usage || {})
const quotaError = computed(() => dailyQuotaError(form.value.daily_quota))
const budgetMessage = computed(() =>
  budgetError(form.value.monthly_token_budget)
)
const payload = computed(() =>
  settings.value
    ? aiSettingsPayload(settings.value, form.value, apiKey.value)
    : {}
)
const dirty = computed(() => Object.keys(payload.value).length > 0)
const updatedLine = computed(() => {
  const s = settings.value
  if (!s?.updated_at) return ''
  const date = new Date(s.updated_at)
  if (Number.isNaN(date.getTime())) return ''
  const when = date.toLocaleString(currentLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  return s.updated_by?.name
    ? ui('Modifié le {date} par {name}', {
        date: when,
        name: s.updated_by.name
      })
    : ui('Modifié le {date}', { date: when })
})

function apply(data) {
  settings.value = data
  form.value = aiForm(data)
}

let loadSeq = 0
async function load() {
  const seq = ++loadSeq
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await adminApi.aiSettings()
    if (seq !== loadSeq) return
    apply(data?.data || {})
  } catch (e) {
    if (seq !== loadSeq) return
    loadError.value = apiMessage(e)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function startReplace() {
  replacing.value = true
  apiKey.value = ''
  testResult.value = null
}
function cancelReplace() {
  replacing.value = false
  apiKey.value = ''
  testedKey = ''
  testedKeyPending.value = false
}
function clearTypedKey() {
  apiKey.value = ''
}

async function test() {
  if (testing.value) return
  const typed = apiKey.value.trim()
  testing.value = true
  testResult.value = null
  testedKey = ''
  testedKeyPending.value = false
  // The key leaves the input as soon as it is sent.
  clearTypedKey()
  try {
    const { data } = await adminApi.testAi(typed || undefined)
    const result = data?.data || {}
    testResult.value = {
      ok: result.ok === true,
      message: result.message || '',
      models: Array.isArray(result.models) ? result.models : []
    }
    if (result.ok === true && !typed) {
      const response = await adminApi.aiSettings()
      settings.value = response.data?.data || settings.value
    }
    if (result.ok === true && typed) {
      testedKey = typed
      testedKeyPending.value = true
    }
  } catch (e) {
    testResult.value = { ok: false, message: apiMessage(e), models: [] }
  } finally {
    testing.value = false
  }
}

function refreshCapabilities() {
  // Refresh failures must never turn an already-saved setting into a save error.
  void Promise.allSettled([
    loadPlatform({ refresh: true }),
    loadAdminOverview()
  ])
}

async function send(body, message) {
  saving.value = true
  saveError.value = ''
  try {
    const { data } = await adminApi.updateAiSettings(body)
    apply(data?.data || {})
    refreshCapabilities()
    replacing.value = false
    $q.notify({ type: 'positive', message })
    return true
  } catch (e) {
    saveError.value = apiMessage(e)
    return false
  } finally {
    saving.value = false
  }
}

async function save() {
  if (!dirty.value || saving.value || quotaError.value || budgetMessage.value)
    return
  const body = { ...payload.value }
  if (body.api_key) {
    testedKey = ''
    testedKeyPending.value = false
    testResult.value = null
  }
  clearTypedKey()
  await send(body, ui('Réglages de l’assistant enregistrés.'))
}

async function saveTestedKey() {
  if (!testedKey || saving.value) return
  const body = { api_key: testedKey }
  testedKey = ''
  testedKeyPending.value = false
  if (await send(body, ui('Clé API enregistrée.'))) testResult.value = null
}

async function removeKey() {
  removing.value = true
  removeError.value = ''
  try {
    const { data } = await adminApi.updateAiSettings({ remove_key: true })
    apply(data?.data || {})
    refreshCapabilities()
    removeOpen.value = false
    testResult.value = null
    $q.notify({ type: 'positive', message: ui('Clé API supprimée.') })
  } catch (e) {
    removeError.value = apiMessage(e)
  } finally {
    removing.value = false
  }
}

onMounted(load)
</script>
<style scoped>
.privacy-notice {
  display: flex;
  gap: 10px;
  margin: 0 0 16px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--pwa-primary) 9%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--pwa-primary) 30%, transparent);
  border-radius: 12px;
}
.privacy-notice .q-icon {
  margin-top: 2px;
  color: var(--pwa-primary);
  font-size: 20px;
}
.privacy-notice p {
  margin: 0;
  line-height: 1.5;
}
.ai-skeletons {
  display: grid;
  gap: 12px;
}
.ai-section {
  margin-bottom: 16px;
}
.section-title {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 750;
}
.provider-line,
.stored-key p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
}
.key-hint {
  padding: 2px 8px;
  font-size: 14px;
  background: color-mix(in srgb, var(--text) 7%, var(--surface));
  border-radius: 6px;
}
.key-actions,
.test-row,
.form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.key-entry {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
}
.api-key-input {
  flex: 1;
  min-width: min(100%, 280px);
}
.test-row {
  margin-top: 14px;
}
.test-result {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
}
.test-ok {
  background: color-mix(in srgb, var(--q-positive) 12%, var(--surface));
}
.test-ok > .q-icon {
  color: var(--q-positive);
}
.test-refused {
  background: color-mix(in srgb, var(--q-negative) 12%, var(--surface));
}
.test-refused > .q-icon {
  color: var(--q-negative);
}
.test-result p {
  margin: 4px 0;
}
.test-models code {
  margin: 0 4px;
  padding: 1px 6px;
  background: color-mix(in srgb, var(--text) 7%, var(--surface));
  border-radius: 5px;
}
.ai-form {
  display: grid;
  gap: 14px;
}
.enable-help {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.limits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}
.form-error {
  margin: 0;
  color: var(--q-negative);
  font-weight: 600;
}
.usage {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin: 0;
}
.usage dt {
  color: var(--muted);
  font-size: 12.5px;
}
.usage dd {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: 750;
}
.confirm-card {
  width: min(480px, 100vw);
}
.confirm-card h2 {
  margin: 0 0 12px;
  font-size: 20px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
