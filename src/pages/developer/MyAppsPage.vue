<template>
  <q-page class="workspace-page">
    <header class="workspace-heading">
      <span class="eyebrow">{{ t('devnav.eyebrow') }}</span>
      <h1>{{ t('myApps.title') }}</h1>
      <p>{{ t('myApps.intro') }}</p>
    </header>
    <div class="workspace-actions q-mb-md">
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        :label="t('myApps.create')"
        to="/developer/apps/create"
        :disable="!authStore.canCreateApp"
      />
    </div>
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <div v-if="!loading && !apps.length" class="empty-state">
      <q-icon name="apps" size="44px" />
      <h2>{{ t('myApps.emptyTitle') }}</h2>
      <p>{{ t('myApps.emptyText') }}</p>
    </div>
    <div class="apps-list">
      <router-link
        v-for="app in apps"
        :key="app.id"
        :to="`/developer/apps/${app.id}`"
        class="workspace-card app-row"
      >
        <div class="app-row-icon">
          <AppIcon :src="app.icon_url" :alt="''" fallback-icon="apps" />
        </div>
        <div class="app-row-main">
          <h2>{{ app.name }}</h2>
          <div class="app-row-meta">
            <q-chip
              dense
              :color="statusColor(app.status)"
              text-color="white"
              :label="statusLabel(app.status)"
            />
            <HostingBadge
              :source-type="app.source_type"
              compact
              :focusable="false"
            />
            <span class="text-caption text-muted">{{
              t('myApps.updated', { date: formatDate(app.updated_at) })
            }}</span>
          </div>
        </div>
        <q-btn
          unelevated
          no-caps
          rounded
          :color="step(app).color"
          :icon="step(app).icon"
          :label="t(`myApps.step.${step(app).key}`)"
          :to="step(app).to"
          class="app-row-action"
          @click.stop
        />
      </router-link>
    </div>
  </q-page>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
import { statusColor, statusLabel } from '@/utils/appStatus'
import { nextStep } from '@/utils/nextStep'
import AppIcon from '@/components/AppIcon.vue'
import HostingBadge from '@/components/HostingBadge.vue'

// Every app with the one thing to do next.
const { t, locale } = useI18n()
const authStore = useAuthStore()
const apps = ref([]),
  loading = ref(true),
  error = ref('')
const step = nextStep
const formatDate = value =>
  value ? new Date(value).toLocaleDateString(locale.value) : ''

onMounted(async () => {
  try {
    apps.value = (await api.get('/developer/apps')).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
})
</script>
<style scoped>
.apps-list {
  display: grid;
  gap: 12px;
}
.app-row {
  display: flex;
  align-items: center;
  gap: 14px;
  color: inherit;
  text-decoration: none;
  transition:
    transform var(--motion-fast) var(--motion-settle),
    border-color var(--motion-fast) var(--motion-settle);
}
.app-row:hover,
.app-row:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--q-primary) 35%, transparent);
}
.app-row-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  flex: 0 0 auto;
  background: var(--surface-high);
}
.app-row-main {
  flex: 1;
  min-width: 0;
}
.app-row-main h2 {
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-row-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.empty-state {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
  color: var(--muted);
}
@media (max-width: 700px) {
  .app-row {
    flex-wrap: wrap;
  }
  .app-row-action {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-row {
    transition: none;
  }
}
</style>
