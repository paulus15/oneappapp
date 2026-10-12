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
          :color="statusColor(application.status)"
          text-color="white"
          :label="statusLabel(application.status)" /><q-btn
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
      <q-card
        v-if="readiness && editable"
        flat
        bordered
        class="workspace-card q-mb-md"
      >
        <h2>Parcours de publication</h2>
        <ol class="journey">
          <li
            v-for="step in steps"
            :key="step.title"
            :class="{ done: step.done }"
          >
            <q-icon
              :name="step.done ? 'check_circle' : 'radio_button_unchecked'"
              :color="step.done ? 'positive' : 'grey-6'"
            />
            <div>
              <strong>{{ step.title }}</strong>
              <p v-for="gap in step.gaps" :key="gap" class="text-muted">{{
                gap
              }}</p>
            </div>
            <q-btn
              v-if="step.action"
              flat
              dense
              no-caps
              color="primary"
              :label="step.action.label"
              :to="step.action.to"
              @click="step.action.click?.()"
            />
          </li>
        </ol>
      </q-card>
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
            <q-banner
              v-if="
                source.source_type === 'build' &&
                platform &&
                !platform.build_hosting
              "
              class="workspace-alert"
              >L’hébergement des builds n’est pas encore activé sur cette
              plateforme. Vous pouvez déposer et faire analyser vos builds, mais
              leur mise en ligne attend la configuration d’un domaine isolé.
              Pour publier dès maintenant, choisissez le référencement par
              URL.</q-banner
            >
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
            ><template v-if="urlChecks.length"
              ><h3 class="q-mt-md">Historique des contrôles</h3
              ><q-list dense separator class="rounded-borders"
                ><q-item v-for="check in urlChecks" :key="check.id"
                  ><q-item-section avatar
                    ><q-icon
                      :name="check.ok ? 'check_circle' : 'error'"
                      :color="
                        check.ok ? 'positive' : 'negative'
                      " /></q-item-section
                  ><q-item-section
                    ><q-item-label
                      >{{ new Date(check.created_at).toLocaleString('fr-FR') }}
                      ·
                      {{
                        check.trigger === 'scheduled'
                          ? 'contrôle automatique'
                          : 'contrôle manuel'
                      }}</q-item-label
                    ><q-item-label caption>{{
                      check.ok
                        ? `${check.manifest_found ? 'Manifeste trouvé' : 'Manifeste absent'}${check.content_changed ? ' · contenu modifié' : ''}`
                        : check.error
                    }}</q-item-label></q-item-section
                  ></q-item
                ></q-list
              ></template
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
          <div class="workspace-actions">
            <q-btn
              v-if="editable"
              no-caps
              color="primary"
              label="Soumettre à la revue"
              :disable="!auth.canSubmit || busy"
              @click="submit"
            />
            <q-btn
              v-if="application.status === 'approved'"
              no-caps
              color="positive"
              icon="rocket_launch"
              label="Publier dans le Store"
              :class="{ 'motion-launch': launching }"
              :disable="!auth.canSubmit || busy"
              @click="publish"
            />
            <q-btn
              v-if="application.status === 'archived'"
              no-caps
              outline
              color="primary"
              label="Réactiver en brouillon"
              :disable="busy"
              @click="restore"
            />
            <q-btn
              v-else-if="isOwner"
              no-caps
              flat
              color="negative"
              label="Archiver"
              :disable="busy"
              @click="archive"
            />
          </div>
          <p v-if="application.status === 'approved'" class="text-muted"
            >L’application est approuvée mais pas encore visible : publiez-la
            quand vous êtes prêt.</p
          >
          <div v-if="!auth.canSubmit" class="text-muted"
            ><p
              v-for="reason in auth.user?.publication_blockers || []"
              :key="reason"
              >{{ reason }}</p
            ><router-link to="/developer/profile"
              >Compléter mon profil développeur</router-link
            ></div
          >
          <div v-if="canModerate && !isOwner" class="workspace-actions"
            ><q-btn
              v-for="decision in adminDecisions(application.status)"
              :key="decision.to"
              outline
              no-caps
              :icon="decision.icon"
              :label="decision.label"
              :disable="busy"
              @click="reviewApp(decision)"
          /></div>
        </q-card>
        <q-card flat bordered class="workspace-card"
          ><h2>Historique de publication</h2
          ><p v-if="!events.length" class="text-muted"
            >Aucun changement d’état enregistré.</p
          ><q-list separator dense
            ><q-item v-for="event in events" :key="event.id"
              ><q-item-section
                ><q-item-label>{{ eventLabel(event.action) }}</q-item-label
                ><q-item-label caption
                  >{{ new Date(event.created_at).toLocaleString('fr-FR') }} ·
                  {{
                    event.actor?.name || 'Contrôle automatique'
                  }}</q-item-label
                ><q-item-label v-if="event.reason" caption>{{
                  event.reason
                }}</q-item-label></q-item-section
              ></q-item
            ></q-list
          ></q-card
        >
      </div>
      <q-dialog v-model="previewOpen" :maximized="$q.screen.lt.sm">
        <q-card class="preview-card">
          <q-card-section class="row items-center">
            <div class="col">
              <span class="eyebrow">Aperçu de la fiche publique</span>
            </div>
            <q-btn flat round icon="close" aria-label="Fermer" v-close-popup />
          </q-card-section>
          <q-card-section class="preview-head">
            <div class="preview-icon">
              <AppIcon
                :src="application.icon_url"
                :alt="`Icône de ${application.name}`"
                fallback-icon="apps"
              />
            </div>
            <div>
              <h2>{{ application.name }}</h2>
              <p class="text-muted"
                >{{ application.category?.name || 'Sans catégorie' }} ·
                {{
                  auth.user?.developer_profile?.public_name || auth.userName
                }}</p
              >
            </div>
          </q-card-section>
          <q-card-section>
            <p v-if="application.short_description">
              <strong>{{ application.short_description }}</strong>
            </p>
            <p class="preview-description">{{
              application.description || 'Aucune description.'
            }}</p>
            <div v-if="screenshots.length" class="preview-shots">
              <img
                v-for="(shot, i) in screenshots"
                :key="shot"
                :src="resolveMediaUrl(shot)"
                :alt="`Capture ${i + 1}`"
                loading="lazy"
              />
            </div>
            <p v-else class="text-muted">Aucune capture d’écran.</p>
            <p class="text-caption text-muted"
              >Les notes et avis apparaîtront après publication.</p
            >
          </q-card-section>
        </q-card>
      </q-dialog>
      <section class="workspace-section"
        ><h2>Versions</h2
        ><p v-if="!application.versions?.length">Aucun build déposé.</p
        ><div class="workspace-grid version-grid"
          ><q-card
            v-for="v in application.versions"
            :key="v.id"
            flat
            bordered
            class="workspace-card"
            ><h3>Version {{ v.version_number }}</h3>
            <ExternalResourcesReport :version="v" @changed="load" /><p
              >Analyse : {{ scanLabels[v.scan_status] || v.scan_status }}</p
            ><template v-if="v.scan_status === 'quarantined'"
              ><p class="text-caption text-muted"
                >Fonctions sensibles détectées, souvent présentes dans les
                bibliothèques (Quasar, SweetAlert…). Vous pouvez soumettre : un
                administrateur les examinera avant toute approbation.</p
              ><ul class="analysis-list"
                ><li
                  v-for="item in v.analysis_report?.dangerous_findings || []"
                  :key="item"
                  >{{ item }}</li
                ></ul
              ></template
            ><p
              >Revue :
              {{ versionLabels[v.moderation_status] || v.moderation_status }}</p
            ><q-chip
              v-if="v.status === 'active'"
              color="positive"
              text-color="white"
              label="Version active" /><p v-if="v.moderation_reason">{{
              v.moderation_reason
            }}</p
            ><div class="workspace-actions"
              ><template v-if="canModerate && !isOwner"
                ><q-btn
                  outline
                  no-caps
                  label="Approuver la version"
                  :disable="
                    busy || !['passed', 'quarantined'].includes(v.scan_status)
                  "
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
                  busy ||
                  !['approved', 'published'].includes(application.status) ||
                  !auth.canSubmit
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
import ExternalResourcesReport from '@/components/ExternalResourcesReport.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { accountApi, apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
import { resolveMediaUrl } from '@/utils/media'
import { usePlatform } from '@/composables/usePlatform'
import {
  adminDecisions,
  EDITABLE_STATUSES,
  statusColor,
  statusLabel
} from '@/utils/appStatus'
const route = useRoute(),
  q = useQuasar(),
  auth = useAuthStore()
