<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Administration</span><h1>Journal d’audit</h1
      ><p
        >Actions sensibles effectuées par les administrateurs et par les
        contrôles automatiques, avec leur motif.</p
      ></header
    >
    <AdminNav />
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="filters.action"
          :options="actionOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          label="Domaine"
          @update:model-value="reload"
        />
      </div>
      <div class="col-6 col-md-3">
        <q-input
          v-model="filters.from"
          type="date"
          outlined
          dense
          stack-label
          label="Du"
          @update:model-value="reload"
        />
      </div>
      <div class="col-6 col-md-3">
        <q-input
          v-model="filters.to"
          type="date"
          outlined
          dense
          stack-label
          label="Au"
          @update:model-value="reload"
        />
      </div>
    </div>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      error
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <q-list bordered separator class="rounded-borders">
      <q-item v-for="log in logs" :key="log.id">
        <q-item-section>
          <q-item-label
            ><strong>{{ log.action }}</strong>
            <span v-if="log.target_type" class="text-muted">
              · {{ targetLabel(log) }}</span
            ></q-item-label
          >
          <q-item-label caption
            >{{ new Date(log.created_at).toLocaleString('fr-FR') }} ·
            {{ log.actor?.name || 'Système' }}
            <span v-if="log.ip">· {{ log.ip }}</span></q-item-label
          >
          <q-item-label v-if="log.reason">{{ log.reason }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="!loading && !logs.length"
        ><q-item-section
          >Aucune entrée pour ces critères.</q-item-section
        ></q-item
      >
    </q-list>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      class="q-mt-md"
      @update:model-value="load"
    />
  </q-page>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

const logs = ref([]),
  loading = ref(true),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1)
const filters = reactive({ action: null, from: '', to: '' })
const actionOptions = [
  { value: 'application.', label: 'Applications' },
  { value: 'version.', label: 'Versions' },
  { value: 'developer.', label: 'Développeurs' },
  { value: 'user.', label: 'Utilisateurs' },
  { value: 'category.', label: 'Catégories' }
]
const targets = {
  'App\\Models\\Application': 'application',
  'App\\Models\\AppVersion': 'version',
  'App\\Models\\DeveloperProfile': 'profil développeur',
  'App\\Models\\User': 'compte',
  'App\\Models\\Category': 'catégorie'
}
const targetLabel = log =>
  `${targets[log.target_type] || log.target_type} #${log.target_id}`

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await adminApi.auditLogs({
      page: page.value,
      action: filters.action || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined
    })
    logs.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
function reload() {
  page.value = 1
  return load()
}
onMounted(load)
</script>
