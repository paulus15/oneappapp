<template>
  <q-card flat bordered class="workspace-card q-mb-lg">
    <h2>{{ ui('Mode maintenance') }}</h2>
    <p class="text-muted">{{
      ui(
        'Les visiteurs verront une page de maintenance. Les administrateurs conservent leur accès. La date de retour est indicative : désactivez le mode pour rouvrir le Store.'
      )
    }}</p>
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert"
      >{{ error
      }}<template #action
        ><q-btn
          v-if="!ready"
          flat
          :label="ui('Réessayer')"
          @click="load" /></template
    ></q-banner>
    <q-form v-if="ready" class="workspace-form" @submit="save">
      <q-toggle v-model="form.enabled" :label="ui('Activer la maintenance')" />
      <q-input
        v-model="form.message"
        outlined
        type="textarea"
        maxlength="500"
        counter
        :label="ui('Message aux visiteurs')"
        :disable="!form.enabled"
      />
      <q-input
        v-model="form.until"
        outlined
        type="datetime-local"
        stack-label
        :label="ui('Retour estimé (heure locale)')"
        :disable="!form.enabled"
      />
      <q-input
        v-model="reason"
        outlined
        maxlength="2000"
        :label="ui('Motif de la modification')"
        :rules="[
          v =>
            v.trim().length >= 3 ||
            ui('Indiquez un motif de 3 caractères minimum.')
        ]"
      />
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        :loading="busy"
        :label="ui('Enregistrer la maintenance')"
      />
    </q-form>
  </q-card>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { setMaintenance } from '@/stores/maintenance'
import { ui } from '@/i18n/text'
const form = reactive({ enabled: false, message: '', until: '' })
const reason = ref(''),
  error = ref(''),
  loading = ref(false),
  busy = ref(false),
  ready = ref(false)
const q = useQuasar()
function fill(state) {
  form.enabled = !!state?.enabled
  form.message = state?.message || ''
  const date = state?.until ? new Date(state.until) : null
  form.until =
    date && Number.isFinite(date.getTime())
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : ''
  setMaintenance(state)
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    fill((await api.get('/platform')).data.maintenance)
    ready.value = true
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    const until = form.enabled && form.until ? new Date(form.until) : null
    if (
      until &&
      (!Number.isFinite(until.getTime()) || until.getTime() <= Date.now())
    ) {
      error.value = ui('La date de retour doit être dans le futur.')
      return
    }
    fill(
      (
        await adminApi.maintenance({
          enabled: form.enabled,
          message: form.enabled ? form.message : null,
          until: until?.toISOString() || null,
          reason: reason.value.trim()
        })
      ).data
    )
    reason.value = ''
    q.notify({ type: 'positive', message: ui('Mode maintenance mis à jour.') })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<style scoped>
h2 {
  font-size: 20px;
  margin: 0 0 12px;
}
</style>