const application = ref(null),
  stats = ref(null),
  loading = ref(true),
  busy = ref(false),
  error = ref('')
const source = reactive({ source_type: 'build', external_url: '' })
const { platform } = usePlatform()
const launching = ref(false)
const events = ref([])
const readiness = ref(null),
  urlChecks = ref([]),
  previewOpen = ref(false)
const screenshots = computed(() => [
  ...(application.value?.media?.screenshots?.mobile || []),
  ...(application.value?.media?.screenshots?.tablet || [])
])
const LISTING_GAPS = ['catégorie', 'description', 'icône']
const steps = computed(() => {
  const gaps = readiness.value?.gaps || []
  const listing = gaps.filter(g => LISTING_GAPS.some(k => g.includes(k)))
  const source = gaps.filter(g => !listing.includes(g))
  return [
    {
      title: 'Compléter la fiche',
      done: !listing.length,
      gaps: listing,
      action: listing.length
        ? {
            label: 'Modifier la fiche',
            to: `/developer/apps/${application.value.id}/edit`
          }
        : null
    },
    {
      title:
        application.value.source_type === 'url'
          ? 'Vérifier l’URL de la PWA'
          : 'Déposer un build analysé',
      done: !source.length,
      gaps: source
    },
    {
      title: 'Prévisualiser la fiche',
      done: false,
      gaps: [],
      action: { label: 'Aperçu', click: () => (previewOpen.value = true) }
    },
    {
      title: 'Soumettre à la revue',
      done: false,
      gaps: readiness.value?.blockers || []
    }
  ]
})
const versionLabels = {
  pending: 'En attente de revue',
  approved: 'Approuvée',
  rejected: 'Refusée'
}
const isOwner = computed(
  () => application.value?.developer_id === auth.user?.id
)
const canModerate = computed(() =>
  auth.user?.admin_permissions?.includes('apps.moderate')
)
const eventLabel = action =>
  action.startsWith('version_')
    ? `Version ${versionLabels[action.slice(8)]?.toLowerCase() || action}`
    : statusLabel(action)
