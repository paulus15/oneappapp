<template>
  <q-dialog
    :model-value="modelValue"
    position="right"
    full-height
    :maximized="$q.screen.lt.sm"
    @update:model-value="value => $emit('update:modelValue', value)"
  >
    <q-card
      class="deliveries-drawer"
      role="region"
      :aria-label="ui('Livraisons du webhook')"
    >
      <q-card-section class="drawer-top">
        <div class="drawer-title">
          <h2>{{ ui('Livraisons') }}</h2>
          <code v-if="webhook">{{ webhook.url }}</code>
          <MonitorBadge
            v-if="webhook"
            class="drawer-state"
            :label="hookState.label"
            :icon="hookState.icon"
            :color="hookState.tone"
          />
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          :aria-label="ui('Fermer')"
          v-close-popup
        />
      </q-card-section>
      <q-card-section class="drawer-filter">
        <q-select
          v-model="status"
          outlined
          dense
          emit-value
          map-options
          :options="statusOptions"
          :label="ui('Statut')"
          class="status-filter"
        />
        <q-btn
          flat
          no-caps
          color="primary"
          icon="refresh"
          :label="ui('Actualiser')"
          @click="list.reload()"
        />
      </q-card-section>
      <q-card-section>
        <p v-if="actionError" class="action-error" role="alert">{{
          actionError
        }}</p>
        <div
          v-if="list.loading.value"
          role="status"
          aria-busy="true"
          :aria-label="ui('Chargement…')"
        >
          <q-skeleton v-for="n in 3" :key="n" height="96px" class="q-mb-sm" />
        </div>
        <EmptyState
          v-else-if="list.error.value"
          compact
          tone="error"
          icon="cloud_off"
          :title="ui('Les livraisons n’ont pas pu être chargées.')"
          :text="errorText"
        >
          <q-btn
            flat
            no-caps
            color="primary"
            icon="refresh"
            :label="ui('Réessayer')"
            @click="list.reload()"
          />
        </EmptyState>
        <EmptyState
          v-else-if="!list.items.value.length"
          compact
          icon="outbox"
          :title="
            status
              ? ui('Aucune livraison avec ce statut.')
              : ui('Aucune livraison pour le moment.')
          "
          :text="
            status
              ? ''
              : ui(
                  'Utilisez « Tester » pour envoyer un événement de test à votre adresse.'
                )
          "
        />
        <template v-else>
          <ul class="delivery-list" role="list">
            <li
              v-for="delivery in list.items.value"
              :key="delivery.id"
              class="delivery-row"
            >
              <div class="row-head">
                <strong>{{ eventLabel(delivery.event) }}</strong>
                <MonitorBadge
                  :label="deliveryStatusLabel(delivery.status)"
                  :icon="statusIcon(delivery.status)"
                  :color="deliveryStatusTone(delivery.status)"
                />
              </div>
              <dl class="delivery-facts">
                <div>
                  <dt>{{ ui('Créée le') }}</dt>
                  <dd>{{ integrationDate(delivery.created_at, true) }}</dd>
                </div>
                <div>
                  <dt>{{ ui('Tentatives') }}</dt>
                  <dd>{{
                    integrationsPlural('attempts', delivery.attempts)
                  }}</dd>
                </div>
                <div v-if="delivery.response_status">
                  <dt>{{ ui('Réponse') }}</dt>
                  <dd>{{
                    ui('HTTP {p0}', { p0: delivery.response_status })
                  }}</dd>
                </div>
                <div v-if="delivery.delivered_at">
                  <dt>{{ ui('Livrée le') }}</dt>
                  <dd>{{ integrationDate(delivery.delivered_at, true) }}</dd>
                </div>
                <div v-if="delivery.next_attempt_at">
                  <dt>{{ ui('Prochaine tentative') }}</dt>
                  <dd>{{ integrationDate(delivery.next_attempt_at, true) }}</dd>
                </div>
                <div v-if="delivery.event_id">
                  <dt>{{ ui('Identifiant de l’événement') }}</dt>
                  <dd
                    ><code>{{ delivery.event_id }}</code></dd
                  >
                </div>
              </dl>
              <div v-if="delivery.last_error" class="last-error">
                <span>{{ ui('Dernière erreur') }}</span>
                <pre>{{ delivery.last_error }}</pre>
              </div>
              <div class="row-actions">
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="replay"
                  class="redeliver"
                  :label="ui('Renvoyer')"
                  :aria-label="
                    ui('Renvoyer la livraison du {p0}', {
                      p0: integrationDate(delivery.created_at, true)
                    })
                  "
                  :disable="delivery.status === 'pending'"
                  :loading="redelivering === delivery.id"
                  @click="redeliver(delivery)"
                />
              </div>
            </li>
          </ul>
          <LoadMore
            :has-more="list.hasMore.value"
            :loading="list.loadingMore.value"
            :error="list.moreError.value"
            :shown="list.items.value.length"
            :total="list.total.value"
            :page-size="20"
            @load="list.loadMore()"
          />
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { integrationsApi } from '@/services/integrations'
import {
  deliveryStatusLabel,
  deliveryStatusOptions,
  deliveryStatusTone,
  eventLabel,
  integrationDate,
  integrationsPlural,
  webhookState,
  webhookStateInfo
} from '@/utils/integrations'

