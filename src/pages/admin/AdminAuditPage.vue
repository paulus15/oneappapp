<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Journal d’audit') }}</h1
      ><p>{{
        ui(
          'Actions sensibles effectuées par les administrateurs et par les contrôles automatiques, avec leur motif.'
        )
      }}</p></header
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
          :label="ui('Domaine')"
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
          :label="ui('Du')"
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
          :label="ui('Au')"
          @update:model-value="reload"
        />
      </div>
    </div>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <EmptyState
      v-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      :text="ui('Les données n’ont pas pu être chargées.')"
      ><q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="load"
    /></EmptyState>
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
            >{{ new Date(log.created_at).toLocaleString(currentLocale()) }} ·
            {{ log.actor?.name || ui('Système') }}
            <span v-if="log.ip">· {{ log.ip }}</span></q-item-label
          >
          <q-item-label v-if="log.reason">{{ log.reason }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="!loading && !error && !list.error.value && !logs.length"
        ><q-item-section>{{
          ui('Aucune entrée pour ces critères.')
        }}</q-item-section></q-item
      >
    </q-list>
    <LoadMore
      v-if="!loading && !list.error.value"
      auto
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="logs.length"
      :total="list.total.value"
      @load="list.loadMore"
    />
  </q-page>
</template>
<script setup>
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { onMounted, reactive, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

const list = useLoadMore(async page => {
  const { data } = await adminApi.auditLogs({
    page: page,
    action: filters.action || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined
  })
  return data
})

const logs = list.items,
  loading = list.loading,
  error = ref('')
const filters = reactive({ action: null, from: '', to: '' })
const actionOptions = [
  {
    value: 'application.',
    get label() {
      return ui('Applications')
    }
  },
  {
    value: 'version.',
    get label() {
      return ui('Versions')
    }
  },
  {
    value: 'developer.',
    get label() {
      return ui('Développeurs')
    }
  },
  {
    value: 'user.',
    get label() {
      return ui('Utilisateurs')
    }
  },
  {
    value: 'category.',
    get label() {
      return ui('Catégories')
    }
  }
]
const targets = {
  get 'App\\Models\\Application'() {
    return ui('application')
  },
  'App\\Models\\AppVersion': 'version',
  get 'App\\Models\\DeveloperProfile'() {
    return ui('profil développeur')
  },
  'App\\Models\\User': 'compte',
  get 'App\\Models\\Category'() {
    return ui('catégorie')
  }
}
const targetLabel = log =>
  `${targets[log.target_type] || log.target_type} #${log.target_id}`

const load = () => {
  error.value = ''
  return list.reload()
}

function reload() {
  return load()
}
onMounted(load)
</script>
