<template>
  <q-dialog v-model="open" persistent>
    <q-card style="width: 680px; max-width: 95vw">
      <q-form @submit="save">
        <q-card-section>
          <h2>{{ ui('Modifier le profil développeur') }}</h2>
          <p>{{ profile?.user?.email }}</p>
          <p>{{ ui('Le statut de vérification reste inchangé.') }}</p>
          <q-banner v-if="error" class="workspace-alert" role="alert">{{
            error
          }}</q-banner>
          <div class="q-gutter-md">
            <q-select
              v-model="form.type"
              outlined
              emit-value
              map-options
              :disable="busy"
              :label="ui('Type de profil')"
              :options="[
                { label: ui('Individuel'), value: 'individual' },
                { label: ui('Organisation'), value: 'organization' }
              ]"
            />
            <q-input
              v-model="form.public_name"
              outlined
              :disable="busy"
              :label="ui('Nom public')"
              maxlength="255"
            />
            <q-input
              v-model="form.legal_name"
              outlined
              :disable="busy"
              :label="ui('Identité légale')"
              maxlength="255"
            />
            <CountrySelect
              v-model="form.country_id"
              :disable="busy"
              label="Pays"
            />
            <template v-if="form.type === 'organization'">
              <q-input
                v-model="form.representative_name"
                outlined
                :disable="busy"
                :label="ui('Représentant')"
                maxlength="255"
              />
              <q-input
                v-model="form.business_email"
                outlined
                :disable="busy"
                type="email"
                :label="ui('E-mail professionnel')"
                maxlength="255"
              />
              <q-input
                v-model="form.legal_information"
                outlined
                :disable="busy"
                type="textarea"
                :label="ui('Informations légales')"
                maxlength="3000"
              />
            </template>
            <q-input
              v-model="form.website"
              outlined
              :disable="busy"
              :label="ui('Site')"
              maxlength="2048"
              placeholder="https://"
            />
            <q-input
              v-model="form.description"
              outlined
              :disable="busy"
              type="textarea"
              :label="ui('Présentation')"
              maxlength="3000"
            />
            <q-input
              v-model="form.reason"
              outlined
              :disable="busy"
              type="textarea"
              :label="ui('Motif de la modification')"
              maxlength="2000"
              :rules="[
                value =>
                  value.trim().length >= 3 ||
                  ui('Indiquez un motif de décision.')
              ]"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            no-caps
            :label="ui('Annuler')"
            :disable="busy"
            @click="open = false"
          />
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
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import CountrySelect from '@/components/CountrySelect.vue'
import { accountApi, apiMessage } from '@/services/account'
import { ui } from '@/i18n/text'

const emit = defineEmits(['saved'])
const q = useQuasar()
const open = ref(false)
const busy = ref(false)
const error = ref('')
const profile = ref(null)
const fields = [
  'type',
  'public_name',
  'legal_name',
  'country_id',
  'representative_name',
  'business_email',
  'legal_information',
  'website',
  'description'
]
const form = reactive({ reason: '' })
function edit(value) {
  profile.value = value
  for (const field of fields)
    form[field] = value[field] ?? (field === 'country_id' ? null : '')
  form.reason = ''
  error.value = ''
  open.value = true
}
async function save() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const payload = Object.fromEntries(
      fields.map(field => [field, form[field] || null])
    )
    await accountApi.updateDeveloper(profile.value.id, {
      ...payload,
      reason: form.reason.trim()
    })
    open.value = false
    emit('saved')
    q.notify({ type: 'positive', message: ui('Profil enregistré.') })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
defineExpose({ edit })
</script>
