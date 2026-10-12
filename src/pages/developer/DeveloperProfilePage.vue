<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Un compte, deux usages</span
      ><h1>Votre espace développeur</h1
      ><p
        >Complétez votre profil et faites-le valider avant de créer une
        application.</p
      ></header
    >
    <q-linear-progress
      v-if="loading"
      indeterminate
      aria-label="Chargement du profil"
    />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template
    ></q-banner>
    <template v-if="loaded && !loading">
      <q-card
        v-if="!profile"
        flat
        bordered
        class="workspace-card activation-card"
      >
        <h2>Devenez développeur sur PWA Store</h2
        ><p
          >L’activation est gratuite. Votre compte et vos favoris restent les
          mêmes.</p
        >
        <q-option-group
          v-model="type"
          :options="[
            { label: 'Développeur individuel', value: 'individual' },
            { label: 'Organisation', value: 'organization' }
          ]"
          color="primary"
        />
        <q-btn
          no-caps
          color="primary"
          label="Activer mon espace développeur"
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
            label="Mes applications" /><q-btn
            flat
            no-caps
            to="/account"
            label="Mon compte utilisateur"
        /></div>
        <q-banner v-if="profile.validation" class="workspace-alert">
          Dernière validation par
          {{
            profile.validation.administrator_name || 'Administrateur supprimé'
          }}
          (n° {{ profile.validation.administrator_id || 'indisponible' }}), le
          {{
            new Date(profile.validation.validated_at).toLocaleString('fr-FR')
          }}.
        </q-banner>
        <q-banner v-if="profile.missing_fields?.length" class="workspace-alert">
          À compléter avant validation :
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
          >Votre e-mail doit être vérifié avant la soumission.<template #action
            ><q-btn
              flat
              no-caps
              to="/account"
              label="Vérifier mon e-mail" /></template
        ></q-banner>
        <q-banner v-if="profile.status === 'suspended'" class="workspace-alert"
          >La publication est suspendue. Votre compte utilisateur reste
          disponible.</q-banner
        >
        <q-banner
          v-if="profile.status === 'pending_verification'"
          class="workspace-alert"
          >Votre profil est en cours de vérification. La création d’applications
          sera disponible après validation.</q-banner
        >
        <DeveloperDocuments
          :key="profile.events?.length"
          :profile-id="profile.id"
        />
        <div class="workspace-grid">
          <q-card flat bordered class="workspace-card">
            <h2>{{
              profile.type === 'organization'
                ? 'Votre organisation'
                : 'Votre profil individuel'
            }}</h2>
            <q-form class="workspace-form" @submit="save">
              <q-select
                v-model="form.type"
                :options="[
                  { label: 'Individuel', value: 'individual' },
                  { label: 'Organisation', value: 'organization' }
                ]"
                emit-value
                map-options
                outlined
                label="Type de profil"
                :disable="!editable"
              />
              <q-input
                v-model="form.public_name"
                outlined
                label="Nom public"
                maxlength="255"
                :readonly="!editable"
              />
              <q-input
                v-model="form.legal_name"
                outlined
                :label="
                  form.type === 'organization'
                    ? 'Raison sociale'
                    : 'Nom légal complet'
                "
                maxlength="255"
                :readonly="!editable"
              />
              <CountrySelect
                v-model="form.country_id"
                :label="
                  form.type === 'organization'
                    ? 'Pays d’enregistrement'
                    : 'Pays de résidence du développeur'
                "
                :disable="!editable"
              />
              <template v-if="form.type === 'organization'"
                ><q-input
                  v-model="form.representative_name"
                  outlined
                  label="Nom du représentant"
                  :readonly="!editable" /><q-input
                  v-model="form.business_email"
                  outlined
                  type="email"
                  label="E-mail professionnel"
                  :readonly="!editable" /><q-input
                  v-model="form.legal_information"
                  outlined
                  type="textarea"
                  label="Informations légales (facultatif)"
                  maxlength="3000"
                  :readonly="!editable"
              /></template>
              <q-input
                v-model="form.website"
                outlined
                label="Site ou portfolio HTTPS (facultatif)"
                :readonly="!editable"
              />
              <q-input
                v-model="form.description"
                outlined
                type="textarea"
                label="Présentation"
                maxlength="3000"
                :readonly="!editable"
              />
              <p class="text-muted"
                >Les informations légales et la pièce d’identité sont réservées
                à la vérification.</p
              >
              <div v-if="editable" class="workspace-actions"
                ><q-btn
                  type="submit"
                  no-caps
                  color="primary"
                  label="Enregistrer le brouillon"
                  :loading="busy" /><q-btn
                  outline
                  no-caps
                  color="primary"
                  label="Soumettre à vérification"
                  :disable="
                    !auth.user?.email_verified_at || !identityValid || busy
                  "
                  @click="submit"
              /></div>
            </q-form>
          </q-card>
          <div>
            <q-card flat bordered class="workspace-card q-mb-md"
              ><h2>Pièce d’identité</h2
              ><p v-if="profile.identity_document_type"
                >{{ identityLabels[profile.identity_document_type] }} · expire
                le
                {{
                  new Date(
                    profile.identity_document_expires_at
                  ).toLocaleDateString('fr-FR')
                }}</p
              ><q-banner
                v-if="profile.identity_document_type && !identityValid"
                class="workspace-alert"
                >Cette pièce a expiré. Déposez-en une nouvelle pour publier à
                nouveau.</q-banner
              ><p v-if="!profile.identity_document_type" class="text-muted"
                >Obligatoire pour soumettre votre profil et publier. Pour une
                organisation, déposez la pièce du représentant.</p
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
                  label="Type de pièce"
                  :rules="[
                    v => !!v || 'Choisissez un type de pièce'
                  ]" /><q-input
                  v-model="identity.expires_at"
                  type="date"
                  outlined
                  stack-label
                  label="Date d’expiration"
                  :min="tomorrow"
                  :rules="[
                    v => (!!v && v >= tomorrow) || 'La pièce doit être valide'
                  ]" /><q-file
                  v-model="identity.file"
                  outlined
                  accept=".pdf,.jpg,.jpeg,.png"
                  max-file-size="5242880"
                  label="Fichier (PDF, JPEG ou PNG, 5 Mo maximum)"
                  :rules="[v => !!v || 'Ajoutez le fichier']" /><q-btn
                  type="submit"
                  no-caps
                  color="primary"
                  label="Déposer la pièce d’identité"
                  :loading="busy"
              /></q-form>
            </q-card>
            <q-card flat bordered class="workspace-card"
              ><h2>Votre publication</h2
              ><p v-if="auth.canSubmit"
                >Votre profil est vérifié. Chaque application et chaque version
                restent soumises à une revue indépendante.</p
              ><template v-else
                ><p class="text-muted"
                  >La création et la publication d’applications sont bloquées
                  tant que :</p
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
                label="Préparer une application"
                to="/developer/apps/create"
                :disable="!auth.canCreateApp"
            /></q-card>
            <q-card v-if="quotas" flat bordered class="workspace-card q-mt-md"
              ><h2>Quotas de publication</h2
              ><p
                >{{ quotas.published_or_reserved }} application(s) publiée(s) ou
                en revue.</p
              ><p>{{
                quotas.free_applications === null
                  ? 'Le quota gratuit n’est pas encore fixé.'
                  : `Quota gratuit : ${quotas.free_applications}`
              }}</p
              ><p
                >Stockage :
                {{ (quotas.storage_bytes / 1024 / 1024).toFixed(1) }} Mo</p
              ><p
                >Build : {{ Math.floor(quotas.build_max_kb / 1024) }} Mo
                maximum</p
              ><q-banner v-if="!quotas.can_publish_more" class="workspace-alert"
                >Quota atteint : vos applications existantes restent
                conservées.</q-banner
              ><p class="text-muted">Aucun paiement n’est activé.</p></q-card
            >
            <q-card flat bordered class="workspace-card q-mt-md"
              ><h2>Historique</h2
              ><q-list separator
                ><q-item v-for="event in profile.events" :key="event.id"
                  ><q-item-section
                    ><q-item-label>{{
                      labels[event.to_status] || event.to_status
                    }}</q-item-label
                    ><q-item-label caption
                      >{{ event.reason || 'Changement de statut' }} ·
                      {{
                        new Date(event.created_at).toLocaleDateString('fr-FR')
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
  type: 'type de profil',
  public_name: 'nom public',
  legal_name: 'nom légal',
  country_id: 'pays',
  representative_name: 'représentant',
  business_email: 'e-mail professionnel'
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
  draft: 'Profil à compléter',
  pending_verification: 'Vérification en attente',
  verified: 'Profil vérifié',
  rejected: 'Corrections demandées',
  suspended: 'Publication suspendue'
}
const statusLabel = computed(() => labels[profile.value?.status] || 'Brouillon')
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
    q.notify({ type: 'positive', message: 'Profil enregistré.' })
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
      message: 'Votre profil a été soumis à vérification.'
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
    q.notify({ type: 'positive', message: 'Pièce d’identité déposée.' })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