const props = defineProps({
  modelValue: Boolean,
  webhook: { type: Object, default: null }
})
defineEmits(['update:modelValue'])
const $q = useQuasar()

const status = ref(''),
  redelivering = ref(null),
  actionError = ref('')
const statusOptions = computed(() => deliveryStatusOptions())
const hookState = computed(() => webhookStateInfo(webhookState(props.webhook)))
const statusIcon = value =>
  ({ success: 'check_circle', failed: 'error', pending: 'schedule' })[value] ||
  'help_outline'

const list = useLoadMore(
  async page =>
    (
      await integrationsApi.deliveries(props.webhook.id, {
        status: status.value,
        page
      })
    ).data
)
const errorText = computed(() =>
  list.last.value instanceof Error ? apiMessage(list.last.value) : ''
)

// Opening the drawer (or switching webhook / filter) starts over; late pages of the
// previous list are ignored by useLoadMore.
watch(
  () => [props.modelValue, props.webhook?.id],
  ([open, id], previous) => {
    if (!open || !id) return
    actionError.value = ''
    if (previous?.[1] !== id && status.value) status.value = ''
    else void list.reload()
  },
  { immediate: true }
)
watch(status, () => {
  if (props.modelValue && props.webhook?.id) void list.reload()
})

async function redeliver(delivery) {
  const hook = props.webhook
  if (!hook || redelivering.value) return
  redelivering.value = delivery.id
  actionError.value = ''
  try {
    await integrationsApi.redeliver(hook.id, delivery.id)
    $q.notify({
      type: 'positive',
      message: ui(
        'Nouvel envoi programmé. Il apparaîtra dans quelques instants.'
      )
    })
    if (props.webhook?.id === hook.id) void list.reload()
  } catch (e) {
    // 409: already pending, or the webhook is disabled; the server says which.
    // Shown once, inline (role="alert").
    actionError.value = apiMessage(e)
    if (e.response?.status === 409 && props.webhook?.id === hook.id)
      void list.reload()
  } finally {
    redelivering.value = null
  }
}

defineExpose({ list, status, actionError, redeliver })
</script>
<style scoped>
.action-error {
  margin: 0 0 12px;
  color: var(--q-negative);
  font-weight: 600;
}
.deliveries-drawer {
  width: min(600px, 100vw);
}
.drawer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.drawer-title {
  min-width: 0;
}
.drawer-title h2 {
  margin: 0 0 4px;
  font-size: 20px;
}
.drawer-state {
  margin-top: 6px;
}
.drawer-title code {
  display: block;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.drawer-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding-top: 0;
  padding-bottom: 0;
}
.status-filter {
  min-width: 200px;
}
.delivery-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.delivery-row {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.delivery-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: 6px 14px;
  margin: 0;
}
.delivery-facts dt {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.delivery-facts dd {
  margin: 0;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.last-error span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.last-error pre {
  margin: 4px 0 0;
  padding: 8px 10px;
  max-height: 160px;
  overflow: auto;
  color: var(--text);
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 8px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
