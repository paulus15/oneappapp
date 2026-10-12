<template>
  <q-page class="workspace-page">
    <header class="workspace-heading">
      <span class="eyebrow">{{ t('devnav.eyebrow') }}</span>
      <h1>{{ t('sdk.title') }}</h1>
      <p>{{ t('measurePage.intro') }}</p>
    </header>
    <q-linear-progress v-if="loading" indeterminate />
    <p v-if="!loading && !apps.length" class="text-muted">{{
      t('measurePage.empty')
    }}</p>
    <div class="measure-grid">
      <article
        v-for="app in apps"
        :key="app.id"
        class="workspace-card measure-card"
      >
        <div class="measure-head">
          <div class="measure-icon">
            <AppIcon :src="app.icon_url" :alt="''" fallback-icon="apps" />
          </div>
          <h2>{{ app.name }}</h2>
        </div>
        <template v-if="signals[app.id]">
          <p class="measure-status">
            <q-icon
              :name="
                signals[app.id].check?.status === 'connected'
                  ? 'check_circle'
                  : 'info'
              "
              :color="
                signals[app.id].check?.status === 'connected'
                  ? 'positive'
                  : 'grey-7'
              "
            />
            {{
              signals[app.id].check
                ? t(`sdk.check.status.${signals[app.id].check.status}`)
                : t('sdk.recapUnchecked')
            }}
          </p>
          <dl class="measure-counts">
            <div>
              <dt>{{ t('sdk.installs') }}</dt>
              <dd>{{
                signals[app.id].confirmed_installs.toLocaleString(locale)
              }}</dd>
            </div>
            <div>
              <dt>{{ t('sdk.launches') }}</dt>
              <dd>{{ signals[app.id].launches.toLocaleString(locale) }}</dd>
            </div>
          </dl>
        </template>
        <q-skeleton v-else type="text" width="70%" />
        <q-btn
          flat
          no-caps
          color="primary"
          icon-right="arrow_forward"
          :label="t('measurePage.open')"
          :to="`/developer/apps/${app.id}?tab=version`"
        />
      </article>
    </div>
  </q-page>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/boot/axios'
import { accountApi } from '@/services/account'
import AppIcon from '@/components/AppIcon.vue'

// Install measurement status for every app the developer hosts.
const { t, locale } = useI18n()
const apps = ref([]),
  loading = ref(true)
const signals = reactive({})

onMounted(async () => {
  try {
    apps.value = (await api.get('/developer/apps')).data.filter(
      a => a.source_type === 'url'
    )
  } finally {
    loading.value = false
  }
  await Promise.all(
    apps.value.map(async app => {
      try {
        signals[app.id] = (await accountApi.installSignals(app.id)).data
      } catch {
        // The card keeps its link; the details open in the app's Version tab.
      }
    })
  )
})
</script>
<style scoped>
.measure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.measure-card {
  display: grid;
  gap: 8px;
  align-content: start;
}
.measure-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.measure-head h2 {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.measure-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  overflow: hidden;
  flex: 0 0 auto;
  background: var(--surface-high);
}
.measure-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-weight: 600;
}
.measure-counts {
  display: flex;
  gap: 20px;
  margin: 0;
}
.measure-counts dt {
  font-size: 12px;
  color: var(--muted);
}
.measure-counts dd {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
</style>
