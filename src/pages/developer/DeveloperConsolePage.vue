<template>
  <q-page class="console-page">
    <div class="console-hero row justify-between items-center q-mb-lg">
      <div>
        <span class="console-eyebrow"
          ><q-icon name="code" /> Votre workspace</span
        >
        <h1 class="console-title">Construisez la prochaine expérience.</h1>
        <div class="console-subtitle">
          Soumettez vos applications Web et gérez vos builds (.oap / ZIP)
        </div>
      </div>
      <q-btn
        unelevated
        no-caps
        icon="add"
        label="Créer une application"
        class="create-btn"
        to="/developer/apps/create"
        :disable="!authStore.canCreateApp"
      />
    </div>

    <q-banner v-if="!authStore.canCreateApp" class="workspace-alert"
      >Votre profil doit être complet et validé avant toute création
      d’application, même en brouillon.
      <q-btn flat to="/developer/profile" label="Compléter mon profil"
    /></q-banner>
    <!-- Apps list -->
    <div v-if="loading" class="row justify-center q-my-xl" id="applications">
      <q-spinner-orbit color="primary" size="48px" />
    </div>

    <div
      v-else-if="myApps.length === 0"
      class="text-center q-my-xl"
      id="applications"
    >
      <q-avatar size="64px" class="bg-blue-grey-900 q-mb-md">
        <q-icon name="code" color="blue-grey-200" size="36px" />
      </q-avatar>
      <div class="text-h6 text-blue-grey-200">Aucune application soumise</div>
      <div class="text-caption text-blue-grey-400 q-mb-md">
        Commencez par soumettre votre première application Web.
      </div>
      <q-btn
        unelevated
        no-caps
        label="Créer une application"
        class="create-btn"
        to="/developer/apps/create"
        :disable="!authStore.canCreateApp"
      />
    </div>

    <div v-else class="row q-col-gutter-md" id="applications">
      <div v-for="app in myApps" :key="app.id" class="col-12 col-md-6 col-lg-4">
        <q-card
          class="glass-panel app-console-card h-full flex column justify-between"
        >
          <div>
            <div class="row justify-between items-start no-wrap q-mb-sm">
              <div
                class="row items-center app-title-clickable cursor-pointer"
                @click="$router.push(`/developer/apps/${app.id}`)"
              >
                <q-avatar
                  size="44px"
                  class="q-mr-md bg-blue-grey-900 border-blue-grey-sm rounded-borders"
                >
                  <AppIcon
                    :src="app.icon_url"
                    :alt="`Icône de ${app.name}`"
                    fallback-icon="apps"
                  />
                </q-avatar>
                <div>
                  <div
                    class="text-subtitle1 text-white text-weight-bold app-name-hover row items-center gap-xs"
                  >
                    <span>{{ app.name }}</span>
                    <q-icon name="edit" size="14px" class="text-blue-grey-4" />
                  </div>
                  <div class="text-caption text-blue-grey-300 font-mono">{{
                    app.identifier
                  }}</div>
                </div>
              </div>
            </div>

            <div class="row items-center wrap gap-xs q-mb-sm">
              <q-chip
                v-if="app.versions?.length > 0"
                dense
                size="11px"
                color="indigo-9"
                text-color="indigo-2"
                class="text-weight-bold font-mono"
              >
                v{{ app.versions[0].version_number }}
              </q-chip>
              <q-badge
                v-if="app.is_active === false || app.is_active === 0"
                color="amber-9"
                class="q-py-xs q-px-sm text-weight-bold"
              >
                INACTIVE
              </q-badge>
              <q-badge
                :color="statusColor(app.status)"
                class="q-py-xs q-px-sm text-weight-bold"
              >
                {{ statusLabel(app.status) }}
              </q-badge>
              <HostingBadge :source-type="app.source_type" compact />
            </div>

            <div class="text-caption text-blue-grey-200 q-mb-md line-clamp-2">
              {{
                app.short_description ||
                app.description ||
                'Pas de description renseignée.'
              }}
            </div>
          </div>

          <div
            class="row justify-between items-center q-pt-sm border-top-subtle"
          >
            <q-btn
              flat
              no-caps
              dense
              icon="open_in_new"
              :label="t('console.open')"
              color="primary"
              class="text-caption text-weight-bold"
              :to="`/developer/apps/${app.id}`"
            />
            <div class="row items-center gap-xs">
              <q-btn
                v-if="app.source_type !== 'url'"
                unelevated
                no-caps
                dense
                icon="cloud_upload"
                :label="t('console.newVersion')"
                class="upload-btn q-px-sm"
                :to="`/developer/apps/${app.id}?tab=version`"
              />
              <q-btn
                v-if="isAdmin"
                flat
                round
                dense
                icon="archive"
                class="delete-btn"
                aria-label="Archiver l'application"
                @click="confirmDeleteApp(app)"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { api } from '@/boot/axios'
