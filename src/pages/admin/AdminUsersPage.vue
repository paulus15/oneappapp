<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Utilisateurs') }}</h1
      ><p>{{
        ui(
          'Recherche, consultation et suspension motivée. Chaque action est inscrite au journal d’audit.'
        )
      }}</p></header
    >
    <AdminNav />
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-5">
        <q-input
          v-model="filters.search"
          outlined
          dense
          clearable
          debounce="400"
          :label="ui('Nom ou e-mail')"
          @update:model-value="reload"
          ><template #prepend><q-icon name="search" /></template
        ></q-input>
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          :label="ui('Statut')"
          @update:model-value="reload"
        />
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="filters.role"
          :options="roleOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          :label="ui('Type de compte')"
          @update:model-value="reload"
        />
      </div>
    </div>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-table
      flat
      bordered
      :rows="users"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :grid="$q.screen.lt.sm"
      v-model:pagination="pagination"
      :rows-per-page-options="[25]"
      :no-data-label="ui('Aucun compte pour ces critères')"
      @request="onRequest"
      @row-click="(_, row) => open(row)"
    >
      <template #body-cell-status="props">
        <q-td :props="props"
          ><q-badge :color="statusColors[props.value]">{{
            statusLabels[props.value]
          }}</q-badge></q-td
        >
      </template>
    </q-table>

    <q-dialog v-model="dialog" :maximized="$q.screen.lt.sm">
      <q-card v-if="detail" class="detail-card">
        <q-card-section class="row items-start">
          <div class="col">
            <h2>{{ detail.user.name }}</h2>
            <p class="text-muted">{{ detail.user.email }}</p>
          </div>
          <q-btn
            flat
            round
            icon="close"
            :aria-label="ui('Fermer')"
            v-close-popup
          />
        </q-card-section>
        <q-card-section>
          <dl>
            <dt>{{ ui('Statut') }}</dt>
            <dd
              >{{ statusLabels[detail.user.status]
              }}<span v-if="detail.user.status_reason">
                — {{ detail.user.status_reason }}</span
              ></dd
            >
            <dt>{{ ui('Pays') }}</dt>
            <dd>{{ detail.user.country?.name || ui('Non renseigné') }}</dd>
            <dt>{{ ui('E-mail vérifié') }}</dt>
            <dd>{{ detail.user.email_verified_at ? ui('Oui') : ui('Non') }}</dd>
            <dt>{{ ui('Profil développeur') }}</dt>
            <dd>{{
              detail.user.developer_profile?.status
                ? profileLabels[detail.user.developer_profile.status]
                : ui('Aucun')
            }}</dd>
            <dt>{{ ui('Applications') }}</dt>
            <dd>{{ detail.applications.length }}</dd>
            <dt>{{ ui('Avis publiés') }}</dt>
            <dd>{{ detail.reviews_count }}</dd>
            <dt>{{ ui('Inscription') }}</dt>
            <dd>{{ date(detail.user.created_at) }}</dd>
          </dl>
          <div class="workspace-actions">
            <q-btn
              v-if="detail.user.status === 'active'"
              outline
              no-caps
              color="negative"
              :label="ui('Suspendre')"
              :disable="busy || detail.user.id === auth.user?.id"
              @click="setStatus('suspended')"
            />
            <q-btn
              v-else-if="!detail.user.anonymized_at"
              outline
              no-caps
              color="positive"
              :label="
                detail.user.status === 'deactivated'
                  ? ui('Réactiver le compte')
                  : ui('Lever la suspension')
              "
              :disable="busy"
              @click="setStatus('active')"
            />
          </div>
        </q-card-section>
        <q-card-section v-if="canEditPermissions">
          <h3>{{ ui('Accès administrateur') }}</h3>
          <q-toggle
            v-model="permissionForm.admin"
            :label="ui('Administrateur')"
          />
          <q-option-group
            v-if="permissionForm.admin"
            v-model="permissionForm.permissions"
            type="checkbox"
            :options="permissionOptions"
          />
          <q-btn
            no-caps
            outline
            color="primary"
            :label="ui('Enregistrer les accès')"
            :disable="busy || detail.user.id === auth.user?.id"
            @click="savePermissions"
          />
        </q-card-section>
        <q-card-section>
          <h3>{{ ui('Historique administratif') }}</h3>
          <p v-if="!detail.history.length" class="text-muted">{{
            ui('Aucune action enregistrée.')
          }}</p>
          <q-list dense separator>
            <q-item v-for="log in detail.history" :key="log.id">
              <q-item-section>
                <q-item-label>{{ log.action }}</q-item-label>
                <q-item-label caption
                  >{{ date(log.created_at) }} · {{ log.actor?.name }}
                  <span v-if="log.reason"
                    >— {{ log.reason }}</span
                  ></q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi, PERMISSION_LABELS } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'

const $q = useQuasar(),
  auth = useAuthStore()
