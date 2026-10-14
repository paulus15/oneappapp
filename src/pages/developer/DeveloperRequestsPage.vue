<template>
  <q-page class="workspace-page">
    <header class="workspace-heading">
      <span class="eyebrow">{{ t('devnav.eyebrow') }}</span>
      <h1>{{ t('devRequests.title') }}</h1>
      <p>{{ t('devRequests.intro') }}</p>
    </header>
    <div v-if="summary" class="summary-grid">
      <div class="workspace-card summary-card">
        <q-icon name="hourglass_top" color="indigo-6" size="26px" />
        <strong>{{ summary.open }}</strong>
        <span>{{
          t('devRequests.open', { n: summary.open }, summary.open)
        }}</span>
      </div>
      <div
        class="workspace-card summary-card"
        :class="{ attention: summary.to_fix }"
      >
        <q-icon name="build_circle" color="orange-8" size="26px" />
        <strong>{{ summary.to_fix }}</strong>
        <span>{{
          t('devRequests.toFix', { n: summary.to_fix }, summary.to_fix)
        }}</span>
      </div>
    </div>
    <q-linear-progress v-if="loading" indeterminate />
    <EmptyState
      v-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      ><q-btn flat :label="ui('Réessayer')" @click="load"
    /></EmptyState>
    <p v-if="!loading && !error && !items.length" class="text-muted">{{
      t('workspace.history.noRequest')
    }}</p>
    <section v-if="items.length" class="workspace-card">
      <q-list separator>
        <q-item
          v-for="r in items"
          :key="r.id"
          clickable
          :to="`/developer/apps/${r.application_id}?tab=history`"
        >
          <q-item-section avatar>
            <div class="req-icon">
              <AppIcon
                :src="r.application?.icon_url"
                :alt="''"
                fallback-icon="apps"
              />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="req-title">{{
              r.application?.name
            }}</q-item-label>
            <q-item-label caption>
              {{ t(`requests.kind.${r.kind}`) }}
              <span v-if="r.version">
                ·
                {{
                  t('publication.versions.version', {
                    number: r.version.version_number
                  })
                }}</span
              >
              ·
              {{
                t('workspace.history.sent', {
                  date: formatDate(r.submitted_at)
                })
              }}
            </q-item-label>
            <q-item-label v-if="r.reason" class="req-reason">{{
              r.reason
            }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              dense
              :color="COLORS[r.status]"
              text-color="white"
              :label="t(`requests.status.${r.status}`)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </section>
    <LoadMore
      v-if="!loading"
      auto
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="items.length"
      :total="list.total.value"
      @load="list.loadMore"
    />
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { accountApi } from '@/services/account'
import AppIcon from '@/components/AppIcon.vue'

// Every request sent for review, across all the developer's apps.
const { t, locale } = useI18n()
const COLORS = {
  pending: 'blue-7',
  in_review: 'indigo-6',
  approved: 'green-7',
  changes_requested: 'orange-8',
  rejected: 'red-7',
  withdrawn: 'grey-7'
}
const list = useLoadMore(async page => {
  const { data } = await accountApi.developerRequests(page)
  return { ...data.requests, summary: data.summary }
})
const items = list.items,
  loading = list.loading,
  error = list.error,
  summary = ref(null)
watch(list.last, data => {
  summary.value = data?.summary || null
})
const formatDate = value =>
  value ? new Date(value).toLocaleString(locale.value) : ''

const load = list.reload
onMounted(load)
</script>
<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.summary-card {
  display: grid;
  gap: 2px;
}
.summary-card strong {
  font-size: 28px;
  font-weight: 750;
  line-height: 1.1;
}
.summary-card span {
  color: var(--muted);
  font-size: 13px;
}
.summary-card.attention {
  border-color: color-mix(in srgb, #ff9416 45%, transparent);
}
.req-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  overflow: hidden;
  background: var(--surface-high);
}
.req-title {
  font-weight: 600;
}
.req-reason {
  white-space: pre-line;
  font-size: 13px;
  margin-top: 4px;
}
</style>
