<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Un compte, deux usages') }}</span
      ><h1>{{ ui('Votre espace développeur') }}</h1
      ><p>{{
        ui(
          'Complétez votre profil et faites-le valider avant de créer une application.'
        )
      }}</p></header
    >
    <q-linear-progress
      v-if="loading"
      indeterminate
      :aria-label="ui('Chargement du profil')"
    />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ ui(error)
      }}<template #action
        ><q-btn flat :label="ui('Réessayer')" @click="load" /></template
    ></q-banner>
    <template v-if="loaded && !loading">
      <q-card
        v-if="!profile"
        flat
        bordered
        class="workspace-card activation-card"
      >
        <h2>{{ ui('Devenez développeur sur PWA Store') }}</h2
        ><p>{{
          ui(
            'L’activation est gratuite. Votre compte et vos favoris restent les mêmes.'
          )
        }}</p>
        <q-option-group
          v-model="type"
          :options="[
            { label: ui('Développeur individuel'), value: 'individual' },
            { label: ui('Organisation'), value: 'organization' }
          ]"
          color="primary"
        />
        <q-btn
          no-caps
          color="primary"
          :label="ui('Activer mon espace développeur')"
          :loading="busy"
          @click="activate"
        />
      </q-card>
      <template v-else>
        <div class="workspace-actions"
          ><q-chip
            :color="statusColor"
            text-color="white"
            :label="statusLabel" /><q-btn
            flat
            no-caps
            to="/developer"
            :label="ui('Mes applications')" /><q-btn
            flat
            no-caps
            to="/account"
            :label="ui('Mon compte utilisateur')"
        /></div>
        <q-banner v-if="profile.validation" class="workspace-alert">
          {{ ui('Dernière validation par') }}
          {{
            profile.validation.administrator_name ||
            ui('Administrateur supprimé')
          }}
          {{ ui('(n°') }}
          {{ profile.validation.administrator_id || 'indisponible'
          }}{{ ui('), le') }}
          {{
            new Date(profile.validation.validated_at).toLocaleString(
              currentLocale()
            )
          }}.
        </q-banner>
        <q-banner v-if="profile.missing_fields?.length" class="workspace-alert">
          {{ ui('À compléter avant validation :') }}
          {{
            profile.missing_fields
              .map(field => fieldLabels[field] || field)
              .join(', ')
          }}.
        </q-banner>
        <q-banner v-if="profile.decision_reason" class="workspace-alert">{{
          profile.decision_reason
        }}</q-banner>
        <q-banner v-if="!auth.user?.email_verified_at" class="workspace-alert"
          >{{ ui('Votre e-mail doit être vérifié avant la soumission.')
          }}<template #action
            ><q-btn
              flat
              no-caps
              to="/account"
              :label="ui('Vérifier mon e-mail')" /></template
        ></q-banner>
        <q-banner
          v-if="profile.status === 'suspended'"
          class="workspace-alert"
          >{{
            ui(
              'La publication est suspendue. Votre compte utilisateur reste disponible.'
            )
          }}</q-banner
        >
        <q-banner
          v-if="profile.status === 'pending_verification'"
          class="workspace-alert"
          >{{
            ui(
              'Votre profil est en cours de vérification. La création d’applications sera disponible après validation.'
            )
          }}</q-banner
        >
        <DeveloperDocuments
          :key="profile.events?.length"
          :profile-id="profile.id"
        />
        <div class="workspace-grid">
          <q-card flat bordered class="workspace-card">
            <h2>{{
              profile.type === 'organization'
                ? ui('Votre organisation')
                : ui('Votre profil individuel')
            }}</h2>
            <q-form class="workspace-form" @submit="save">
              <q-select
                v-model="form.type"
                :options="[
                  { label: ui('Individuel'), value: 'individual' },
                  { label: ui('Organisation'), value: 'organization' }
                ]"
                emit-value
                map-options
                outlined
                :label="ui('Type de profil')"
                :disable="!editable"
              />
              <q-input
                v-model="form.public_name"
                outlined
                :label="ui('Nom public')"
                maxlength="255"
                :readonly="!editable"
              />
              <q-input
                v-model="form.legal_name"
                outlined
                :label="
                  form.type === 'organization'
                    ? ui('Raison sociale')
                    : ui('Nom légal complet')
                "
                maxlength="255"
                :readonly="!editable"
              />
              <CountrySelect
                v-model="form.country_id"
                :label="
                  form.type === 'organization'
                    ? ui('Pays d’enregistrement')
                    : ui('Pays de résidence du développeur')
                "
                :disable="!editable"
              />
              <template v-if="form.type === 'organization'"
                ><q-input
                  v-model="form.representative_name"
                  outlined
                  :label="ui('Nom du représentant')"
                  :readonly="!editable" /><q-input
                  v-model="form.business_email"
                  outlined
                  type="email"
                  :label="ui('E-mail professionnel')"
                  :readonly="!editable" /><q-input
                  v-model="form.legal_information"
                  outlined
                  type="textarea"
                  :label="ui('Informations légales (facultatif)')"
                  maxlength="3000"
                  :readonly="!editable"
              /></template>
              <q-input
                v-model="form.website"
                outlined
                :label="ui('Site ou portfolio HTTPS (facultatif)')"
                :readonly="!editable"
              />
              <q-input
                v-model="form.description"
                outlined
                type="textarea"
                :label="ui('Présentation')"
                maxlength="3000"
                :readonly="!editable"
              />
              <p class="text-muted">{{
                ui(
                  'Les informations légales et la pièce d’identité sont réservées à la vérification.'
                )
              }}</p>
              <div v-if="editable" class="workspace-actions"
                ><q-btn
                  type="submit"
                  no-caps
                  color="primary"
                  :label="ui('Enregistrer le brouillon')"
                  :loading="busy" /><q-btn
                  outline
                  no-caps
                  color="primary"
                  :label="ui('Soumettre à vérification')"
                  :disable="
                    !auth.user?.email_verified_at || !identityValid || busy
                  "
                  @click="submit"
              /></div>
            </q-form>
          </q-card>
          <div>
            <q-card flat bordered class="workspace-card q-mb-md"
              ><h2>{{ ui('Pièce d’identité') }}</h2
              ><p v-if="profile.identity_document_type"
                >{{ identityLabels[profile.identity_document_type] }}
                {{ ui('· expire le') }}
                {{
                  new Date(
                    profile.identity_document_expires_at
                  ).toLocaleDateString(currentLocale())
                }}</p
              ><q-banner
                v-if="profile.identity_document_type && !identityValid"
                class="workspace-alert"
                >{{
                  ui(
                    'Cette pièce a expiré. Déposez-en une nouvelle pour publier à nouveau.'
                  )
                }}</q-banner
              ><p v-if="!profile.identity_document_type" class="text-muted">{{
                ui(
                  'Obligatoire pour soumettre votre profil et publier. Pour une organisation, déposez la pièce du représentant.'
                )
              }}</p
              ><q-form
                v-if="identityEditable"
                class="workspace-form"
                @submit="uploadIdentity"
                ><q-select
                  v-model="identity.type"
                  :options="identityOptions"
                  emit-value
                  map-options
                  outlined
                  :label="ui('Type de pièce')"
                  :rules="[
                    v => !!v || ui('Choisissez un type de pièce')
                  ]" /><q-input
                  v-model="identity.expires_at"
                  type="date"
                  outlined
                  stack-label
                  :label="ui('Date d’expiration')"
                  :min="tomorrow"
                  :rules="[
                    v =>
                      (!!v && v >= tomorrow) || ui('La pièce doit être valide')
                  ]" /><q-file
                  v-model="identity.file"
                  outlined
                  accept=".pdf,.jpg,.jpeg,.png"
                  max-file-size="5242880"
                  :label="ui('Fichier (PDF, JPEG ou PNG, 5 Mo maximum)')"
                  :rules="[v => !!v || ui('Ajoutez le fichier')]" /><q-btn
                  type="submit"
                  no-caps
                  color="primary"
                  :label="ui('Déposer la pièce d’identité')"
                  :loading="busy"
              /></q-form>
            </q-card>
            <q-card flat bordered class="workspace-card"
              ><h2>{{ ui('Votre publication') }}</h2
              ><p v-if="auth.canSubmit">{{
                ui(
                  'Votre profil est vérifié. Chaque application et chaque version restent soumises à une revue indépendante.'
                )
              }}</p
              ><template v-else
                ><p class="text-muted">{{
                  ui(
                    'La création et la publication d’applications sont bloquées tant que :'
                  )
                }}</p
                ><ul
                  ><li
                    v-for="reason in auth.user?.publication_blockers || []"
                    :key="reason"
                    >{{ reason }}</li
                  ></ul
                ></template
              ><q-btn
                no-caps
                color="primary"
                :label="ui('Préparer une application')"
                to="/developer/apps/create"
                :disable="!auth.canCreateApp"
            /></q-card>
            <q-card v-if="quotas" flat bordered class="workspace-card q-mt-md"
              ><h2>{{ ui('Quotas de publication') }}</h2
              ><p
                >{{ quotas.published_or_reserved }}
                {{ ui('application(s) publiée(s) ou en revue.') }}</p
              ><p>{{
                quotas.free_applications === null
                  ? ui('Le quota gratuit n’est pas encore fixé.')
                  : ui('Quota gratuit : {p0}', { p0: quotas.free_applications })
              }}</p
              ><p
                >{{ ui('Stockage :') }}
                {{ (quotas.storage_bytes / 1024 / 1024).toFixed(1) }}
                {{ ui('Mo') }}</p
              ><p
                >{{ ui('Build :') }}
                {{ Math.floor(quotas.build_max_kb / 1024) }}
                {{ ui('Mo maximum') }}</p
              ><q-banner
                v-if="!quotas.can_publish_more"
                class="workspace-alert"
                >{{
                  ui(
                    'Quota atteint : vos applications existantes restent conservées.'
                  )
                }}</q-banner
              ><p class="text-muted">{{
                ui('Aucun paiement n’est activé.')
              }}</p></q-card
            >
            <q-card flat bordered class="workspace-card q-mt-md"
              ><h2>{{ ui('Historique') }}</h2
              ><q-list separator
                ><q-item v-for="event in profile.events" :key="event.id"
                  ><q-item-section
                    ><q-item-label>{{
                      labels[event.to_status] || event.to_status
                    }}</q-item-label
                    ><q-item-label caption
                      >{{ event.reason || ui('Changement de statut') }} ·
                      {{
                        new Date(event.created_at).toLocaleDateString(
                          currentLocale()
                        )
                      }}</q-item-label
                    ></q-item-section
                  ></q-item
                ></q-list
              ></q-card
            >
          </div>
        </div>
      </template>
    </template>
  </q-page>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import CountrySelect from '@/components/CountrySelect.vue'
