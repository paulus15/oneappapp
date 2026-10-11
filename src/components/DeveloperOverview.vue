<template>
  <section>
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template
    ></q-banner>
    <template v-if="summary">
      <div class="workspace-actions">
        <q-chip color="primary" text-color="white">{{
          profileLabels[summary.profile?.status] || 'Profil à compléter'
        }}</q-chip>
        <q-btn
          no-caps
          color="primary"
          label="Mes applications"
          to="/developer"
        />
        <q-btn
          no-caps
          outline
          label="Profil et vérification"
          to="/developer/profile"
        />
        <q-btn
          no-caps
          outline
          label="Préparer une application"
          to="/developer/apps/create"
          :disable="summary.profile?.status === 'suspended'"
        />
      </div>
      <q-banner
        v-if="summary.profile?.decision_reason"
        class="workspace-alert"
        >{{ summary.profile.decision_reason }}</q-banner
      >
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h2>{{ summary.total_applications }} application(s)</h2
          ><p
            ><span v-for="(total, status) in summary.by_status" :key="status"
              >{{ total }} {{ statusLabel(status).toLowerCase() }} ·
            </span></p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>Audience (30 jours)</h2
          ><p
            >{{ summary.views_30_days }} vue(s) de fiche ·
            {{ summary.reviews }} avis<span v-if="summary.reviews">
              · note {{ summary.average_rating }}/5</span
            ></p
          ><p v-if="summary.open_reports" class="text-negative"
            >{{ summary.open_reports }} signalement(s) en cours d’examen</p
          ><div class="workspace-actions"
            ><q-btn
              flat
              no-caps
              color="primary"
              label="Statistiques"
              to="/developer/stats" /><q-btn
              flat
              no-caps
              color="primary"
              label="Avis et retours"
              to="/developer/reviews" /></div
        ></q-card>
        <q-card flat bordered class="workspace-card"
          ><h2>{{ summary.total_versions }} version(s)</h2
          ><p
            >{{ summary.installed_records }} installation(s) déclarée(s) ·
            {{ summary.recorded_opens }} ouverture(s) enregistrée(s)</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>Installations par pays</h2
          ><p v-if="!summary.installs_by_country?.length"
            >Aucune installation enregistrée pour le moment.</p
          ><p v-for="row in summary.installs_by_country" :key="row.code"
            >{{ row.name || 'Pays non renseigné' }} · {{ row.total }}</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>Quotas de publication</h2
          ><p
            >{{ summary.quotas.published_or_reserved }} emplacement(s)
            utilisé(s)</p
          ><p>{{
            summary.quotas.free_applications === null
              ? 'Quota gratuit non encore fixé.'
              : `Quota gratuit : ${summary.quotas.free_applications}`
          }}</p
          ><p
            >Stockage :
            {{ (summary.quotas.storage_bytes / 1048576).toFixed(1) }} Mo</p
          ><q-banner
            v-if="!summary.quotas.can_publish_more"
            class="workspace-alert"
            >Quota atteint pour les nouvelles publications.</q-banner
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h2>Activité récente</h2
          ><p v-if="!summary.recent_applications.length"
            >Aucune application préparée pour le moment.</p
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
                    new Date(app.updated_at).toLocaleDateString('fr-FR')
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
import { onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { statusLabel } from '@/utils/appStatus'
const loading = ref(true),
  error = ref(''),
  summary = ref(null)
const profileLabels = {
  draft: 'Profil à compléter',
  pending_verification: 'Vérification en attente',
  verified: 'Développeur vérifié',
  rejected: 'Profil à corriger',
  suspended: 'Publication suspendue'
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