import AppIcon from '@/components/AppIcon.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { statusColor, statusLabel } from '@/utils/appStatus'

const $q = useQuasar()
const { t } = useI18n()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const myApps = ref([])
const loading = ref(true)

async function fetchMyApps() {
  loading.value = true
  try {
    const response = await api.get('/developer/apps')
    myApps.value = response.data
  } catch (err) {
    console.error('Error fetching developer apps', err)
  } finally {
    loading.value = false
  }
}

function confirmDeleteApp(app) {
  $q.dialog({
    title: 'Archiver l’application',
    message: `Archiver "${app.name}" ? Elle sera retirée du Store ; ses builds et son historique sont conservés.`,
    cancel: { label: 'Annuler', flat: true },
    ok: { label: 'Archiver', color: 'negative' },
    persistent: true
  }).onOk(() => deleteApp(app))
}

async function deleteApp(app) {
  try {
    await api.delete(`/apps/${app.id}`)
    $q.notify({ type: 'positive', message: 'Application archivée.' })
    await fetchMyApps()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Erreur lors de la suppression'
    })
  }
}

onMounted(() => {
  fetchMyApps()
})
</script>

<style scoped lang="scss">
.console-page {
  background: var(--page);
  color: var(--text);
  padding: 18px var(--ui-page-gutter) 28px;
}
.console-hero {
  gap: 14px;
  padding: 18px;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: var(--ui-shadow-sm);
}
.console-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: var(--pwa-link);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.console-title {
  color: var(--text);
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 800;
  margin: 0;
}
.console-subtitle {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}
.app-console-card {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 17px;
  padding: 16px;
  box-shadow: var(--ui-shadow-sm);
  transition:
    transform 0.25s var(--ui-ease),
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.app-console-card:hover {
  border-color: color-mix(in srgb, var(--primary) 26%, var(--outline));
  box-shadow: var(--ui-shadow-md);
  transform: translateY(-2px);
}
.console-page :deep(.text-white) {
  color: var(--text) !important;
}
.dialog-card :deep(.text-white) {
  color: var(--pwa-text) !important;
}
.console-page :deep(.text-blue-grey-200),
.console-page :deep(.text-blue-grey-300),
.console-page :deep(.text-blue-grey-400) {
  color: var(--muted) !important;
}
.console-page :deep(.q-list--dark) {
  color: var(--text);
}
.create-btn {
  min-height: 40px;
  padding: 0 16px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 700;
  border-radius: 11px;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary) 22%, transparent);
  font-size: 12px;
}
.upload-btn {
  background: var(--surface-highest);
  color: var(--pwa-link);
  font-weight: 700;
  border-radius: 10px;
  font-size: 11px;
}
.delete-btn {
  color: var(--muted);
}
.delete-btn:hover {
  color: var(--q-negative);
}
.version-list {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.dialog-card {
  color: var(--pwa-text);
  background: var(--pwa-surface);
  border: 1px solid rgba(24, 24, 27, 0.12);
  border-radius: 18px;
}
.console-hero.q-mb-lg {
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .console-hero {
    align-items: flex-start;
    padding: 15px;
  }
  .console-hero .create-btn {
    width: 100%;
  }
  .app-console-card {
    padding: 15px;
  }
  .app-console-card > .row:first-child {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
}

.app-title-clickable:hover .app-name-hover {
  color: var(--primary) !important;
  text-decoration: underline;
}
</style>
