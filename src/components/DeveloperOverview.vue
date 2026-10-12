<template>
  <section>
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ ui(error)
      }}<template #action
        ><q-btn flat :label="ui('Réessayer')" @click="load" /></template
    ></q-banner>
    <template v-if="summary">
      <div class="workspace-actions">
        <q-chip color="primary" text-color="white">{{
          profileLabels[summary.profile?.status] || ui('Profil à compléter')
        }}</q-chip>
        <q-btn
          no-caps
          color="primary"
          :label="ui('Mes applications')"
          to="/developer"
        />
        <q-btn
          no-caps
          outline
          :label="ui('Profil et vérification')"
          to="/developer/profile"
        />
        <q-btn
          no-caps
          outline
          :label="ui('Préparer une application')"
          to="/developer/apps/create"
          :disable="!auth.canCreateApp"
        />
      </div>
      <q-banner
        v-if="summary.profile?.decision_reason"
        class="workspace-alert"
        >{{ summary.profile.decision_reason }}</q-banner
      >
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h2>{{ summary.total_applications }} {{ ui('application(s)') }}</h2
          ><p
            ><span v-for="(total, status) in summary.by_status" :key="status"
              >{{ total }} {{ statusLabel(status).toLowerCase() }} ·
            </span></p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>{{ ui('Audience (30 jours)') }}</h2
          ><p
            >{{ summary.views_30_days }} {{ ui('vue(s) de fiche ·') }}
            {{ summary.reviews }} {{ ui('avis')
            }}<span v-if="summary.reviews">
              {{ ui('· note') }} {{ summary.average_rating }}/5</span
            ></p
          ><p v-if="summary.open_reports" class="text-negative"
            >{{ summary.open_reports }}
            {{ ui('signalement(s) en cours d’examen') }}</p
          ><div class="workspace-actions"
            ><q-btn
              flat
              no-caps
              color="primary"
              :label="ui('Statistiques')"
              to="/developer/stats" /><q-btn
              flat
              no-caps
              color="primary"
              :label="ui('Avis et retours')"
              to="/developer/reviews" /></div
        ></q-card>
        <q-card flat bordered class="workspace-card"
          ><p>{{ Number(summary.activations || 0) }} {{ ui('Activations') }}</p
          ><h2>{{ summary.total_versions }} {{ ui('version(s)') }}</h2
          ><p
            >{{ summary.installed_records }}
            {{ ui('installation(s) déclarée(s) ·')
            }}<InstallCountHelp kind="declared" />
            {{ summary.recorded_opens }}
            {{ ui('ouverture(s) enregistrée(s)') }}</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>{{ ui('Installations par pays') }}</h2
          ><p v-if="!summary.installs_by_country?.length">{{
            ui('Aucune installation enregistrée pour le moment.')
          }}</p
          ><p v-for="row in summary.installs_by_country" :key="row.code"
            >{{ row.name || ui('Pays non renseigné') }} · {{ row.total }}</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>{{ ui('Quotas de publication') }}</h2
          ><p
            >{{ summary.quotas.published_or_reserved }}
            {{ ui('emplacement(s) utilisé(s)') }}</p
          ><p>{{
            summary.quotas.free_applications === null
              ? ui('Quota gratuit non encore fixé.')
              : ui('Quota gratuit : {p0}', {
                  p0: summary.quotas.free_applications
                })
          }}</p
          ><p
            >{{ ui('Stockage :') }}
            {{ (summary.quotas.storage_bytes / 1048576).toFixed(1) }}
            {{ ui('Mo') }}</p
          ><q-banner
            v-if="!summary.quotas.can_publish_more"
            class="workspace-alert"
            >{{
              ui('Quota atteint pour les nouvelles publications.')
            }}</q-banner
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>{{ ui('Activité récente') }}</h2
          ><p v-if="!summary.recent_applications.length">{{
            ui('Aucune application préparée pour le moment.')
          }}</p
          ><q-list
            ><q-item
              v-for="app in summary.recent_applications"
              :key="app.id"
              clickable
              :to="`/developer/apps/${app.id}/publication`"
              ><q-item-section
                ><q-item-label>{{ app.name }}</q-item-label
                ><q-item-label caption
                  >{{ statusLabel(app.status) }} ·
                  {{
                    new Date(app.updated_at).toLocaleDateString(currentLocale())
                  }}</q-item-label
                ></q-item-section
              ><q-item-section side
                ><q-icon
                  name="chevron_right" /></q-item-section></q-item></q-list
        ></q-card>
      </div>
    </template>
  </section>
</template>
<script setup>
import InstallCountHelp from '@/components/InstallCountHelp.vue'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
import { onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { statusLabel } from '@/utils/appStatus'
const loading = ref(true),
  error = ref(''),
  summary = ref(null)
const profileLabels = {
  get draft() {
    return ui('Profil à compléter')
  },
  get pending_verification() {
    return ui('Vérification en attente')
  },
  get verified() {
    return ui('Développeur vérifié')
  },
  get rejected() {
    return ui('Profil à corriger')
  },
  get suspended() {
    return ui('Publication suspendue')
  }
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    summary.value = (await api.get('/developer/dashboard')).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