import DeveloperDocuments from '@/components/DeveloperDocuments.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { accountApi, apiMessage } from '@/services/account'
import {
  identityIsValid,
  identityLabels,
  identityOptions
} from '@/utils/identity'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore(),
  q = useQuasar()
const profile = ref(null),
  quotas = ref(null),
  loading = ref(true),
  loaded = ref(false),
  busy = ref(false),
  error = ref(''),
  type = ref('individual')
const fieldLabels = {
  get type() {
    return ui('type de profil')
  },
  get public_name() {
    return ui('nom public')
  },
  get legal_name() {
    return ui('nom légal')
  },
  get country_id() {
    return ui('Pays')
  },
  get representative_name() {
    return ui('représentant')
  },
  get business_email() {
    return ui('e-mail professionnel')
  }
}
const fields = [
  'type',
  'public_name',
  'legal_name',
  'country_id',
  'representative_name',
  'business_email',
  'website',
  'description',
  'legal_information'
]
const form = reactive(Object.fromEntries(fields.map(k => [k, ''])))
const labels = {
  get draft() {
    return ui('Profil à compléter')
  },
  get pending_verification() {
    return ui('Vérification en attente')
  },
  get verified() {
    return ui('Profil vérifié')
  },
  get rejected() {
    return ui('Corrections demandées')
  },
  get suspended() {
    return ui('Publication suspendue')
  }
}
const statusLabel = computed(
  () => labels[profile.value?.status] || ui('Brouillon')
)
const statusColor = computed(
  () =>
    ({
      verified: 'positive',
      rejected: 'negative',
      suspended: 'negative',
      pending_verification: 'warning'
    })[profile.value?.status] || 'primary'
)
const editable = computed(() =>
  ['draft', 'rejected'].includes(profile.value?.status)
)
const identityValid = computed(() => identityIsValid(profile.value))
// A verified profile may only renew a lapsed document; that sends it back to review.
const identityEditable = computed(
  () =>
    editable.value ||
    (profile.value?.status === 'verified' && !identityValid.value)
)
const tomorrow = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})()
const identity = reactive({ type: null, expires_at: '', file: null })
function accept(p) {
  profile.value = p
  for (const key of fields) form[key] = p?.[key] ?? ''
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    await auth.fetchUser()
    const { data } = await accountApi.profile()
    accept(data.profile)
    quotas.value = (await accountApi.quotas()).data
    loaded.value = true
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function activate() {
  busy.value = true
  error.value = ''
  try {
    const { data } = await accountApi.activate(type.value)
    accept(data.profile)
    auth.setUser(data.user)
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function persist() {
  const payload = Object.fromEntries(fields.map(k => [k, form[k] || null]))
  const { data } = await accountApi.saveProfile(payload)
  accept(data.profile)
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    await persist()
    q.notify({
      type: 'positive',
      get message() {
        return ui('Profil enregistré.')
      }
    })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function submit() {
  busy.value = true
  error.value = ''
  try {
    await persist()
    accept((await accountApi.submitProfile()).data.profile)
    await auth.fetchUser()
    q.notify({
      type: 'positive',
      get message() {
        return ui('Votre profil a été soumis à vérification.')
      }
    })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function uploadIdentity() {
  busy.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('type', identity.type)
    form.append('expires_at', identity.expires_at)
    form.append('file', identity.file)
    const { data } = await accountApi.uploadIdentity(form)
    accept(data.profile)
    auth.setUser(data.user)
    Object.assign(identity, { type: null, expires_at: '', file: null })
    q.notify({
      type: 'positive',
      get message() {
        return ui('Pièce d’identité déposée.')
      }
    })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
