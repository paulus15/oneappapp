<template>
  <section class="integration-webhooks" aria-labelledby="webhooks-title">
    <div class="list-head">
      <div>
        <h2 id="webhooks-title">{{ ui('Webhooks') }}</h2>
        <p class="text-muted note">{{
          ui(
            'Un webhook prévient votre serveur dès qu’un événement se produit (audit terminé, mise à jour validée, incident…). Chaque envoi est signé avec un secret.'
          )
        }}</p>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        class="open-create-webhook"
        :label="ui('Ajouter un webhook')"
        :disable="loading || atCap"
        @click="openCreate"
      />
    </div>
    <p v-if="!loading && !error" class="text-muted cap-line">
      {{
        integrationsPlural('webhooks', hooks.length, {
          max: INTEGRATION_LIMITS.webhooks
        })
      }}
      <span v-if="atCap" class="cap-warning">{{
        ui('Limite atteinte : supprimez un webhook pour en ajouter un autre.')
      }}</span>
    </p>

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 2" :key="n" height="140px" class="q-mb-sm" />
    </div>
    <EmptyState
      v-else-if="error"
      compact
      tone="error"
      icon="cloud_off"
      :title="ui('Vos webhooks n’ont pas pu être chargés.')"
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
      v-else-if="!hooks.length"
      compact
      icon="webhook"
      :title="ui('Aucun webhook pour le moment.')"
      :text="
        ui(
          'Ajoutez l’adresse HTTPS de votre serveur pour recevoir les événements de vos applications.'
        )
      "
    />
    <ul v-else class="hook-list" role="list">
      <li v-for="hook in hooks" :key="hook.id" class="workspace-card hook-row">
        <div class="row-head">
          <code class="hook-url">{{ hook.url }}</code>
          <MonitorBadge
            :label="stateOf(hook).label"
            :icon="stateOf(hook).icon"
            :color="stateOf(hook).tone"
          />
        </div>
        <p v-if="webhookState(hook) === 'failing'" class="failing-note">{{
          ui(
            'Désactivé le {p0} après des échecs répétés. Corrigez votre serveur, puis réactivez-le.',
            { p0: integrationDate(hook.disabled_at, true) }
          )
        }}</p>
        <dl class="hook-facts">
          <div>
            <dt>{{ ui('Portée') }}</dt>
            <dd>{{ scopeLabel(hook.application) }}</dd>
          </div>
          <div v-if="hook.consecutive_failures > 0">
            <dt>{{ ui('Échecs') }}</dt>
            <dd class="text-warn">{{
              integrationsPlural('failures', hook.consecutive_failures)
            }}</dd>
          </div>
          <div>
            <dt>{{ ui('Créé le') }}</dt>
            <dd>{{ integrationDate(hook.created_at) }}</dd>
          </div>
        </dl>
        <ul class="event-chips" :aria-label="ui('Événements')">
          <li v-for="event in hook.events || []" :key="event">{{
            eventLabel(event)
          }}</li>
        </ul>
        <div class="row-actions">
          <q-btn
            flat
            no-caps
            color="primary"
            icon="list_alt"
            class="open-deliveries"
            :label="ui('Livraisons')"
            :aria-label="ui('Livraisons du webhook {p0}', { p0: hook.url })"
            @click="openDeliveries(hook)"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="send"
            class="ping-hook"
            :label="ui('Tester')"
            :aria-label="
              ui('Envoyer un événement de test à {p0}', { p0: hook.url })
            "
            :disable="webhookState(hook) !== 'active'"
            :loading="busy === `ping-${hook.id}`"
            @click="ping(hook)"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            :icon="webhookState(hook) === 'active' ? 'pause' : 'play_arrow'"
            class="toggle-hook"
            :label="
              webhookState(hook) === 'active'
                ? ui('Mettre en pause')
                : ui('Réactiver')
            "
            :aria-label="
              webhookState(hook) === 'active'
                ? ui('Mettre en pause le webhook {p0}', { p0: hook.url })
                : ui('Réactiver le webhook {p0}', { p0: hook.url })
            "
            :loading="busy === `toggle-${hook.id}`"
            @click="toggle(hook)"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="edit"
            class="edit-hook"
            :label="ui('Modifier')"
            :aria-label="ui('Modifier le webhook {p0}', { p0: hook.url })"
            @click="openEdit(hook)"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="key"
            class="rotate-hook"
            :label="ui('Nouveau secret')"
            :aria-label="
              ui('Générer un nouveau secret pour {p0}', { p0: hook.url })
            "
            @click="ask('rotate', hook)"
          />
          <q-btn
            flat
            no-caps
            color="negative"
            icon="delete"
            class="delete-hook"
            :label="ui('Supprimer')"
            :aria-label="ui('Supprimer le webhook {p0}', { p0: hook.url })"
            @click="ask('delete', hook)"
          />
        </div>
      </li>
    </ul>

    <!-- Creation / edition -->
    <q-dialog v-model="formOpen" :maximized="$q.screen.lt.sm">
      <q-card class="form-card">
        <q-form class="hook-form" @submit="save">
          <q-card-section>
            <h2>{{
              editing ? ui('Modifier le webhook') : ui('Nouveau webhook')
            }}</h2>
            <q-input
              v-model="form.url"
              outlined
              autofocus
              type="url"
              inputmode="url"
              :label="ui('Adresse de réception (HTTPS)')"
              :hint="
                ui(
                  'HTTPS sur le port 443, nom de domaine public. Exemple : https://exemple.com/webhooks/pwastore'
                )
              "
              :maxlength="INTEGRATION_LIMITS.url"
              :error="!!urlError"
              :error-message="urlError"
              @blur="urlTouched = true"
            />
            <q-select
              v-model="form.application_id"
              outlined
              emit-value
              map-options
              :options="scopeOptions"
              :label="ui('Applications concernées')"
              :disable="!!editing"
              :hint="
                editing
                  ? ui('La portée ne change pas après la création.')
                  : ui('Toutes vos applications, ou une seule.')
              "
            />
            <fieldset class="choices">
              <legend>{{ ui('Événements envoyés') }}</legend>
              <div v-for="option in events" :key="option.value" class="choice">
                <q-checkbox
                  v-model="form.events"
                  :val="option.value"
                  :label="option.label"
                  :aria-describedby="`event-${option.value.replace('.', '-')}`"
                />
                <small :id="`event-${option.value.replace('.', '-')}`">{{
                  option.description
                }}</small>
              </div>
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
              class="submit-hook"
              :label="editing ? ui('Enregistrer') : ui('Ajouter le webhook')"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <SecretReveal
      v-model="revealOpen"
      kind="secret"
      :secret="revealed"
      @closed="clearRevealed"
    />

    <!-- Rotate / delete confirmation -->
    <q-dialog v-model="confirmOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ confirmTitle }}</h2>
          <p>{{ confirmText }}</p>
          <p v-if="confirmError" class="form-error" role="alert">{{
            confirmError
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            :color="pending?.kind === 'delete' ? 'negative' : 'primary'"
            class="confirm-action"
            :label="
              pending?.kind === 'delete'
                ? ui('Supprimer')
                : ui('Générer un nouveau secret')
            "
            :loading="confirming"
            @click="confirm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <WebhookDeliveries v-model="deliveriesOpen" :webhook="deliveriesHook" />
  </section>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import EmptyState from '@/components/EmptyState.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import SecretReveal from '@/components/integrations/SecretReveal.vue'
import WebhookDeliveries from '@/components/integrations/WebhookDeliveries.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { integrationsApi } from '@/services/integrations'
import {
  INTEGRATION_LIMITS,
  eventLabel,
  eventOptions,
  integrationDate,
  integrationsPlural,
  newWebhookForm,
  scopeLabel,
  webhookFormError,
  webhookPayload,
  webhookState,
  webhookStateInfo,
  webhookUrlError,
  withoutSecret
} from '@/utils/integrations'

const props = defineProps({
  apps: { type: Array, default: () => [] }
})
const $q = useQuasar()

const hooks = ref([]),
  loading = ref(true),
  error = ref(''),
  formOpen = ref(false),
  editing = ref(null),
  saving = ref(false),
  formError = ref(''),
  urlTouched = ref(false),
  // Plaintext secret: this local ref only, cleared when the reveal dialog closes.
  revealed = ref(''),
  revealOpen = ref(false),
  confirmOpen = ref(false),
  pending = ref(null),
  confirming = ref(false),
  confirmError = ref(''),
  busy = ref(''),
  deliveriesOpen = ref(false),
  deliveriesHook = ref(null)
const form = reactive(newWebhookForm())

const events = computed(() => eventOptions())
const scopeOptions = computed(() => [
  { value: null, label: ui('Toutes mes applications') },
  ...props.apps.map(app => ({ value: app.id, label: app.name }))
])
const atCap = computed(() => hooks.value.length >= INTEGRATION_LIMITS.webhooks)
const urlError = computed(() =>
  urlTouched.value ? webhookUrlError(form.url) : ''
)
const stateOf = hook => webhookStateInfo(webhookState(hook))
const confirmTitle = computed(() =>
  pending.value?.kind === 'delete'
    ? ui('Supprimer ce webhook ?')
    : ui('Générer un nouveau secret ?')
)
const confirmText = computed(() =>
  pending.value?.kind === 'delete'
    ? ui(
        'Votre serveur ne recevra plus aucun événement à cette adresse, et l’historique des livraisons sera effacé. Cette action est définitive.'
      )
    : ui(
        'L’ancien secret cesse de fonctionner immédiatement : mettez à jour votre serveur avec le nouveau secret, sinon les signatures ne seront plus valides.'
      )
)

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
    const { data } = await integrationsApi.webhooks()
    if (current !== generation) return
    const list = Array.isArray(data?.data) ? data.data : []
    hooks.value = list.map(item => withoutSecret(item, 'secret'))
  } catch (e) {
    if (current !== generation) return
    hooks.value = []
    error.value = apiMessage(e)
  } finally {
    if (current === generation) loading.value = false
  }
}

