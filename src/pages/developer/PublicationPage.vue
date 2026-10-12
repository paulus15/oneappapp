<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ t('publication.eyebrow') }}</span
      ><h1>{{ application?.name || t('publication.fallbackName') }}</h1
      ><p>{{ t('publication.intro') }}</p></header
    >
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat :label="t('common.retry')" @click="load" /></template
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
          :label="t('publication.editListing')" /><q-btn
          flat
          no-caps
          to="/developer/profile"
          :label="t('publication.profileAndQuotas')"
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
        <div class="journey-head">
          <h2>{{ t('publication.journey.title') }}</h2>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="info_outline"
            :label="t('publication.journey.help')"
            @click="helpOpen = true"
          />
        </div>
        <ol class="journey">
          <li
            v-for="step in steps"
            :key="step.key"
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
              :disable="busy"
              @click="step.action.click?.()"
            />
          </li>
        </ol>
      </q-card>
      <q-dialog v-model="helpOpen">
        <q-card class="help-card">
          <q-card-section class="row items-center no-wrap">
            <h2 class="col help-title">{{
              t('publication.helpDialog.title')
            }}</h2>
            <q-btn
              flat
              round
              icon="close"
              :aria-label="t('common.close')"
              v-close-popup
            />
          </q-card-section>
          <q-card-section class="help-body">
            <p>{{ t('publication.helpDialog.intro') }}</p>
            <div
              v-for="(item, i) in tm('publication.helpDialog.steps')"
              :key="i"
              class="help-step"
            >
              <strong>{{ rt(item.title) }}</strong>
              <p>{{ rt(item.text) }}</p>
            </div>
            <p class="text-muted">{{ t('publication.helpDialog.footer') }}</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="t('common.gotIt')"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h2>{{ t('publication.source.title') }}</h2
          ><q-form class="workspace-form" @submit="saveSource">
            <q-option-group
              v-model="source.source_type"
              :options="[
                { label: t('publication.source.build'), value: 'build' },
                { label: t('publication.source.url'), value: 'url' }
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
              >{{ t('publication.source.hostingPending') }}</q-banner
            >
            <q-input
              v-if="source.source_type === 'url'"
              v-model="source.external_url"
              outlined
              type="url"
              :label="t('publication.source.urlLabel')"
              :readonly="!editable"
            />
            <q-btn
              v-if="editable"
              type="submit"
              no-caps
              color="primary"
              :label="t('publication.source.save')"
              :loading="busy"
            />
          </q-form>
          <template v-if="application.source_type === 'url'"
            ><q-btn
              class="q-mt-md"
              outline
              no-caps
              color="primary"
              :label="t('publication.source.checkUrl')"
              :loading="busy"
              @click="checkUrl"
            /><p v-if="application.last_checked_at">{{
              t('publication.source.lastCheck', {
                date: formatDate(application.last_checked_at)
              })
            }}</p
            ><p
              v-for="warning in application.external_report?.warnings || []"
              :key="warning"
              >{{ warning }}</p
            ><template v-if="urlChecks.length"
              ><h3 class="q-mt-md">{{ t('publication.source.history') }}</h3
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
                      >{{ formatDate(check.created_at) }}
                      ·
                      {{
                        check.trigger === 'scheduled'
                          ? t('publication.source.scheduled')
                          : t('publication.source.manual')
                      }}</q-item-label
                    ><q-item-label caption>{{
                      check.ok
                        ? `${check.manifest_found ? t('publication.source.manifestFound') : t('publication.source.manifestMissing')}${check.content_changed ? t('publication.source.contentChanged') : ''}`
                        : check.error
                    }}</q-item-label></q-item-section
                  ></q-item
                ></q-list
              ></template
            ></template
          >
          <p v-else>{{ t('publication.source.buildHint') }}</p>
        </q-card>
        <q-card flat bordered class="workspace-card"
          ><h2>{{ t('publication.submission.title') }}</h2
          ><p>{{ t('publication.submission.intro') }}</p>
          <div class="workspace-actions">
            <q-btn
              v-if="editable"
              no-caps
              color="primary"
              :label="t('publication.submission.submit')"
              :disable="!auth.canSubmit || busy"
              @click="submit"
            />
            <q-btn
              v-if="application.status === 'approved'"
              no-caps
              color="positive"
              icon="rocket_launch"
              :label="t('publication.submission.publish')"
              :class="{ 'motion-launch': launching }"
              :disable="!auth.canSubmit || busy"
              @click="publish"
            />
            <q-btn
              v-if="application.status === 'archived'"
              no-caps
              outline
              color="primary"
              :label="t('publication.submission.restore')"
              :disable="busy"
              @click="restore"
            />
            <q-btn
              v-else-if="isOwner"
              no-caps
              flat
              color="negative"
              :label="t('publication.submission.archive')"
              :disable="busy"
              @click="archive"
            />
          </div>
          <p v-if="application.status === 'approved'" class="text-muted">{{
            t('publication.submission.approvedHint')
          }}</p>
          <div v-if="!auth.canSubmit" class="text-muted"
            ><p
              v-for="reason in auth.user?.publication_blockers || []"
              :key="reason"
              >{{ reason }}</p
            ><router-link to="/developer/profile">{{
              t('publication.submission.completeProfile')
            }}</router-link></div
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
          ><h2>{{ t('publication.history.title') }}</h2
          ><p v-if="!events.length" class="text-muted">{{
            t('publication.history.empty')
          }}</p
          ><q-list separator dense
            ><q-item v-for="event in events" :key="event.id"
              ><q-item-section
                ><q-item-label>{{ eventLabel(event.action) }}</q-item-label
                ><q-item-label caption
                  >{{ formatDate(event.created_at) }} ·
                  {{
                    event.actor?.name || t('publication.history.automatic')
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
              <span class="eyebrow">{{
                t('publication.preview.eyebrow')
              }}</span>
            </div>
            <q-btn
              flat
              round
              icon="close"
              :aria-label="t('common.close')"
              v-close-popup
            />
          </q-card-section>
          <q-card-section class="preview-head">
            <div class="preview-icon">
              <AppIcon
                :src="application.icon_url"
                :alt="
                  t('publication.preview.iconAlt', { name: application.name })
                "
                fallback-icon="apps"
              />
            </div>
            <div>
              <h2>{{ application.name }}</h2>
              <p class="text-muted"
                >{{
                  application.category?.name ||
                  t('publication.preview.noCategory')
                }}
                ·
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
              application.description || t('publication.preview.noDescription')
            }}</p>
            <div v-if="screenshots.length" class="preview-shots">
              <img
                v-for="(shot, i) in screenshots"
                :key="shot"
                :src="resolveMediaUrl(shot)"
                :alt="t('publication.preview.screenshot', { n: i + 1 })"
                loading="lazy"
              />
            </div>
            <p v-else class="text-muted">{{
              t('publication.preview.noScreenshots')
            }}</p>
            <p class="text-caption text-muted">{{
              t('publication.preview.reviewsLater')
            }}</p>
          </q-card-section>
        </q-card>
      </q-dialog>
      <section class="workspace-section"
        ><h2>{{ t('publication.versions.title') }}</h2
        ><p v-if="!application.versions?.length">{{
          t('publication.versions.empty')
        }}</p
        ><div class="workspace-grid version-grid"
          ><q-card
            v-for="v in application.versions"
            :key="v.id"
            flat
            bordered
            class="workspace-card"
            ><h3>{{
              t('publication.versions.version', { number: v.version_number })
            }}</h3>
            <ExternalResourcesReport :version="v" @changed="load" /><p>{{
              t('publication.versions.analysis', {
                status: scanLabel(v.scan_status)
              })
            }}</p
            ><template v-if="v.scan_status === 'quarantined'"
              ><p class="text-caption text-muted">{{
                t('publication.versions.quarantineHint')
              }}</p
              ><ul class="analysis-list"
                ><li
                  v-for="item in v.analysis_report?.dangerous_findings || []"
                  :key="item"
                  >{{ item }}</li
                ></ul
              ></template
            ><p>{{
              t('publication.versions.review', {
                status: moderationLabel(v.moderation_status)
              })
            }}</p
            ><q-chip
              v-if="v.status === 'active'"
              color="positive"
              text-color="white"
              :label="t('publication.versions.active')" /><p
              v-if="v.moderation_reason"
              >{{ v.moderation_reason }}</p
            ><div class="workspace-actions"
              ><template v-if="canModerate && !isOwner"
                ><q-btn
                  outline
                  no-caps
                  :label="t('publication.versions.approve')"
                  :disable="
                    busy || !['passed', 'quarantined'].includes(v.scan_status)
                  "
                  @click="reviewVersion(v, 'approved')" /><q-btn
                  outline
                  no-caps
                  :label="t('publication.versions.reject')"
                  :disable="busy"
                  @click="reviewVersion(v, 'rejected')" /></template
              ><q-btn
                v-if="v.moderation_status === 'approved'"
                color="primary"
                no-caps
                :label="
                  v.status === 'active'
                    ? t('publication.versions.redeploy')
                    : t('publication.versions.deploy')
                "
                :disable="
                  busy ||
                  !['approved', 'published'].includes(application.status) ||
                  !auth.canSubmit
                "
                @click="deploy(v)" /></div></q-card></div
      ></section>
      <section v-if="stats" class="workspace-section"
        ><h2>{{ t('publication.stats.title') }}</h2
        ><div class="workspace-grid"
          ><q-card flat bordered class="workspace-card"
            ><h3>{{
              t('publication.stats.installations', {
                n: stats.total_installations
              })
            }}</h3
            ><p>{{
              t('publication.stats.launches', { n: stats.total_launches })
            }}</p></q-card
          ><q-card flat bordered class="workspace-card"
            ><h3>{{
              t('publication.stats.crashes', { n: stats.total_crashes })
            }}</h3
            ><p>{{
              t('publication.stats.ratio', { n: stats.crashes_ratio })
            }}</p></q-card
          ></div
        ><p class="text-muted">{{ t('publication.stats.note') }}</p></section
      >
    </template>
  </q-page>
