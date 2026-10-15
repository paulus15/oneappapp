<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('PWA Monitor') }}</h1
      ><p>{{
        ui(
          'Disponibilité, temps de réponse, certificat et manifeste de vos applications, vérifiés à intervalle régulier. Ces mesures sont informatives : elles sont distinctes du contrôle automatique d’adresse effectué par le store.'
        )
      }}</p></header
    >
    <DeveloperToolsNav />

    <div
      v-if="list.loading.value"
      class="monitor-grid"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="workspace-card monitor-card"
        aria-hidden="true"
      >
        <div class="card-head">
          <q-skeleton width="44px" height="44px" class="skeleton-icon" />
          <div class="col">
            <q-skeleton type="text" width="60%" />
            <q-skeleton type="text" width="40%" />
          </div>
        </div>
        <q-skeleton type="text" width="90%" />
        <q-skeleton type="text" width="75%" />
      </div>
    </div>

    <EmptyState
      v-else-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger la surveillance.')"
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
      v-else-if="!list.items.value.length"
      icon="monitor_heart"
      :title="ui('Aucune application à surveiller.')"
      :text="
        ui(
          'Publiez une application avec une adresse HTTPS pour suivre sa disponibilité ici.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="apps"
        :label="ui('Mes applications')"
        to="/developer/apps"
      />
    </EmptyState>

    <template v-else>
      <EmptyState
        v-if="noneMonitorable"
        compact
        icon="monitor_heart"
        class="q-mb-md"
        :title="ui('Aucune application à surveiller.')"
        :text="
          ui(
            'Vos applications ne sont pas encore surveillables : publiez-les avec une adresse HTTPS.'
          )
        "
      />
      <ul class="monitor-grid" role="list">
        <li v-for="app in list.items.value" :key="app.id">
          <router-link
            :to="`/developer/monitor/${app.id}`"
            class="workspace-card monitor-card"
          >
            <div class="card-head">
              <AppIcon :src="app.icon_url" alt="" class="app-icon" />
              <div class="card-title">
                <strong>{{ app.name }}</strong>
                <small>{{ app.url }}</small>
              </div>
            </div>
            <div v-if="!isMonitorable(app)" class="badges">
              <MonitorBadge
                :label="
                  ui(
                    'Non surveillée — publiez l’application avec une adresse HTTPS'
                  )
                "
                icon="visibility_off"
              />
            </div>
            <div v-else class="badges">
              <MonitorBadge v-bind="monitorStatus(app.monitor?.state)" />
              <MonitorBadge
                v-if="app.monitor?.open_incident"
                :label="ui('Incident en cours')"
                icon="emergency"
                color="negative"
              />
              <MonitorBadge
                v-if="app.monitor && !app.monitor.enabled"
                :label="ui('Surveillance en pause')"
                icon="pause_circle"
              />
            </div>
            <dl v-if="isMonitorable(app)" class="metrics">
              <div>
                <dt>{{ ui('Dernière vérification') }}</dt>
                <dd>{{ monitorRelative(app.monitor?.last_checked_at) }}</dd>
              </div>
              <div>
                <dt>{{ ui('Temps de réponse') }}</dt>
                <dd>{{ monitorDuration(app.monitor?.response_ms) }}</dd>
              </div>
              <div>
                <dt>{{ ui('Disponibilité 7 j') }}</dt>
                <dd>{{ monitorUptime(app.monitor?.uptime_7d) }}</dd>
              </div>
              <div>
                <dt>{{ ui('Certificat') }}</dt>
                <dd>{{ monitorTls(app.monitor?.tls_days_left).label }}</dd>
              </div>
              <div>
                <dt>{{ ui('Manifeste') }}</dt>
                <dd>{{ monitorManifest(app.monitor?.manifest_ok).label }}</dd>
              </div>
            </dl>
          </router-link>
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="list.items.value.length"
        :total="list.total.value"
        :page-size="15"
        @load="list.loadMore()"
      />
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { monitorApi } from '@/services/monitor'
import {
  isMonitorable,
  monitorDuration,
  monitorManifest,
  monitorRelative,
  monitorStatus,
  monitorTls,
  monitorUptime
} from '@/utils/monitor'

const list = useLoadMore(async page => (await monitorApi.apps(page)).data)
const errorText = computed(() =>
  list.last.value instanceof Error ? apiMessage(list.last.value) : ''
)
// Shown above the list once every loaded app turns out to be a draft or without HTTPS.
const noneMonitorable = computed(
  () =>
    !list.hasMore.value &&
    list.items.value.length > 0 &&
    !list.items.value.some(isMonitorable)
)
onMounted(() => list.reload())
</script>
<style scoped>
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.monitor-grid > li {
  min-width: 0;
}
.monitor-card {
  display: grid;
  gap: 12px;
  height: 100%;
  color: var(--text);
  text-decoration: none;
  border: 1px solid var(--outline);
  transition: border-color var(--motion-fast, 160ms) ease;
}
a.monitor-card:hover {
  border-color: var(--pwa-primary);
}
a.monitor-card:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 3px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.app-icon,
.skeleton-icon {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
}
.card-title {
  display: grid;
  min-width: 0;
}
.card-title strong {
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-title small {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  margin: 0;
}
.metrics dt {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.metrics dd {
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 600;
}
</style>