function replaceHook(hook) {
  const clean = withoutSecret(hook, 'secret')
  hooks.value = hooks.value.some(item => item.id === clean.id)
    ? hooks.value.map(item => (item.id === clean.id ? clean : item))
    : [clean, ...hooks.value]
  // Keeps the open deliveries drawer in step (address, state).
  if (deliveriesHook.value?.id === clean.id) deliveriesHook.value = clean
}

function openCreate() {
  editing.value = null
  Object.assign(form, newWebhookForm())
  formError.value = ''
  urlTouched.value = false
  formOpen.value = true
}
function openEdit(hook) {
  editing.value = hook
  Object.assign(form, newWebhookForm(hook))
  formError.value = ''
  urlTouched.value = false
  formOpen.value = true
}

async function save() {
  if (saving.value) return
  urlTouched.value = true
  formError.value = webhookFormError(form)
  if (formError.value) return
  saving.value = true
  const hook = editing.value
  try {
    if (hook) {
      const { data } = await integrationsApi.updateWebhook(
        hook.id,
        webhookPayload(form, { editing: true })
      )
      replaceHook(data?.data || { ...hook, ...webhookPayload(form) })
      formOpen.value = false
      $q.notify({ type: 'positive', message: ui('Webhook enregistré.') })
    } else {
      const { data } = await integrationsApi.createWebhook(webhookPayload(form))
      const created = data?.data || {}
      revealed.value = String(created.secret || '')
      replaceHook(created)
      formOpen.value = false
      revealOpen.value = !!revealed.value
    }
  } catch (e) {
    formError.value = apiMessage(e)
  } finally {
    saving.value = false
  }
}

