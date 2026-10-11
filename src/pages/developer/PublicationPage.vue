<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Publication et versions</span
      ><h1>{{ application?.name || 'Votre application' }}</h1
      ><p
        >Préparation, analyse, revue et publication sont des étapes
        distinctes.</p
      ></header
    >
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template
    ></q-banner>
    <template v-if="application">
      <div class="workspace-actions"
        ><q-chip
          color="primary"
          text-color="white"
          :label="labels[application.status] || application.status" /><q-btn
          flat
          no-caps
          :to="`/developer/apps/${application.id}/edit`"
          label="Modifier la fiche / déposer un build" /><q-btn
          flat
          no-caps
          to="/developer/profile"
          label="Mon profil et mes quotas"
      /></div>
      <q-banner v-if="application.moderation_reason" class="workspace-alert">{{
        application.moderation_reason
      }}</q-banner>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h2>Mode de distribution</h2
          ><q-form class="workspace-form" @submit="saveSource">
            <q-option-group
              v-model="source.source_type"
              :options="[
                { label: 'Build ZIP hébergé', value: 'build' },
                { label: 'PWA hébergée sur mon site', value: 'url' }
              ]"
              :disable="!editable || busy"
            />
            <q-input
              v-if="source.source_type === 'url'"
              v-model="source.external_url"
              outlined
              type="url"
              label="Adresse HTTPS de la PWA"
              :readonly="!editable"
            />
            <q-btn
              v-if="editable"
              type="submit"
              no-caps
              color="primary"
              label="Enregistrer le mode"
              :loading="busy"
            />
          </q-form>
          <template v-if="application.source_type === 'url'"
            ><q-btn
              class="q-mt-md"
              outline
              no-caps
              color="primary"
              label="Contrôler l’URL"
              :loading="busy"
              @click="checkUrl"
            /><p v-if="application.last_checked_at"
              >Dernier contrôle :
              {{
                new Date(application.last_checked_at).toLocaleString('fr-FR')
              }}</p
            ><p
              v-for="warning in application.external_report?.warnings || []"
              :key="warning"
              >{{ warning }}</p
            ></template
          >
          <p v-else
            >Déposez un build depuis l’édition de la fiche. Aucun script de
            compilation n’est exécuté sur le serveur.</p
          >
        </q-card>
        <q-card flat bordered class="workspace-card"
          ><h2>Soumission et modération</h2
          ><p
            >Un profil vérifié permet de soumettre une application. Chaque
            application et chaque build sont ensuite examinés séparément.</p
          >
          <q-btn
            v-if="['draft', 'rejected'].includes(application.status)"
            no-caps
            color="primary"
            label="Soumettre à publication"
            :disable="!auth.canSubmit || busy"
            @click="submit"
          />
          <div v-if="!auth.canSubmit" class="text-muted"
            ><p
              v-for="reason in auth.user?.publication_blockers || []"
              :key="reason"
              >{{ reason }}</p
            ><router-link to="/developer/profile"
              >Compléter mon profil développeur</router-link
            ></div
          >
          <div v-if="auth.isAdmin" class="workspace-actions"
            ><q-btn
              outline
              no-caps
              label="Approuver la fiche"
              @click="reviewApp('approved')"
              :disable="busy" /><q-btn
              outline
              no-caps
              label="Refuser"
              @click="reviewApp('rejected')"
              :disable="busy" /><q-btn
              outline
              no-caps
              label="Mettre en quarantaine"
              @click="reviewApp('quarantined')"
              :disable="busy"
          /></div>
        </q-card>
      </div>
      <section class="workspace-section"
        ><h2>Versions</h2
        ><p v-if="!application.versions?.length">Aucun build déposé.</p
        ><div class="workspace-grid"
          ><q-card
            v-for="v in application.versions"
            :key="v.id"
            flat
            bordered
            class="workspace-card"
            ><h3>Version {{ v.version_number }}</h3
            ><p>Analyse : {{ scanLabels[v.scan_status] || v.scan_status }}</p
            ><p
              >Revue :
              {{ labels[v.moderation_status] || v.moderation_status }}</p
            ><q-chip
              v-if="v.status === 'active'"
              color="positive"
              text-color="white"
              label="Version active" /><p v-if="v.moderation_reason">{{
              v.moderation_reason
            }}</p
            ><div class="workspace-actions"
              ><template v-if="auth.isAdmin"
                ><q-btn
                  outline
                  no-caps
                  label="Approuver la version"
                  :disable="busy || v.scan_status !== 'passed'"
                  @click="reviewVersion(v, 'approved')" /><q-btn
                  outline
                  no-caps
                  label="Refuser la version"
                  :disable="busy"
                  @click="reviewVersion(v, 'rejected')" /></template
              ><q-btn
                v-if="v.moderation_status === 'approved'"
                color="primary"
                no-caps
                :label="
                  v.status === 'active' ? 'Redéployer' : 'Publier cette version'
                "
                :disable="
                  busy || application.status !== 'approved' || !auth.canSubmit
                "
                @click="deploy(v)" /></div></q-card></div
      ></section>
      <section v-if="stats" class="workspace-section"
        ><h2>Statistiques disponibles</h2
        ><div class="workspace-grid"
          ><q-card flat bordered class="workspace-card"
            ><h3
              >{{ stats.total_installations }} installation(s)
              enregistrée(s)</h3
            ><p>Ouvertures déclarées : {{ stats.total_launches }}</p></q-card
          ><q-card flat bordered class="workspace-card"
            ><h3>{{ stats.total_crashes }} crash(es) déclaré(s)</h3
            ><p>Ratio : {{ stats.crashes_ratio }}</p></q-card
          ></div
        ><p class="text-muted"
          >Totaux issus des événements reçus. L’absence de données ne prouve pas
          l’absence d’usage ou d’erreur.</p
        ></section
      >
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { accountApi, apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
const route = useRoute(),
  q = useQuasar(),
  auth = useAuthStore()
const application = ref(null),
  stats = ref(null),
  loading = ref(true),
  busy = ref(false),
  error = ref('')
const source = reactive({ source_type: 'build', external_url: '' })
const labels = {
  draft: 'Brouillon',
  pending: 'En attente de revue',
  approved: 'Approuvée',
  rejected: 'Refusée',
  quarantined: 'En quarantaine',
  suspended: 'Suspendue'
}
const scanLabels = {
  passed: 'Analyse réussie',
  pending: 'À analyser',
  rejected: 'Rejetée',
  quarantined: 'À examiner'
}
const editable = computed(() =>
  ['draft', 'rejected'].includes(application.value?.status)
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    application.value = (await api.get(`/apps/${route.params.id}`)).data
    Object.assign(source, {
      source_type: application.value.source_type,
      external_url: application.value.external_url || ''
    })
    stats.value = (await accountApi.analytics(route.params.id)).data
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
    await load()
    q.notify({ type: 'positive', message })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
function saveSource() {
  return run(
    () => accountApi.source(application.value.id, source),
    'Mode de distribution enregistré.'
  )
}
function checkUrl() {
  return run(
    () => accountApi.checkUrl(application.value.id),
    'Contrôle de l’URL terminé.'
  )
}
function submit() {
  return run(
    () => accountApi.submitApp(application.value.id),
    'Application soumise à revue.'
  )
}
function withReason(action) {
  q.dialog({
    title: 'Décision de modération',
    message: 'Indiquez le motif de votre décision.',
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(reason => run(() => action(reason), 'Décision enregistrée.'))
}
function reviewApp(status) {
  withReason(reason =>
    accountApi.reviewApp(application.value.id, { status, reason })
  )
}
function reviewVersion(v, status) {
  withReason(reason => accountApi.reviewVersion(v.id, { status, reason }))
}
function deploy(v) {
  q.dialog({
    title: 'Publier cette version ?',
    message:
      'Cette version approuvée remplacera la version actuellement servie. Les autres builds seront conservés.',
    cancel: true,
    persistent: true
  }).onOk(() => run(() => accountApi.deploy(v.id), 'Version publiée.'))
}
onMounted(load)
</script>
