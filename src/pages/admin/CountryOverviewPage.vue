<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Administration</span><h1>Répartition par pays</h1
      ><p
        >Pays de résidence déclarés par les utilisateurs et pays légaux des
        profils développeurs. Ces données ne représentent pas leur position
        actuelle.</p
      ><q-btn flat no-caps to="/admin" label="Retour à l’administration"
    /></header>
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template
    ></q-banner>
    <template v-if="summary"
      ><p
        >{{ summary.total_users }} compte(s) · {{ summary.unknown_users }} pays
        non renseigné(s) · {{ summary.unknown_installations }} installation(s)
        sans pays</p
      ><q-table
        flat
        bordered
        :rows="summary.countries"
        :columns="columns"
        row-key="id"
        :grid="$q.screen.lt.sm"
        :pagination="{ rowsPerPage: 15 }"
        no-data-label="Aucun pays renseigné pour le moment"
    /></template>
  </q-page>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
const summary = ref(null),
  loading = ref(true),
  error = ref('')
const columns = [
  { name: 'name', label: 'Pays', field: 'name', align: 'left', sortable: true },
  {
    name: 'users',
    label: 'Utilisateurs',
    field: 'users_count',
    sortable: true
  },
  {
    name: 'developers',
    label: 'Profils développeurs',
    field: 'developer_profiles_count',
    sortable: true
  },
  {
    name: 'installations',
    label: 'Installations',
    field: 'installations_count',
    sortable: true
  },
  {
    name: 'applications',
    label: 'Apps disponibles',
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