function clearRevealed() {
  revealed.value = ''
  revealOpen.value = false
}

function ask(kind, hook) {
  pending.value = { kind, hook }
  confirmError.value = ''
  confirmOpen.value = true
}

async function confirm() {
  const action = pending.value
  if (!action || confirming.value) return
  confirming.value = true
  confirmError.value = ''
  try {
    if (action.kind === 'delete') {
      await integrationsApi.deleteWebhook(action.hook.id)
      hooks.value = hooks.value.filter(item => item.id !== action.hook.id)
      if (deliveriesHook.value?.id === action.hook.id)
        deliveriesOpen.value = false
      confirmOpen.value = false
      $q.notify({ type: 'positive', message: ui('Webhook supprimé.') })
    } else {
      const { data } = await integrationsApi.rotateSecret(action.hook.id)
      revealed.value = String(data?.data?.secret || '')
      confirmOpen.value = false
      revealOpen.value = !!revealed.value
    }
  } catch (e) {
    confirmError.value = apiMessage(e)
  } finally {
    confirming.value = false
  }
}

async function ping(hook) {
  if (busy.value) return
  busy.value = `ping-${hook.id}`
  try {
    await integrationsApi.ping(hook.id)
    $q.notify({
      type: 'positive',
      message: ui(
        'Événement de test envoyé. Consultez les livraisons pour voir la réponse de votre serveur.'
      )
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    busy.value = ''
  }
}

async function toggle(hook) {
  if (busy.value) return
  const active = webhookState(hook) !== 'active'
  busy.value = `toggle-${hook.id}`
  try {
    const { data } = await integrationsApi.updateWebhook(hook.id, { active })
    replaceHook(
      data?.data || {
        ...hook,
        active,
        ...(active ? { disabled_at: null, consecutive_failures: 0 } : {})
      }
    )
    $q.notify({
      type: 'positive',
      message: active ? ui('Webhook réactivé.') : ui('Webhook mis en pause.')
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    busy.value = ''
  }
}

function openDeliveries(hook) {
  deliveriesHook.value = hook
  deliveriesOpen.value = true
}

onMounted(load)
defineExpose({
  hooks,
  form,
  editing,
  formOpen,
  formError,
  revealed,
  revealOpen,
  confirmOpen,
  pending,
  deliveriesOpen,
  deliveriesHook,
  load,
  openCreate,
  openEdit,
  save,
  clearRevealed,
  ask,
  confirm,
  ping,
  toggle,
  openDeliveries
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
.hook-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.hook-row {
  display: grid;
  gap: 10px;
  border: 1px solid var(--outline);
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.hook-url {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.failing-note {
  margin: 0;
  color: var(--q-negative);
  font-size: 14px;
}
.hook-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr));
  gap: 8px 16px;
  margin: 0;
}
.hook-facts dt {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.hook-facts dd {
  margin: 0;
  font-size: 14px;
}
.text-warn {
  color: var(--q-negative);
  font-weight: 600;
}
.event-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.event-chips li {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  background: color-mix(in srgb, var(--pwa-primary) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--pwa-primary) 25%, transparent);
  border-radius: 999px;
}
.row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
.form-card {
  width: min(600px, 100vw);
}
.form-card h2,
.confirm-card h2 {
  margin: 0 0 12px;
  font-size: 20px;
}
.hook-form .q-card__section {
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
