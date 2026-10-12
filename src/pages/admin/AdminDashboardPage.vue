<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Tableau de bord') }}</h1
      ><p>{{
        ui(
          'Compteurs réels issus de la base. Rien n’est estimé : une donnée non mesurée n’apparaît pas.'
        )
      }}</p></header
    >
    <AdminNav />
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ ui(error)
      }}<template #action
        ><q-btn flat :label="ui('Réessayer')" @click="load" /></template
    ></q-banner>
    <template v-if="stats">
      <h2 class="section-title">{{ ui('À traiter') }}</h2>
      <div class="workspace-grid">
        <router-link
          v-for="queue in queues"
          :key="queue.label"
          :to="queue.to"
          class="queue-card workspace-card"
          ><strong v-count-up="queue.value"></strong
          ><span>{{ queue.label }}</span></router-link
        >
      </div>
      <h2 class="section-title">{{ ui('Vue d’ensemble') }}</h2>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Comptes') }}</h3
          ><p v-for="(total, status) in stats.users" :key="status"
            >{{ userLabels[status] || status }} : {{ total }}</p
          ><p class="text-muted"
            >{{ stats.users_last_30_days }}
            {{ ui('inscription(s) sur 30 jours') }}</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Profils développeurs') }}</h3
          ><p v-if="!Object.keys(stats.developer_profiles).length">{{
            ui('Aucun profil.')
          }}</p
          ><p v-for="(total, status) in stats.developer_profiles" :key="status"
            >{{ profileLabels[status] || status }} : {{ total }}</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Applications') }}</h3
          ><p v-for="(total, status) in stats.applications" :key="status"
            >{{ statusLabel(status) }} : {{ total }}</p
          ><p class="text-muted"
            >{{ stats.publicly_visible }}
            {{ ui('visible(s) publiquement (éditeur vérifié)') }}</p
          ></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Avis') }}</h3
          ><p>{{ stats.reviews }} {{ ui('avis publiés') }}</p></q-card
        >
      </div>
    </template>
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, onMounted, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { statusLabel } from '@/utils/appStatus'

const stats = ref(null),
  loading = ref(true),
  error = ref('')
const userLabels = {
  get active() {
    return ui('Actifs')
  },
  get suspended() {
    return ui('Suspendus')
  },
  get deactivated() {
    return ui('Désactivés')
  }
}
const profileLabels = {
  get draft() {
    return ui('Brouillons')
  },
  get pending_verification() {
    return ui('En attente de vérification')
  },
  get verified() {
    return ui('Vérifiés')
  },
  get rejected() {
    return ui('À corriger')
  },
  get suspended() {
    return ui('Suspendus')
  }
}
const queues = computed(() => [
  {
    get label() {
      return ui('profil(s) développeur à vérifier')
    },
    value: stats.value.queues.developers_pending,
    to: '/admin/developers'
  },
  {
    get label() {
      return ui('demande(s) de publication à examiner')
    },
    value: stats.value.queues.applications_to_review,
    to: '/admin/requests'
  },
  {
    get label() {
      return ui('signalement(s) à traiter')
    },
    value: stats.value.queues.reports_open,
    to: '/admin/reports'
  },
  {
    get label() {
      return ui('version(s) analysée(s) en attente de revue')
    },
    value: stats.value.queues.versions_to_review,
    to: '/admin/requests'
  }
])
async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = (await adminApi.stats()).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.section-title {
  font-size: 18px;
  font-weight: 750;
  margin: 20px 0 12px;
}
.queue-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text);
  text-decoration: none;
  transition: border-color 0.2s ease;
}
.queue-card:hover,
.queue-card:focus-visible {
  border-color: var(--pwa-primary);
}
.queue-card strong {
  font-size: 32px;
  line-height: 1;
}
.queue-card span {
  color: var(--muted);
}
h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}
</style>
