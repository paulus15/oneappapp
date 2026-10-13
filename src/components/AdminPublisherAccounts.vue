<template>
  <div class="workspace-card q-mt-md">
    <h2>{{ ui('Comptes liés') }}</h2>
    <p class="text-muted">{{
      ui(
        'Liez des comptes simples ou développeurs à cette entité. Leurs rôles et leurs droits restent inchangés.'
      )
    }}</p>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      error
    }}</q-banner>
    <q-select
      v-model="account"
      :options="options"
      :option-label="accountLabel"
      :disable="saving"
      use-input
      clearable
      outlined
      input-debounce="300"
      :label="ui('Rechercher un compte par nom ou e-mail')"
      @filter="findAccounts"
    >
      <template #no-option>
        <q-item
          ><q-item-section>{{
            ui('Aucun compte trouvé.')
          }}</q-item-section></q-item
        >
      </template>
    </q-select>
    <q-btn
      class="q-mt-sm"
      color="primary"
      no-caps
      :disable="!account"
      :loading="saving"
      :label="ui('Lier le compte')"
      @click="link(account.id)"
    />
    <q-linear-progress v-if="loading" indeterminate class="q-mt-sm" />
    <q-list separator>
      <q-item v-for="member in accounts" :key="member.id">
        <q-item-section>
          <q-item-label>{{ member.name }}</q-item-label>
          <q-item-label caption
            >{{ member.email }} · {{ roleLabel(member.role) }}</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            no-caps
            :disable="saving"
            :label="ui('Détacher')"
            @click="unlink(member.id)"
          />
        </q-item-section>
      </q-item>
    </q-list>
    <p v-if="!loading && !accounts.length" class="text-muted">{{
      ui('Aucun compte lié.')
    }}</p>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      :disable="saving"
      @update:model-value="load"
    />
  </div>
</template>
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { ui } from '@/i18n/text'

const props = defineProps({ publisherId: { type: Number, required: true } })
const $q = useQuasar()
const accounts = ref([]),
  options = ref([]),
  account = ref(null)
const page = ref(1),
  lastPage = ref(1)
const loading = ref(false),
  saving = ref(false),
  error = ref('')
let active = true,
  listRequest = 0,
  searchRequest = 0
const roleLabel = role =>
  role === 'developer'
    ? ui('Développeur')
    : role === 'admin'
      ? ui('Administrateur')
      : ui('Compte simple')
const accountLabel = value =>
  `${value.name} — ${value.email} · ${roleLabel(value.role)}`

async function load() {
  const request = ++listRequest
  loading.value = true
  try {
    const { data } = await adminApi.publisherAccounts(props.publisherId, {
      linked: 1,
      page: page.value
    })
    if (!active || request !== listRequest) return
    accounts.value = data.data
    lastPage.value = data.last_page
    if (page.value > data.last_page) {
      page.value = data.last_page
      await load()
    }
  } catch (e) {
    if (active && request === listRequest) error.value = apiMessage(e)
  } finally {
    if (active && request === listRequest) loading.value = false
  }
}
async function findAccounts(value, update, abort) {
  const request = ++searchRequest
  try {
    const { data } = await adminApi.publisherAccounts(props.publisherId, {
      linked: 0,
      search: value || undefined
    })
    if (!active || request !== searchRequest) return abort()
    update(() => {
      options.value = data.data
    })
  } catch (e) {
    if (active && request === searchRequest) error.value = apiMessage(e)
    abort()
  }
}
async function change(id, attach) {
  if (saving.value) return
  saving.value = true
  error.value = ''
  ++searchRequest
  try {
    if (attach) await adminApi.linkPublisherAccount(props.publisherId, id)
    else await adminApi.unlinkPublisherAccount(props.publisherId, id)
    if (!active) return
    account.value = null
    options.value = []
    page.value = 1
    await load()
    if (active)
      $q.notify({ type: 'positive', message: ui('Rattachement mis à jour.') })
  } catch (e) {
    if (active) error.value = apiMessage(e)
  } finally {
    if (active) saving.value = false
  }
}
const link = id => change(id, true)
const unlink = id => change(id, false)
onMounted(load)
onBeforeUnmount(() => {
  active = false
})
</script>
<style scoped>
h2 {
  font-size: 20px;
  margin: 0 0 18px;
}
</style>
