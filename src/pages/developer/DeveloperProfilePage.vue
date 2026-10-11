<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Un compte, deux usages</span
      ><h1>Votre espace développeur</h1
      ><p
        >Préparez vos applications, puis faites vérifier votre profil pour les
        soumettre.</p
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
          >Votre profil est en cours de vérification. Vous pouvez préparer vos
          applications.</q-banner
        >
        <DeveloperDocuments :profile-id="profile.id" />
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
                >Aucune pièce d’identité n’est demandée à cette étape. Les
                informations légales sont réservées à la vérification.</p
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
                  :disable="!auth.user?.email_verified_at || busy"
                  @click="submit"
              /></div>
            </q-form>
          </q-card>
          <div>
            <q-card flat bordered class="workspace-card"
              ><h2>Votre publication</h2
              ><p>{{
                profile.status === 'verified'
                  ? 'Votre profil est vérifié. Chaque application et chaque version restent soumises à une revue indépendante.'
                  : 'Complétez votre profil, vérifiez votre e-mail puis demandez sa vérification.'
              }}</p
              ><q-btn
                no-caps
                color="primary"
                label="Préparer une application"
                to="/developer/apps/create"
                :disable="profile.status === 'suspended'"
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
onMounted(load)
</script>
