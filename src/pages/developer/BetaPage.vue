<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Tests bêta') }}</h1
      ><p>{{
        ui(
          'Recrutez des testeurs pour une version en préparation, donnez-leur un accès privé et recevez leurs retours avant la sortie.'
        )
      }}</p
      ><div class="workspace-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          class="new-campaign"
          to="/developer/beta/new"
          :label="ui('Nouvelle campagne')" /></div
    ></header>
    <DeveloperToolsNav />

    <p class="privacy-note">
      <q-icon name="lock" aria-hidden="true" />
      <span>{{
        ui(
          'Chaque campagne est validée par l’équipe PWA Store avant d’être visible. L’adresse de la version bêta et vos instructions ne sont montrées qu’aux testeurs acceptés.'
        )
      }}</span>
    </p>

    <section class="filters" :aria-label="ui('Filtres')">
      <q-select
        v-model="applicationId"
        :options="appOptions"
        emit-value
        map-options
        outlined
        dense
        clearable
        class="app-select"
        :label="ui('Toutes mes applications')"
      />
      <div class="status-chips" role="group" :aria-label="ui('Statut')">
        <button
          type="button"
          class="pill"
          :aria-pressed="!status"
          @click="status = null"
          >{{ ui('Toutes') }}</button
        >
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          class="pill"
          :data-status="option.value"
          :aria-pressed="status === option.value"
          @click="status = option.value"
          >{{ option.label }}</button
        >
      </div>
    </section>

    <div
      v-if="list.loading.value"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 3" :key="n" height="110px" class="q-mb-sm" />
    </div>
    <EmptyState
      v-else-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Les campagnes n’ont pas pu être chargées.')"
      :text="errorText"
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
      v-else-if="!items.length && (status || applicationId)"
      icon="filter_alt_off"
      :title="ui('Aucune campagne ne correspond à ces filtres.')"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Effacer les filtres')"
        @click="resetFilters"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length"
      icon="biotech"
      :title="ui('Aucune campagne de test pour le moment.')"
      :text="
        ui(
          'Créez une campagne : décrivez ce qu’il faut tester, fixez le nombre de places et les dates, puis envoyez-la en validation.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        to="/developer/beta/new"
        :label="ui('Nouvelle campagne')"
      />
    </EmptyState>
    <template v-else>
      <ul class="campaign-list" role="list">
        <li
          v-for="item in items"
          :key="item.id"
          class="workspace-card campaign-row"
        >
          <AppIcon :src="item.application?.icon_url" alt="" class="app-icon" />
          <div class="row-body">
            <div class="row-head">
              <router-link
                :to="`/developer/beta/${item.id}`"
                class="row-title"
                >{{ item.name }}</router-link
              >
              <span
                class="chip"
                :class="`tone-${campaignStatusColor(item.status)}`"
                >{{ campaignStatusLabel(item.status) }}</span
              >
              <span
                v-if="item.counts?.feedback_new"
                class="chip tone-primary"
                >{{ betaPlural('newFeedback', item.counts.feedback_new) }}</span
              >
            </div>
            <small class="muted meta">
              <span>{{ item.application?.name }}</span>
              <span>{{ dateRange(item.starts_at, item.ends_at) }}</span>
            </small>
            <ul class="counts" role="list">
              <li>{{ betaPlural('applied', item.counts?.applied) }}</li>
              <li>
                {{ betaPlural('accepted', item.counts?.accepted) }}
                <span class="muted">/ {{ item.max_participants }}</span>
              </li>
              <li>{{ betaPlural('feedback', item.counts?.feedback) }}</li>
            </ul>
            <p
              v-if="item.status === 'rejected' && item.review_reason"
              class="reason"
            >
              <q-icon name="info" aria-hidden="true" />
              {{ item.review_reason }}
            </p>
          </div>
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        :page-size="DEV_PAGE_SIZE"
        @load="list.loadMore()"
      />
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaDevApi } from '@/services/beta'
import {
  DEV_PAGE_SIZE,
  betaPlural,
  campaignStatusColor,
  campaignStatusLabel,
  campaignStatusOptions,
  dateRange
} from '@/utils/beta'

const appOptions = ref([]),
  applicationId = ref(null),
  status = ref(null)
const statusOptions = computed(() => campaignStatusOptions())

const list = useLoadMore(
  async page =>
    (
      await betaDevApi.campaigns({
        applicationId: applicationId.value,
        status: status.value,
        page
      })
    ).data
)
const items = list.items
const errorText = computed(() =>
  list.last.value?.response || list.last.value instanceof Error
    ? apiMessage(list.last.value)
    : ''
)
function resetFilters() {
  applicationId.value = null
  status.value = null
}

watch([applicationId, status], () => void list.reload())
onMounted(async () => {
  void list.reload()
  try {
    const { data } = await betaDevApi.apps()
    const apps = Array.isArray(data) ? data : data?.data || []
    appOptions.value = apps.map(app => ({ value: app.id, label: app.name }))
  } catch {
    // The list still works without the application filter.
  }
})
defineExpose({ applicationId, status })
</script>
<style scoped>
.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px 12px;
  font-size: 14px;
  background: var(--primary-soft, var(--surface-low));
  border-radius: 12px;
}
.privacy-note .q-icon {
  flex: none;
  margin-top: 2px;
  color: var(--pwa-link);
}
.filters {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}
.app-select {
  max-width: 360px;
}
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
.campaign-list {
  display: grid;
  gap: 10px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}
.campaign-row {
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
  gap: 6px;
  min-width: 0;
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.row-title {
  margin-right: 4px;
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
}
.row-title:hover {
  color: var(--pwa-link);
  text-decoration: underline;
}
.meta,
.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 0;
  padding: 0;
  font-size: 13px;
  list-style: none;
}
.muted {
  color: var(--muted);
}
.reason {
  display: flex;
  gap: 6px;
  margin: 0;
  color: var(--q-negative);
  font-size: 13px;
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
.tone-primary {
  --chip: var(--q-primary);
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
</style>
