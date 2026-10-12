<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Répartition par pays') }}</h1
      ><p>{{
        ui(
          'Pays de résidence déclarés par les utilisateurs et pays légaux des profils développeurs. Ces données ne représentent pas leur position actuelle.'
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
    <template v-if="summary"
      ><p
        >{{ summary.total_users }} {{ ui('compte(s) ·') }}
        {{ summary.unknown_users }} {{ ui('pays non renseigné(s) ·') }}
        {{ summary.unknown_installations }}
        {{ ui('installation(s) sans pays') }}</p
      ><q-table
        flat
        bordered
        :rows="summary.countries"
        :columns="columns"
        row-key="id"
        :grid="$q.screen.lt.sm"
        :pagination="{ rowsPerPage: 15 }"
        :no-data-label="ui('Aucun pays renseigné pour le moment')"
    /></template>
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import AdminNav from '@/components/AdminNav.vue'
import { onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
const summary = ref(null),
  loading = ref(true),
  error = ref('')
const columns = [
  {
    name: 'name',
    get label() {
      return ui('Pays')
    },
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'users',
    get label() {
      return ui('Utilisateurs')
    },
    field: 'users_count',
    sortable: true
  },
  {
    name: 'developers',
    get label() {
      return ui('Profils développeurs')
    },
    field: 'developer_profiles_count',
    sortable: true
  },
  {
    name: 'installations',
    get label() {
      return ui('Installations')
    },
    field: 'installations_count',
    sortable: true
  },
  {
    name: 'applications',
    get label() {
      return ui('Apps disponibles')
    },
    field: 'applications_count',
    sortable: true
  }
]
async function load() {
  loading.value = true
  error.value = ''
  try {
    summary.value = (await api.get('/admin/countries/summary')).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
