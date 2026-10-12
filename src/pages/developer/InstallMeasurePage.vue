<template>
  <q-page class="workspace-page">
    <header class="workspace-heading">
      <span class="eyebrow">{{ t('devnav.eyebrow') }}</span>
      <h1>{{ t('sdk.title') }}</h1>
      <p>{{ t('measurePage.intro') }}</p>
    </header>
    <q-linear-progress v-if="loading" indeterminate />
    <div v-if="error" role="alert"
      ><p class="text-negative">{{ error }}</p
      ><q-btn flat no-caps :label="t('common.retry')" @click="load"
    /></div>
    <p v-if="!loading && !error && !apps.length" class="text-muted">{{
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
          <SdkSignalStatus
            :info="signals[app.id]"
            :published="app.status === 'published'"
          />
          <p
            v-if="signals[app.id].last_signal_at"
            class="text-caption text-muted"
            >{{ t('sdk.collection.period') }}</p
          >
          <dl class="measure-counts">
            <div>
              <dt
                >{{ t('sdk.installs') }}<InstallCountHelp kind="confirmed"
              /></dt>
              <dd>{{
                signals[app.id].last_signal_at
                  ? Number(
                      signals[app.id].confirmed_installs || 0
                    ).toLocaleString(locale)
                  : '—'
              }}</dd>
            </div>
            <div>
              <dt>{{ t('sdk.launches') }}</dt>
              <dd>{{
                signals[app.id].last_signal_at
                  ? Number(signals[app.id].launches || 0).toLocaleString(locale)
                  : '—'
              }}</dd>
            </div>
          </dl>
        </template>
        <div v-else-if="errors[app.id]" role="alert">
          <p class="text-negative">{{ errors[app.id] }}</p>
          <q-btn
            flat
            no-caps
            :label="t('common.retry')"
            @click="loadSignal(app)"
          />
        </div>
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
import SdkSignalStatus from '@/components/SdkSignalStatus.vue'
import InstallCountHelp from '@/components/InstallCountHelp.vue'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/boot/axios'
import { accountApi, apiMessage } from '@/services/account'
import AppIcon from '@/components/AppIcon.vue'

// Install measurement status for every app the developer hosts.
const { t, locale } = useI18n()
const apps = ref([]),
  loading = ref(true)
const signals = reactive({})

const errors = reactive({})
const error = ref('')
async function loadSignal(app) {
  delete errors[app.id]
  try {
    signals[app.id] = (await accountApi.installSignals(app.id)).data
  } catch (e) {
    errors[app.id] = apiMessage(e)
  }
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    apps.value = (await api.get('/developer/apps')).data.filter(
      a => a.source_type === 'url'
    )
    await Promise.all(apps.value.map(loadSignal))
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.measure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
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
