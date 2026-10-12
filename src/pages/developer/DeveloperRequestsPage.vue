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
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <p v-if="!loading && !items.length" class="text-muted">{{
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
    <div v-if="lastPage > 1" class="row justify-center q-mt-md">
      <q-pagination v-model="page" :max="lastPage" direction-links />
    </div>
  </q-page>
</template>
<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { accountApi, apiMessage } from '@/services/account'
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
const items = ref([]),
  summary = ref(null),
  page = ref(1),
  lastPage = ref(1),
  loading = ref(true),
  error = ref('')
const formatDate = value =>
  value ? new Date(value).toLocaleString(locale.value) : ''

async function load() {
  loading.value = true
  try {
    const { data } = await accountApi.developerRequests(page.value)
    summary.value = data.summary
    items.value = data.requests.data
    lastPage.value = data.requests.last_page
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
watch(page, load)
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
