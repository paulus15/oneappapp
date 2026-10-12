<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Catégories') }}</h1
      ><p>{{
        ui(
          'Les catégories actives apparaissent dans le Store et dans le formulaire des développeurs. Une catégorie qui contient des applications ne peut pas être supprimée : désactivez-la.'
        )
      }}</p></header
    >
    <AdminNav />
    <div class="workspace-actions q-mb-md">
      <q-btn
        color="primary"
        no-caps
        icon="add"
        :label="ui('Nouvelle catégorie')"
        @click="edit()"
      />
    </div>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-table
      flat
      bordered
      :rows="categories"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :grid="$q.screen.lt.sm"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      :no-data-label="ui('Aucune catégorie')"
    >
      <template #body-cell-icon="props">
        <q-td :props="props"
          ><q-icon :name="props.value" :style="{ color: props.row.color }"
        /></q-td>
      </template>
      <template #body-cell-is_active="props">
        <q-td :props="props"
          ><q-toggle
            :model-value="props.value"
            :disable="busy"
            :aria-label="ui('Activer {p0}', { p0: props.row.name })"
            @update:model-value="v => toggle(props.row, v)"
        /></q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right"
          ><q-btn
            flat
            dense
            icon="edit"
            :aria-label="ui('Modifier {p0}', { p0: props.row.name })"
            @click="edit(props.row)" /><q-btn
            flat
            dense
            icon="delete"
            color="negative"
            :aria-label="ui('Supprimer {p0}', { p0: props.row.name })"
            :disable="busy || props.row.applications_count > 0"
            @click="remove(props.row)"
        /></q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card class="form-card">
        <q-form @submit="save">
          <q-card-section
            ><h2>{{
              form.id ? ui('Modifier la catégorie') : ui('Nouvelle catégorie')
            }}</h2></q-card-section
          >
          <q-card-section class="workspace-form">
            <q-input
              v-model="form.name"
              outlined
              :label="ui('Nom')"
              maxlength="255"
              :rules="[v => !!v?.trim() || ui('Nom requis')]"
            />
            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              :label="ui('Description (facultatif)')"
            />
            <q-input
              v-model="form.icon"
              outlined
              :label="ui('Icône Material (ex. school)')"
              ><template #append
                ><q-icon :name="form.icon || 'category'" /></template
            ></q-input>
            <q-input
              v-model="form.color"
              outlined
              :label="ui('Couleur (#RRGGBB)')"
            />
            <q-input
              v-model.number="form.order"
              outlined
              type="number"
              :label="ui('Ordre d’affichage')"
            />
            <q-toggle v-model="form.is_active" :label="ui('Active')" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
            <q-btn
              type="submit"
              color="primary"
              no-caps
              :label="ui('Enregistrer')"
              :loading="busy"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

const $q = useQuasar()
const categories = ref([]),
  loading = ref(true),
  busy = ref(false),
  error = ref(''),
  dialog = ref(false)
const blank = {
  id: null,
  name: '',
  description: '',
  icon: 'category',
  color: '#075BFF',
  order: 0,
  is_active: true
}
const form = reactive({ ...blank })
const columns = [
  { name: 'icon', label: '', field: 'icon', align: 'left' },
  {
    name: 'name',
    get label() {
      return ui('Nom')
    },
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'applications_count',
    get label() {
      return ui('Apps publiées')
    },
    field: 'applications_count',
    sortable: true
  },
  {
    name: 'order',
    get label() {
      return ui('Ordre')
    },
    field: 'order',
    sortable: true
  },
  {
    name: 'is_active',
    get label() {
      return ui('Active')
    },
    field: 'is_active'
  },
  { name: 'actions', label: '', field: 'id' }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    categories.value = (await adminApi.categories()).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function run(action, message) {
  busy.value = true
  error.value = ''
  try {
    await action()
    $q.notify({ type: 'positive', message })
    await load()
    return true
  } catch (e) {
    error.value = apiMessage(e)
    return false
  } finally {
    busy.value = false
  }
}
function edit(row) {
  Object.assign(form, blank, row ? { ...row } : {})
  dialog.value = true
}
async function save() {
  const payload = {
    name: form.name.trim(),
    description: form.description || null,
    icon: form.icon || null,
    color: form.color || null,
    order: Number(form.order) || 0,
    is_active: form.is_active
  }
  const ok = await run(
    () =>
      form.id
        ? adminApi.updateCategory(form.id, payload)
        : adminApi.createCategory(payload),
    ui('Catégorie enregistrée.')
  )
  if (ok) dialog.value = false
}
function toggle(row, value) {
  return run(
    () => adminApi.updateCategory(row.id, { is_active: value }),
    value ? ui('Catégorie activée.') : ui('Catégorie désactivée.')
  )
}
function remove(row) {
  $q.dialog({
    get title() {
      return ui('Supprimer « {p0} » ?', { p0: row.name })
    },
    get message() {
      return ui('Cette action est définitive.')
    },
    cancel: true,
    persistent: true
  }).onOk(() =>
    run(() => adminApi.deleteCategory(row.id), ui('Catégorie supprimée.'))
  )
}
onMounted(load)
</script>
<style scoped>
.form-card {
  width: min(520px, 100vw);
}
h2 {
  font-size: 20px;
  font-weight: 750;
  margin: 0;
}
</style>
