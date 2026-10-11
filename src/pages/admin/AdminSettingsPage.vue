<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Administration</span><h1>Paramètres et quotas</h1
      ><p
        >Les quotas de publication et la contribution annoncée. Laisser un champ
        vide signifie « non fixé ». Aucun paiement réel n’est activé : il faudra
        une intégration et une validation explicites.</p
      ></header
    >
    <AdminNav />
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      error
    }}</q-banner>
    <q-card v-if="form" flat bordered class="workspace-card settings-card">
      <q-form class="workspace-form" @submit="save">
        <q-input
          v-model="form.free_applications"
          type="number"
          min="0"
          outlined
          clearable
          label="Applications gratuites par développeur"
          hint="Au-delà, une contribution pourra être demandée"
        />
        <q-input
          v-model="form.max_applications"
          type="number"
          min="0"
          outlined
          clearable
          label="Nombre maximal d’applications par développeur"
        />
        <q-input
          v-model="storageMb"
          type="number"
          min="0"
          outlined
          clearable
          label="Stockage par développeur (Mo)"
        />
        <div class="row q-col-gutter-sm">
          <div class="col-8">
            <q-input
              v-model="form.contribution_amount"
              type="number"
              min="0"
              outlined
              clearable
              label="Montant de la contribution annoncée"
            />
          </div>
          <div class="col-4">
            <q-input
              v-model="form.currency"
              outlined
              clearable
              maxlength="3"
              label="Devise (ISO)"
              hint="ex. XOF"
            />
          </div>
        </div>
        <q-banner class="workspace-alert"
          ><q-icon name="lock" /> Paiements désactivés</q-banner
        >
        <q-btn
          type="submit"
          color="primary"
          no-caps
          label="Enregistrer"
          :loading="busy"
        />
      </q-form>
    </q-card>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

const $q = useQuasar()
const form = ref(null),
  busy = ref(false),
  error = ref('')
const blank = v => (v === '' || v === null || v === undefined ? null : v)
const storageMb = computed({
  get: () =>
    form.value.storage_bytes == null
      ? null
      : Math.round(form.value.storage_bytes / 1048576),
  set: v => (form.value.storage_bytes = blank(v) === null ? null : v * 1048576)
})
async function load() {
  try {
    form.value = (await adminApi.settings()).data
  } catch (e) {
    error.value = apiMessage(e)
  }
}
function save() {
  $q.dialog({
    title: 'Modifier les paramètres',
    message: 'Indiquez le motif. Il est conservé dans le journal.',
    prompt: { model: '', type: 'text', isValid: v => v.trim().length >= 3 },
    cancel: true
  }).onOk(async reason => {
    busy.value = true
    error.value = ''
    try {
      const f = form.value
      form.value = (
        await adminApi.updateSettings({
          free_applications: blank(f.free_applications),
          max_applications: blank(f.max_applications),
          storage_bytes: blank(f.storage_bytes),
          contribution_amount: blank(f.contribution_amount),
          currency: blank(f.currency),
          reason
        })
      ).data
      $q.notify({ type: 'positive', message: 'Paramètres enregistrés.' })
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
.settings-card {
  max-width: 620px;
}
</style>