</template>
<script setup>
import ExternalResourcesReport from '@/components/ExternalResourcesReport.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
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
  auth = useAuthStore(),
  { t, tm, rt, locale } = useI18n()
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
  previewOpen = ref(false),
  helpOpen = ref(false)
const screenshots = computed(() => [
  ...(application.value?.media?.screenshots?.mobile || []),
  ...(application.value?.media?.screenshots?.tablet || [])
])
const formatDate = value => new Date(value).toLocaleString(locale.value)

// The preview step is ticked once the listing, as it is now, has been looked at.
const PREVIEW_KEY = 'pwa-preview-seen'
const previewedAt = ref(null)
function readPreviewed(id) {
  try {
    return JSON.parse(localStorage.getItem(PREVIEW_KEY) || '{}')[id] || null
  } catch {
    return null
  }
}
function openPreview() {
  previewOpen.value = true
  const { id, updated_at: version } = application.value
  previewedAt.value = version
  try {
    const seen = JSON.parse(localStorage.getItem(PREVIEW_KEY) || '{}')
    localStorage.setItem(
      PREVIEW_KEY,
      JSON.stringify({ ...seen, [id]: version })
    )
  } catch {
    // Without storage the step stays ticked for this visit only.
  }
}

const steps = computed(() => {
  const listing = readiness.value?.listing_gaps || []
  const sourceGaps = readiness.value?.source_gaps || []
  const previewed = previewedAt.value === application.value.updated_at
  const blockers = readiness.value?.blockers || []
  return [
    {
      key: 'listing',
      title: t('publication.journey.listing'),
      done: !listing.length,
      gaps: listing,
      action: listing.length
        ? {
            label: t('publication.journey.editListing'),
            to: `/developer/apps/${application.value.id}/edit`
          }
        : null
    },
    {
      key: 'source',
      title:
        application.value.source_type === 'url'
          ? t('publication.journey.checkUrl')
          : t('publication.journey.uploadBuild'),
      done: !sourceGaps.length,
      gaps: sourceGaps
    },
    {
      key: 'preview',
      title: t('publication.journey.preview'),
      done: previewed,
      gaps: previewed
        ? []
        : [
            previewedAt.value
              ? t('publication.journey.previewAgain')
              : t('publication.journey.previewHint')
          ],
      action: {
        label: t('publication.journey.previewAction'),
        click: openPreview
      }
    },
    {
      key: 'submit',
      title: t('publication.journey.submit'),
      done: false,
      gaps: blockers,
      action:
        readiness.value?.ready && previewed
          ? { label: t('publication.journey.submitAction'), click: submit }
          : null
    }
  ]
})
const isOwner = computed(
  () => application.value?.developer_id === auth.user?.id
)
const canModerate = computed(() =>
  auth.user?.admin_permissions?.includes('apps.moderate')
)
const translated = (key, fallback) => {
  const text = t(key)
  return text === key ? fallback : text
}
const scanLabel = status =>
  translated(`publication.versions.scan.${status}`, status)