const scanLabels = {
  passed: 'Analyse réussie',
  pending: 'À analyser',
  rejected: 'Rejetée',
  quarantined: 'À examiner'
}
const editable = computed(() =>
  EDITABLE_STATUSES.includes(application.value?.status)
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
    events.value = (await accountApi.appEvents(route.params.id)).data.data
    readiness.value = (await accountApi.readiness(route.params.id)).data
    urlChecks.value =
      application.value.source_type === 'url'
        ? (await accountApi.urlChecks(route.params.id)).data.data
        : []
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
async function checkUrl() {
  await run(
    () => accountApi.checkUrl(application.value.id),
    'Contrôle de l’URL réussi.'
  )
  // A failed check is recorded too: refresh the history, keeping the error shown.
  if (error.value) {
    const message = error.value
    await load()
    error.value = message
  }
}
function submit() {
  return run(
    () => accountApi.submitApp(application.value.id),
    'Application soumise à revue.'
  )
}
function publish() {
  q.dialog({
    title: 'Publier dans le Store ?',
    message: 'L’application sera visible par tous les visiteurs.',
    cancel: true
  }).onOk(async () => {
    // The rocket takes off while the publication is sent.
    launching.value = true
    await run(
      () => accountApi.publishApp(application.value.id),
      'Application publiée.'
    )
    launching.value = false
  })
}
function archive() {
  q.dialog({
    title: 'Archiver cette application ?',
    message:
      'Elle sera retirée du Store. Ses fichiers et son historique sont conservés et vous pourrez la réactiver en brouillon.',
    cancel: true
  }).onOk(() =>
    run(
      () => accountApi.archiveApp(application.value.id),
      'Application archivée.'
    )
  )
}
function restore() {
  return run(
    () => accountApi.restoreApp(application.value.id),
    'Application réactivée en brouillon.'
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
function reviewApp(decision) {
  if (!decision.reason)
    return run(
      () => accountApi.reviewApp(application.value.id, { status: decision.to }),
      'Décision enregistrée.'
    )
  withReason(reason =>
    accountApi.reviewApp(application.value.id, { status: decision.to, reason })
  )
}
function reviewVersion(v, status) {
  const quarantined = status === 'approved' && v.scan_status === 'quarantined'
  if (!quarantined)
    return withReason(reason =>
      accountApi.reviewVersion(v.id, { status, reason })
    )
  // Approving a quarantined build means taking responsibility for each finding.
  const findings = v.analysis_report?.dangerous_findings || []
  q.dialog({
    title: 'Lever la quarantaine et approuver ?',
    message: `${findings.join('\n')}\n\nJ’ai examiné ces fonctions sensibles et les juge légitimes. Motif :`,
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(reason =>
    run(
      () =>
        accountApi.reviewVersion(v.id, {
          status,
          reason,
          acknowledge_findings: true
        }),
      'Quarantaine levée, version approuvée.'
    )
  )
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
<style scoped>
.analysis-list {
  margin: 4px 0 8px;
  padding-left: 18px;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
.version-grid {
  grid-template-columns: minmax(0, 1fr);
}
.journey {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.journey li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.journey li > div {
  flex: 1;
  min-width: 0;
}
.journey p {
  margin: 2px 0 0;
  font-size: 13px;
}
.journey .q-icon {
  font-size: 22px;
  margin-top: 1px;
}
.preview-card {
  width: min(720px, 100vw);
  max-width: 100vw;
}
.preview-head {
  display: flex;
  gap: 14px;
  align-items: center;
}
.preview-head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 750;
}
.preview-icon {
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--surface-high);
}
.preview-description {
  white-space: pre-line;
}
.preview-shots {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.preview-shots img {
  height: 220px;
  border-radius: 12px;
  border: 1px solid var(--outline);
}
</style>
