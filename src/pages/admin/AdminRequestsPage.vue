<template>
  <q-page class="admin-page">
    <div class="admin-hero q-mb-lg">
      <div>
        <span class="admin-eyebrow"
          ><q-icon name="shield" /> {{ t('requests.eyebrow') }}</span
        >
        <h1 class="admin-title">{{ t('requests.title') }}</h1>
        <div class="admin-subtitle">{{ t('requests.intro') }}</div>
      </div>
    </div>
    <AdminNav />
    <q-tabs
      v-model="status"
      align="left"
      no-caps
      dense
      class="q-mb-md"
      active-color="primary"
      indicator-color="primary"
    >
      <q-tab name="open" :label="t('requests.open')" />
      <q-tab name="decided" :label="t('requests.decided')" />
    </q-tabs>
    <q-linear-progress v-if="loading" indeterminate />
    <EmptyState
      v-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      :text="ui('Les données n’ont pas pu être chargées.')"
      ><q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="load"
    /></EmptyState>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <p
      v-if="!loading && !error && !list.error.value && !items.length"
      class="empty-queue"
    >
      <q-icon name="inbox" size="40px" />
      <span>{{
        t(status === 'open' ? 'requests.emptyOpen' : 'requests.emptyDecided')
      }}</span>
    </p>
    <q-list v-else separator bordered class="rounded-borders queue">
      <q-item
        v-for="r in items"
        :key="r.id"
        clickable
        :to="`/admin/requests/${r.id}`"
      >
        <q-item-section avatar>
          <div class="queue-icon">
            <AppIcon
              :src="r.application?.icon_url"
              :alt="''"
              fallback-icon="apps"
            />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="queue-title">
            {{ r.application?.name }}
            <HostingBadge :source-type="r.application?.source_type" compact />
          </q-item-label>
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
              r.application?.developer?.developer_profile?.public_name ||
              r.application?.developer?.name
            }}
          </q-item-label>
          <q-item-label caption>
            {{
              status === 'open'
                ? t('requests.waiting', { time: timeAgo(r.submitted_at) })
                : t('workspace.history.decided', {
                    date: formatDate(r.decided_at)
                  })
            }}
          </q-item-label>
        </q-item-section>
        <q-item-section side class="queue-side">
          <q-chip
            dense
            :color="REQUEST_COLORS[r.status]"
            text-color="white"
            :label="t(`requests.status.${r.status}`)"
          />
          <div class="queue-alerts">
            <q-icon
              v-if="r.alerts?.quarantined"
              name="report"
              color="orange-8"
              size="20px"
              ><q-tooltip>{{
                t('requests.alert.quarantined')
              }}</q-tooltip></q-icon
            >
            <q-icon
              v-if="r.alerts?.high_risk_resources"
              name="travel_explore"
              color="red-7"
              size="20px"
              ><q-tooltip>{{
                t(
                  'requests.alert.highRisk',
                  { n: r.alerts.high_risk_resources },
                  r.alerts.high_risk_resources
                )
              }}</q-tooltip></q-icon
            >
            <q-icon
              v-if="r.alerts && !r.alerts.developer_verified"
              name="person_off"
              color="red-7"
              size="20px"
              ><q-tooltip>{{
                t('requests.alert.unverified')
              }}</q-tooltip></q-icon
            >
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-if="!loading" class="row justify-center q-mt-md">
      <LoadMore
        v-if="!loading && !list.error.value"
        auto
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        @load="list.loadMore"
      />
    </div>
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminNav from '@/components/AdminNav.vue'
import AppIcon from '@/components/AppIcon.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

// Oldest request first: whoever waited longest is decided first.
const list = useLoadMore(async page => {
  const { data } = await adminApi.requests({
    status: status.value,
    page: page
  })
  return data
})

const { t, locale } = useI18n()
const REQUEST_COLORS = {
  pending: 'blue-7',
  in_review: 'indigo-6',
  approved: 'green-7',
  changes_requested: 'orange-8',
  rejected: 'red-7',
  withdrawn: 'grey-7'
}
const status = ref('open'),
  items = list.items,
  loading = list.loading,
  error = ref('')
const formatDate = value =>
  value ? new Date(value).toLocaleString(locale.value) : ''
function timeAgo(value) {
  const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 36e5)
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  return hours < 24
    ? rtf.format(-Math.round(hours), 'hour')
    : rtf.format(-Math.round(hours / 24), 'day')
}

const load = () => {
  error.value = ''
  return list.reload()
}

watch(status, () => {
  load()
})
onMounted(load)
</script>
<style scoped>
.queue-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-high);
}
.queue-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.queue-side {
  align-items: flex-end;
  gap: 4px;
}
.queue-alerts {
  display: flex;
  gap: 4px;
}
.empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--muted);
  text-align: center;
}
</style>