const moderationLabel = status =>
  translated(`publication.versions.moderation.${status}`, status)
const eventLabel = action =>
  action.startsWith('version_')
    ? t('publication.history.version', {
        status: moderationLabel(action.slice(8)).toLowerCase()
      })
    : statusLabel(action)
const editable = computed(() =>
  EDITABLE_STATUSES.includes(application.value?.status)
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    application.value = (await api.get(`/apps/${route.params.id}`)).data
    previewedAt.value = readPreviewed(application.value.id)
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
    t('publication.source.saved')
  )
}
async function checkUrl() {
  await run(
    () => accountApi.checkUrl(application.value.id),
    t('publication.source.checkOk')
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
    t('publication.submission.submitted')
  )
}
function publish() {
  q.dialog({
    title: t('publication.submission.publishTitle'),
    message: t('publication.submission.publishMessage'),
    cancel: true
  }).onOk(async () => {
    // The rocket takes off while the publication is sent.
    launching.value = true
    await run(
      () => accountApi.publishApp(application.value.id),
      t('publication.submission.published')
    )
    launching.value = false
  })
}
function archive() {
  q.dialog({
    title: t('publication.submission.archiveTitle'),
    message: t('publication.submission.archiveMessage'),
    cancel: true
  }).onOk(() =>
    run(
      () => accountApi.archiveApp(application.value.id),
      t('publication.submission.archived')
    )
  )
}
function restore() {
  return run(
    () => accountApi.restoreApp(application.value.id),
    t('publication.submission.restored')
  )
}
function withReason(action) {
  q.dialog({
    title: t('publication.moderation.title'),
    message: t('publication.moderation.message'),
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(reason =>
    run(() => action(reason), t('publication.moderation.saved'))
  )
}
function reviewApp(decision) {
  if (!decision.reason)
    return run(
      () => accountApi.reviewApp(application.value.id, { status: decision.to }),
      t('publication.moderation.saved')
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
    title: t('publication.versions.quarantineTitle'),
    message: `${findings.join('\n')}\n\n${t('publication.versions.quarantineMessage')}`,
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
      t('publication.versions.quarantineCleared')
    )
  )
}
function deploy(v) {
  q.dialog({
    title: t('publication.versions.deployTitle'),
    message: t('publication.versions.deployMessage'),
    cancel: true,
    persistent: true
  }).onOk(() =>
    run(() => accountApi.deploy(v.id), t('publication.versions.deployed'))
  )
}
onMounted(load)
</script>
<style scoped>
.journey-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.help-card {
  width: min(640px, 100vw);
}
.help-title {
  margin: 0;
  font-size: 20px;
  font-weight: 750;
}
.help-body {
  max-height: 65vh;
  overflow-y: auto;
}
.help-step {
  margin-bottom: 12px;
}
.help-step p {
  margin: 2px 0 0;
}
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
