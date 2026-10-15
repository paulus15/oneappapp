<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Tests bêta') }}</h1
      ><p>{{
        ui(
          'Campagnes de test envoyées par les développeurs. Une campagne approuvée apparaît dans le catalogue « Devenir testeur ».'
        )
      }}</p></header
    >
    <AdminNav />

    <div class="status-chips" role="group" :aria-label="ui('Statut')">
      <button
        v-for="option in statusOptions"
        :key="option.value"
        type="button"
        class="pill"
        :aria-pressed="status === option.value"
        @click="status = option.value"
        >{{ option.label }}</button
      >
    </div>

    <div
      v-if="list.loading.value"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 3" :key="n" height="90px" class="q-mb-sm" />
    </div>
    <EmptyState
      v-else-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Les campagnes n’ont pas pu être chargées.')"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="list.reload()"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length"
      icon="task_alt"
      tone="success"
      :title="
        status === 'pending'
          ? ui('Aucune campagne en attente de validation.')
          : ui('Aucune campagne avec ce statut.')
      "
    />
    <template v-else>
      <ul class="rows" role="list">
        <li v-for="item in items" :key="item.id" class="workspace-card row">
          <AppIcon :src="item.application?.icon_url" alt="" class="app-icon" />
          <div class="row-body">
            <button
              type="button"
              class="row-title open-campaign"
              @click="open(item)"
              >{{ item.name }}</button
            >
            <small class="muted">
              {{ item.application?.name }} · {{ item.developer?.name }} ·
              {{ dateRange(item.starts_at, item.ends_at) }}
            </small>
            <small v-if="item.submitted_at" class="muted">{{
              ui('Envoyée le {date}', {
                date: betaDate(item.submitted_at, true)
              })
            }}</small>
          </div>
          <span
            class="chip"
            :class="`tone-${campaignStatusColor(item.status)}`"
            >{{ campaignStatusLabel(item.status) }}</span
          >
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        :page-size="LIST_PAGE_SIZE"
        @load="list.loadMore()"
      />
    </template>

    <q-dialog v-model="dialog" :maximized="$q.screen.lt.sm">
      <q-card v-if="current" class="detail-card">
        <q-card-section class="detail-top">
          <div>
            <span class="eyebrow">{{ current.application?.name }}</span>
            <h2>{{ current.name }}</h2>
            <small class="muted">{{
              ui('Par {name}', { name: current.developer?.name || '—' })
            }}</small>
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
        <q-card-section>
          <h3>{{ ui('Informations publiques') }}</h3>
          <dl class="facts">
            <dt>{{ ui('Description') }}</dt>
            <dd class="plain">{{ current.description }}</dd>
            <dt>{{ ui('Objectifs du test') }}</dt>
            <dd class="plain">{{ current.objectives }}</dd>
            <template v-if="current.eligibility">
              <dt>{{ ui('Conditions de participation') }}</dt>
              <dd class="plain">{{ current.eligibility }}</dd>
            </template>
            <dt>{{ ui('Dates') }}</dt>
            <dd>{{ dateRange(current.starts_at, current.ends_at) }}</dd>
            <dt>{{ ui('Pays') }}</dt>
            <dd>{{ countriesLabel(current.countries) }}</dd>
            <dt>{{ ui('Nombre de places') }}</dt>
            <dd>{{ current.max_participants }}</dd>
            <dt>{{ ui('Acceptation') }}</dt>
            <dd>{{
              current.auto_accept
                ? ui('Automatique tant qu’il reste des places')
                : ui('Manuelle')
            }}</dd>
            <template v-if="current.questions?.length">
              <dt>{{ ui('Questions aux candidats') }}</dt>
              <dd>
                <ol class="questions">
                  <li v-for="question in current.questions" :key="question.id">
                    {{ question.label }}
                    <small class="muted"
                      >({{ questionTypeLabel(question.type)
                      }}{{
                        question.required ? `, ${ui('obligatoire')}` : ''
                      }})</small
                    >
                    <small v-if="question.options?.length" class="muted">
                      — {{ question.options.join(' / ') }}</small
                    >
                  </li>
                </ol>
              </dd>
            </template>
          </dl>
        </q-card-section>
        <!-- The API sends the private fields only while the campaign is pending. -->
        <q-card-section
          v-if="current.beta_url || current.instructions"
          class="private-box"
        >
          <h3
            ><q-icon name="lock" aria-hidden="true" />
            {{ ui('Informations privées') }}</h3
          >
          <dl class="facts">
            <template v-if="current.beta_url">
              <dt>{{ ui('Adresse de la version bêta') }}</dt>
              <dd class="mono beta-url-text">{{ current.beta_url }}</dd>
              <dd class="note">{{
                ui(
                  'Affichée en texte pour la vérification ; elle n’est jamais publiée et seuls les testeurs acceptés la reçoivent. Ouvrez-la avec prudence.'
                )
              }}</dd>
            </template>
            <template v-if="current.instructions">
              <dt>{{ ui('Instructions') }}</dt>
              <dd><SuggestionDetail :suggestion="instructionsView" /></dd>
            </template>
          </dl>
        </q-card-section>
        <q-card-section v-if="current.status === 'pending'" class="decision">
          <q-input
            v-model="reason"
            outlined
            type="textarea"
            autogrow
            :maxlength="BETA_LIMITS.reason"
            :label="ui('Motif du refus (obligatoire pour refuser)')"
            :hint="ui('Le développeur le verra pour corriger sa campagne.')"
            :error="reasonMissing"
            :error-message="ui('Indiquez le motif du refus.')"
          />
          <p v-if="reviewError" class="form-error" role="alert">{{
            reviewError
          }}</p>
        </q-card-section>
        <q-card-actions v-if="current.status === 'pending'" align="right">
          <q-btn
            flat
            no-caps
            color="negative"
            class="reject-campaign"
            :label="ui('Refuser')"
            :loading="reviewing === 'reject'"
            @click="review('reject')"
          />
          <q-btn
            unelevated
            no-caps
            color="positive"
            class="approve-campaign"
            :label="ui('Approuver')"
            :loading="reviewing === 'approve'"
            @click="review('approve')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaAdminApi } from '@/services/beta'
