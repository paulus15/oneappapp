<template>
  <section class="integration-tokens" aria-labelledby="tokens-title">
    <div class="list-head">
      <div>
        <h2 id="tokens-title">{{ ui('Jetons d’accès') }}</h2>
        <p class="text-muted note">{{
          ui(
            'Un jeton permet à un outil (GitHub Actions, script, CI) d’appeler l’API PWA Store en votre nom, avec seulement les permissions que vous lui donnez.'
          )
        }}</p>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        class="open-create-token"
        :label="ui('Créer un jeton')"
        :disable="loading || atCap"
        @click="openCreate"
      />
    </div>
    <p v-if="!loading && !error" class="text-muted cap-line">
      {{
        integrationsPlural('activeTokens', activeCount, {
          max: INTEGRATION_LIMITS.activeTokens
        })
      }}
      <span v-if="atCap" class="cap-warning">{{
        ui('Limite atteinte : révoquez un jeton pour en créer un autre.')
      }}</span>
    </p>

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 2" :key="n" height="128px" class="q-mb-sm" />
    </div>
    <EmptyState
      v-else-if="error"
      compact
      tone="error"
      icon="cloud_off"
      :title="ui('Vos jetons n’ont pas pu être chargés.')"
      :text="error"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="load()"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!tokens.length"
      compact
      icon="key"
      :title="ui('Aucun jeton pour le moment.')"
      :text="
        ui(
          'Créez un jeton pour automatiser vos vérifications ou vos demandes de mise à jour.'
        )
      "
    />
    <ul v-else class="token-list" role="list">
      <li
        v-for="token in tokens"
        :key="token.id"
        class="workspace-card token-row"
        :class="{ revoked: token.revoked_at }"
      >
        <div class="row-head">
          <strong class="token-name">{{ token.name }}</strong>
          <MonitorBadge
            :label="stateOf(token).label"
            :icon="stateOf(token).icon"
            :color="stateOf(token).tone"
          />
        </div>
        <code class="token-prefix">{{ maskedToken(token.prefix) }}</code>
        <dl class="token-facts">
          <div>
            <dt>{{ ui('Portée') }}</dt>
            <dd>{{ scopeLabel(token.application) }}</dd>
          </div>
          <div>
            <dt>{{ ui('Validité') }}</dt>
            <dd
              :class="{
                'text-expiring': tokenState(token) === 'expiring',
                'text-warn': tokenState(token) === 'expired'
              }"
              >{{ expiryText(token) }}</dd
            >
          </div>
          <div>
            <dt>{{ ui('Dernière utilisation') }}</dt>
            <dd>{{
              token.last_used_at
                ? integrationDate(token.last_used_at, true)
                : ui('Jamais utilisé')
            }}</dd>
          </div>
          <div>
            <dt>{{ ui('Créé le') }}</dt>
            <dd>{{ integrationDate(token.created_at) }}</dd>
          </div>
          <div v-if="token.revoked_at">
            <dt>{{ ui('Révoqué le') }}</dt>
            <dd>{{ integrationDate(token.revoked_at, true) }}</dd>
          </div>
        </dl>
        <ul class="ability-chips" :aria-label="ui('Permissions')">
          <li v-for="ability in token.abilities || []" :key="ability">{{
            abilityLabel(ability)
          }}</li>
        </ul>
        <div v-if="!token.revoked_at" class="row-actions">
          <q-btn
            flat
            no-caps
            color="negative"
            icon="block"
            class="revoke-token"
            :label="ui('Révoquer')"
            :aria-label="ui('Révoquer le jeton {p0}', { p0: token.name })"
            @click="askRevoke(token)"
          />
        </div>
      </li>
    </ul>

    <!-- Creation -->
    <q-dialog v-model="createOpen" :maximized="$q.screen.lt.sm">
      <q-card class="form-card">
        <q-form class="token-form" @submit="createToken">
          <q-card-section>
            <h2>{{ ui('Nouveau jeton d’accès') }}</h2>
            <q-input
              v-model="form.name"
              outlined
              autofocus
              :label="ui('Nom du jeton')"
              :hint="
                ui(
                  'Pour vous repérer, par exemple : GitHub Actions — production.'
                )
              "
              :maxlength="INTEGRATION_LIMITS.tokenName"
              counter
            />
            <q-select
              v-model="form.application_id"
              outlined
              emit-value
              map-options
              :options="scopeOptions"
              :label="ui('Applications concernées')"
              :hint="
                ui(
                  'Limitez le jeton à une seule application quand c’est possible.'
                )
              "
            />
            <fieldset class="choices">
              <legend>{{ ui('Permissions') }}</legend>
              <p class="text-muted choice-help">{{
                ui(
                  'Donnez uniquement ce dont l’outil a besoin. Vous pourrez créer un autre jeton plus tard.'
                )
              }}</p>
              <div
                v-for="option in abilities"
                :key="option.value"
                class="choice"
              >
                <q-checkbox
                  v-model="form.abilities"
                  :val="option.value"
                  :label="option.label"
                  :aria-describedby="`ability-${option.value.replace(':', '-')}`"
                />
                <small :id="`ability-${option.value.replace(':', '-')}`">{{
                  option.description
                }}</small>
              </div>
            </fieldset>
            <fieldset class="choices">
              <legend>{{ ui('Durée de validité') }}</legend>
              <q-option-group
                v-model="form.expires_in_days"
                :options="expiries"
                type="radio"
                inline
              />
            </fieldset>
            <p v-if="formError" class="form-error" role="alert">{{
              formError
            }}</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              class="submit-token"
              :label="ui('Créer le jeton')"
              :loading="creating"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <SecretReveal
      v-model="revealOpen"
      kind="token"
      :secret="revealed"
      @closed="clearRevealed"
    />

    <!-- Revocation -->
    <q-dialog v-model="revokeOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ ui('Révoquer ce jeton ?') }}</h2>
          <p>{{
            ui(
              'Les outils qui utilisent « {p0} » ne pourront plus appeler l’API, immédiatement. Cette action est définitive.',
              { p0: revoking?.name || '' }
            )
          }}</p>
          <p v-if="revokeError" class="form-error" role="alert">{{
            revokeError
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="negative"
            class="confirm-revoke"
            :label="ui('Révoquer')"
            :loading="revokingBusy"
            @click="revoke"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import EmptyState from '@/components/EmptyState.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import SecretReveal from '@/components/integrations/SecretReveal.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { integrationsApi } from '@/services/integrations'
import {
  INTEGRATION_LIMITS,
  abilityLabel,
  abilityOptions,
  activeTokenCount,
  expiryOptions,
  expiryText,
  integrationDate,
  integrationsPlural,
  maskedToken,
  newTokenForm,
  scopeLabel,
  tokenFormError,
  tokenPayload,
  tokenState,
  tokenStateInfo,
  withoutSecret
} from '@/utils/integrations'

const props = defineProps({
  apps: { type: Array, default: () => [] }
})
const $q = useQuasar()

const tokens = ref([]),
  loading = ref(true),
  error = ref(''),
  createOpen = ref(false),
  creating = ref(false),
  formError = ref(''),
  // Plaintext token: this local ref only, cleared when the reveal dialog closes.
  revealed = ref(''),
  revealOpen = ref(false),
  revokeOpen = ref(false),
  revoking = ref(null),
  revokingBusy = ref(false),
  revokeError = ref('')
const form = reactive(newTokenForm())

const abilities = computed(() => abilityOptions())
const expiries = computed(() => expiryOptions())
const scopeOptions = computed(() => [
  { value: null, label: ui('Toutes mes applications') },
  ...props.apps.map(app => ({ value: app.id, label: app.name }))
])
const activeCount = computed(() => activeTokenCount(tokens.value))
const atCap = computed(
  () => activeCount.value >= INTEGRATION_LIMITS.activeTokens
)
const stateOf = token => tokenStateInfo(tokenState(token))

let generation = 0
onBeforeUnmount(() => {
  generation++
  revealed.value = ''
})

async function load() {
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    const { data } = await integrationsApi.tokens()
    if (current !== generation) return
    const list = Array.isArray(data?.data) ? data.data : []
    tokens.value = list.map(item => withoutSecret(item, 'token'))
  } catch (e) {
    if (current !== generation) return
    tokens.value = []
    error.value = apiMessage(e)
  } finally {
    if (current === generation) loading.value = false
  }
}

function openCreate() {
  Object.assign(form, newTokenForm())
  formError.value = ''
  createOpen.value = true
}

async function createToken() {
  if (creating.value) return
  formError.value = tokenFormError(form)
  if (formError.value) return
  creating.value = true
  try {
    const { data } = await integrationsApi.createToken(tokenPayload(form))
    const created = data?.data || {}
    revealed.value = String(created.token || '')
    // The list only keeps the public fields.
    tokens.value = [
      withoutSecret(created, 'token'),
      ...tokens.value.filter(item => item.id !== created.id)
    ]
    createOpen.value = false
    revealOpen.value = !!revealed.value
  } catch (e) {
    formError.value = apiMessage(e)
  } finally {
    creating.value = false
  }
}

function clearRevealed() {
  revealed.value = ''
  revealOpen.value = false
}

function askRevoke(token) {
  revoking.value = token
  revokeError.value = ''
  revokeOpen.value = true
}

async function revoke() {
  const token = revoking.value
  if (!token || revokingBusy.value) return
  revokingBusy.value = true
  revokeError.value = ''
  try {
    await integrationsApi.revokeToken(token.id)
    tokens.value = tokens.value.map(item =>
      item.id === token.id
        ? { ...item, revoked_at: new Date().toISOString() }
        : item
    )
    revokeOpen.value = false
    $q.notify({ type: 'positive', message: ui('Jeton révoqué.') })
  } catch (e) {
    revokeError.value = apiMessage(e)
  } finally {
    revokingBusy.value = false
  }
}

onMounted(load)
defineExpose({
  tokens,
  form,
  revealed,
  revealOpen,
  createOpen,
  formError,
  revokeOpen,
  load,
  openCreate,
  createToken,
  clearRevealed,
  askRevoke,
  revoke
})
</script>
<style scoped>
.list-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.list-head h2 {
  margin: 0 0 4px;
}
.note {
  max-width: 64ch;
  margin: 0;
  font-size: 14px;
}
.cap-line {
  margin: 10px 0 14px;
  font-size: 13px;
}
.cap-warning {
  display: block;
  color: var(--q-negative);
  font-weight: 600;
}
.token-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.token-row {
  display: grid;
  gap: 10px;
  border: 1px solid var(--outline);
}
.token-row.revoked {
  opacity: 0.75;
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.token-name {
  font-size: 16px;
  overflow-wrap: anywhere;
}
.token-prefix {
  justify-self: start;
  max-width: 100%;
  padding: 4px 8px;
  color: var(--text);
  font-size: 13px;
  overflow-wrap: anywhere;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 8px;
}
.token-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr));
  gap: 8px 16px;
  margin: 0;
}
.token-facts dt {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.token-facts dd {
  margin: 0;
  font-size: 14px;
}
.text-warn {
  color: var(--q-negative);
  font-weight: 600;
}
.text-expiring {
  color: color-mix(in srgb, var(--q-warning) 70%, var(--text));
  font-weight: 600;
}
.ability-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ability-chips li {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  background: color-mix(in srgb, var(--pwa-primary) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--pwa-primary) 25%, transparent);
  border-radius: 999px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
}
.form-card {
  width: min(600px, 100vw);
}
.form-card h2,
.confirm-card h2 {
  margin: 0 0 12px;
  font-size: 20px;
}
.token-form .q-card__section {
  display: grid;
  gap: 14px;
}
.choices {
  margin: 0;
  padding: 0;
  border: 0;
}
.choices legend {
  margin-bottom: 4px;
  font-weight: 700;
}
.choice-help {
  margin: 0 0 6px;
  font-size: 13px;
}
.choice {
  display: grid;
  padding: 4px 0;
}
.choice small {
  padding-left: 40px;
  color: var(--muted);
  line-height: 1.4;
}
.confirm-card {
  width: min(460px, 100vw);
}
.form-error {
  margin: 0;
  color: var(--q-negative);
}
</style>