const users = ref([]),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  dialog = ref(false),
  detail = ref(null)
const filters = reactive({ search: '', status: null, role: null })
const pagination = ref({ page: 1, rowsPerPage: 25, rowsNumber: 0 })
const permissionForm = reactive({ admin: false, permissions: [] })
const statusLabels = {
  get active() {
    return ui('Actif')
  },
  get suspended() {
    return ui('Suspendu')
  },
  get deactivated() {
    return ui('Désactivé')
  }
}
const statusColors = {
  active: 'positive',
  suspended: 'negative',
  deactivated: 'grey-7'
}
const profileLabels = {
  get draft() {
    return ui('Brouillon')
  },
  get pending_verification() {
    return ui('En attente de vérification')
  },
  get verified() {
    return ui('Vérifié')
  },
  get rejected() {
    return ui('À corriger')
  },
  get suspended() {
    return ui('Suspendu')
  }
}
const statusOptions = Object.keys(statusLabels).map(value => ({
  value,
  get label() {
    return statusLabels[value]
  }
}))
const roleOptions = [
  {
    value: 'user',
    get label() {
      return ui('Utilisateurs')
    }
  },
  {
    value: 'developer',
    get label() {
      return ui('Développeurs')
    }
  },
  {
    value: 'admin',
    get label() {
      return ui('Administrateurs')
    }
  }
]
const permissionOptions = Object.keys(PERMISSION_LABELS).map(value => ({
  value,
  get label() {
    return PERMISSION_LABELS[value]
  }
}))
const columns = [
  {
    name: 'name',
    get label() {
      return ui('Nom')
    },
    field: 'name',
    align: 'left'
  },
  { name: 'email', label: 'E-mail', field: 'email', align: 'left' },
  {
    name: 'country',
    get label() {
      return ui('Pays')
    },
    field: row => row.country?.name || '—',
    align: 'left'
  },
  {
    name: 'role',
    get label() {
      return ui('Type')
    },
    field: row =>
      row.role === 'admin'
        ? ui('Administrateur')
        : row.developer_profile
          ? ui('Développeur')
          : ui('Utilisateur'),
    align: 'left'
  },
  {
    name: 'status',
    get label() {
      return ui('Statut')
    },
    field: 'status',
    align: 'left'
  },
  {
    name: 'created_at',
    get label() {
      return ui('Inscription')
    },
    field: row => date(row.created_at),
    align: 'left'
  }
]
const canEditPermissions = computed(() =>
  auth.user?.admin_permissions?.includes('settings.manage')
)
const date = value =>
  value ? new Date(value).toLocaleDateString(currentLocale()) : ''

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await adminApi.users({
      page: pagination.value.page,
      search: filters.search || undefined,
      status: filters.status || undefined,
      role: filters.role || undefined
    })
    users.value = data.data
    pagination.value = { ...pagination.value, rowsNumber: data.total }
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
function reload() {
  pagination.value.page = 1
  return load()
}
function onRequest({ pagination: next }) {
  pagination.value.page = next.page
  return load()
}
async function open(row) {
  error.value = ''
  try {
    detail.value = (await adminApi.user(row.id)).data
    permissionForm.admin = detail.value.user.role === 'admin'
    permissionForm.permissions = [...detail.value.admin_permissions]
    dialog.value = true
  } catch (e) {
    error.value = apiMessage(e)
  }
}
function askReason(title) {
  return new Promise(resolve =>
    $q
      .dialog({
        title,
        get message() {
          return ui('Indiquez le motif. Il est conservé dans le journal.')
        },
        prompt: {
          model: '',
          type: 'textarea',
          isValid: v => v.trim().length >= 3
        },
        cancel: true,
        persistent: true
      })
      .onOk(resolve)
      .onCancel(() => resolve(null))
  )
}
async function act(action, message) {
  busy.value = true
  try {
    await action()
    $q.notify({ type: 'positive', message })
    await open(detail.value.user)
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    busy.value = false
  }
}
async function setStatus(status) {
  const reason = await askReason(
    status === 'suspended'
      ? ui('Suspendre ce compte')
      : ui('Réactiver ce compte')
  )
  if (!reason) return
  return act(
    () => adminApi.userStatus(detail.value.user.id, { status, reason }),
    ui('Statut mis à jour.')
  )
}
async function savePermissions() {
  const reason = await askReason(ui('Modifier les accès administrateur'))
  if (!reason) return
  return act(
    () =>
      adminApi.userPermissions(detail.value.user.id, {
        admin: permissionForm.admin,
        permissions: permissionForm.permissions,
        reason
      }),
    ui('Accès enregistrés.')
  )
}
onMounted(load)
</script>
<style scoped>
.detail-card {
  width: min(640px, 100vw);
  max-width: 100vw;
}
h2 {
  font-size: 20px;
  font-weight: 750;
  margin: 0;
  overflow-wrap: anywhere;
}
h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}
dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0 0 16px;
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