import {
  BETA_LIMITS,
  LIST_PAGE_SIZE,
  betaDate,
  campaignStatusColor,
  campaignStatusLabel,
  countriesLabel,
  dateRange,
  questionTypeLabel
} from '@/utils/beta'

const $q = useQuasar()
const status = ref('pending'),
  dialog = ref(false),
  current = ref(null),
  reason = ref(''),
  reasonMissing = ref(false),
  reviewing = ref(null),
  reviewError = ref('')
const statusOptions = computed(() =>
  ['pending', 'approved', 'rejected', 'closed'].map(value => ({
    value,
    label: campaignStatusLabel(value)
  }))
)
const list = useLoadMore(
  async page =>
    (await betaAdminApi.campaigns({ status: status.value, page })).data
)
const items = list.items
const instructionsView = computed(() => ({
  id: `admin-${current.value?.id}`,
  body: current.value?.instructions || '',
  attachments: [],
  developer_reply: null
}))

function open(item) {
  current.value = item
  reason.value = ''
  reasonMissing.value = false
  reviewError.value = ''
  dialog.value = true
}

async function review(decision) {
  if (!current.value || reviewing.value) return
  const text = reason.value.trim()
  reviewError.value = ''
  if (decision === 'reject' && !text) {
    reasonMissing.value = true
    return
  }
  reasonMissing.value = false
  const id = current.value.id
  reviewing.value = decision
  try {
    await betaAdminApi.review(id, {
      decision,
      ...(text ? { reason: text } : {})
    })
    items.value = items.value.filter(item => item.id !== id)
    list.total.value = Math.max(0, list.total.value - 1)
    dialog.value = false
    $q.notify({
      type: 'positive',
      message:
        decision === 'approve'
          ? ui('Campagne approuvée : elle est visible dans le catalogue.')
          : ui('Campagne refusée. Le développeur est prévenu du motif.')
    })
  } catch (e) {
    reviewError.value = apiMessage(e)
  } finally {
    reviewing.value = null
  }
}

watch(status, () => void list.reload())
onMounted(() => void list.reload())
defineExpose({ open, review, reason, reasonMissing, current, dialog, status })
</script>
<style scoped>
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.pill {
  min-height: 36px;
  padding: 4px 14px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 999px;
  cursor: pointer;
}
.pill[aria-pressed='true'] {
  color: #fff;
  background: var(--q-primary);
  border-color: var(--q-primary);
}
.pill:focus-visible,
.row-title:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.rows {
  display: grid;
  gap: 10px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--outline);
}
.app-icon {
  flex: none;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 12px;
}
.row-body {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;
}
.row-title {
  padding: 0;
  color: var(--text);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}
.row-title:hover {
  color: var(--pwa-link);
  text-decoration: underline;
}
.muted {
  color: var(--muted);
}
.chip {
  --chip: var(--muted);
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 650;
  background: color-mix(in srgb, var(--chip) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--chip) 35%, transparent);
  border-radius: 999px;
}
.tone-positive {
  --chip: var(--q-positive);
}
.tone-orange-8 {
  --chip: var(--q-warning);
}
.tone-negative {
  --chip: var(--q-negative);
}
.detail-card {
  width: min(760px, 100vw);
  max-width: 100vw;
}
.detail-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.detail-top h2 {
  margin: 4px 0;
}
.facts {
  margin: 0;
}
.facts dt {
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
}
.facts dd {
  margin: 2px 0 0;
}
.plain {
  white-space: pre-line;
}
.questions {
  margin: 0;
  padding-left: 18px;
}
.private-box {
  margin: 0 16px;
  background: color-mix(in srgb, var(--q-warning) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--q-warning) 35%, transparent);
  border-radius: 12px;
}
.private-box h3 {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mono {
  font-family: ui-monospace, monospace;
  overflow-wrap: anywhere;
}
.note {
  color: var(--muted);
  font-size: 13px;
}
.form-error {
  margin: 8px 0 0;
  color: var(--q-negative);
}
</style>
