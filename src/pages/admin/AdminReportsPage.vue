<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Signalements') }}</h1
      ><p>{{
        ui(
          'Signalements envoyés par les utilisateurs. Traitez le contenu (avis masqué, application suspendue) depuis l’écran concerné, puis clôturez ici avec un motif.'
        )
      }}</p></header
    >
    <AdminNav />
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-md-3">
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          emit-value
          map-options
          outlined
          dense
          :label="ui('État')"
          @update:model-value="reload"
        />
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="filters.target_type"
          :options="typeOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          :label="ui('Contenu')"
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
    <EmptyState
      v-if="!loading && !error && !list.error.value && !reports.length"
      icon="inbox"
      :title="ui('Aucun signalement pour ce filtre.')"
    />
    <div class="workspace-grid">
      <q-card
        v-for="report in reports"
        :key="report.id"
        flat
        bordered
        class="workspace-card"
      >
        <q-badge :color="report.status === 'open' ? 'negative' : 'grey-7'">{{
          statusLabels[report.status]
        }}</q-badge>
        <h2>{{ REPORT_REASONS[report.reason] }}</h2>
        <p v-if="isApp(report)"
          >{{ ui('Application :') }}
          <router-link
            v-if="report.target"
            :to="`/developer/apps/${report.target.id}/publication`"
            >{{ report.target.name }}</router-link
          ><span v-else>{{ ui('supprimée') }}</span></p
        >
        <template v-else-if="report.target">
          <p
            >{{ ui('Avis de') }} {{ report.target.user?.name }} {{ ui('sur') }}
            {{ report.target.application?.name }} ({{
              report.target.rating
            }}/5)</p
          >
          <blockquote>{{
            report.target.comment || ui('Sans commentaire')
          }}</blockquote>
        </template>
        <p v-if="report.details"
          ><em>« {{ report.details }} »</em></p
        >
        <p class="text-caption text-muted"
          >{{ ui('Par') }} {{ report.reporter?.name || ui('compte supprimé') }}
          {{ ui('le') }} {{ date(report.created_at) }}</p
        >
        <p v-if="report.resolution" class="text-caption"
          >{{ report.handler?.name }} : {{ report.resolution }}</p
        >
        <div v-if="report.status === 'open'" class="workspace-actions">
          <q-btn
            outline
            no-caps
            color="positive"
            :label="ui('Traité')"
            :disable="busy"
            @click="resolve(report, 'resolved')"
          />
          <q-btn
            flat
            no-caps
            :label="ui('Classer sans suite')"
            :disable="busy"
            @click="resolve(report, 'dismissed')"
          />
        </div>
      </q-card>
    </div>
    <LoadMore
      v-if="!loading && !list.error.value"
      auto
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="reports.length"
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
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { REPORT_REASONS } from '@/services/community'

const list = useLoadMore(async page => {
  const { data } = await adminApi.reports({
    page: page,
    status: filters.status,
    target_type: filters.target_type || undefined
  })
  return data
})

const $q = useQuasar()
const reports = list.items,
  loading = list.loading,
  busy = ref(false),
  error = ref('')
const filters = reactive({ status: 'open', target_type: null })
const statusLabels = {
  get open() {
    return ui('À traiter')
  },
  get resolved() {
    return ui('Traité')
  },
  get dismissed() {
    return ui('Sans suite')
  }
}
const statusOptions = Object.keys(statusLabels).map(value => ({
  value,
  get label() {
    return statusLabels[value]
  }
}))
const typeOptions = [
  {
    value: 'application',
    get label() {
      return ui('Applications')
    }
  },
  {
    value: 'review',
    get label() {
      return ui('Avis')
    }
  }
]
const isApp = report => report.target_type.endsWith('Application')
const date = value => new Date(value).toLocaleDateString(currentLocale())

const load = () => {
  error.value = ''
  return list.reload()
}

function reload() {
  return load()
}
function resolve(report, status) {
  $q.dialog({
    title:
      status === 'resolved'
        ? ui('Signalement traité')
        : ui('Classer sans suite'),
    get message() {
      return ui(
        'Indiquez la décision prise. Elle est visible par l’auteur du signalement.'
      )
    },
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(async resolution => {
    busy.value = true
    try {
      await adminApi.resolveReport(report.id, { status, resolution })
      await load()
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}
onMounted(load)
</script>
<style scoped>
h2 {
  font-size: 17px;
  font-weight: 750;
  margin: 8px 0;
}
blockquote {
  margin: 0 0 8px;
  padding: 8px 12px;
  border-left: 3px solid var(--outline);
  color: var(--muted);
}
</style>
