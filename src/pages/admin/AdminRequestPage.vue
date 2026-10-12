<template>
  <q-page class="admin-page">
    <q-btn
      flat
      no-caps
      icon="arrow_back"
      :label="t('requests.backToQueue')"
      to="/admin/requests"
      class="q-mb-sm"
    />
    <q-linear-progress v-if="loading" indeterminate />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat :label="t('common.retry')" @click="load" /></template
    ></q-banner>
    <template v-if="dossier">
      <header class="dossier-head">
        <div class="dossier-icon">
          <AppIcon :src="listing.icon_url" :alt="''" fallback-icon="apps" />
        </div>
        <div class="dossier-title">
          <span class="admin-eyebrow">{{
            t(`requests.kind.${request.kind}`)
          }}</span>
          <h1 class="admin-title">{{ listing.name }}</h1>
          <div class="dossier-meta">
            <q-chip
              dense
              :color="REQUEST_COLORS[request.status]"
              text-color="white"
              :label="t(`requests.status.${request.status}`)"
            />
            <HostingBadge :source-type="dossier.application.source_type" />
            <span class="text-caption text-muted">{{
              t('workspace.history.sent', {
                date: formatDate(request.submitted_at)
              })
            }}</span>
          </div>
        </div>
      </header>

      <div class="dossier-grid">
        <div class="dossier-main">
          <!-- Fiche telle qu'elle sera publiée -->
          <q-card flat bordered class="workspace-card">
            <h2>{{ t('requests.dossier.listing') }}</h2>
            <p v-if="changedFields.length" class="changed-note">
              <q-icon name="compare_arrows" />
              {{
                t('requests.dossier.changed', {
                  fields: changedFields.map(fieldLabel).join(', ')
                })
              }}
            </p>
            <p v-if="listing.short_description">
              <strong>{{ listing.short_description }}</strong>
            </p>
            <p class="pre-line">{{ listing.description }}</p>
            <div v-if="screens.length" class="dossier-shots">
              <img
                v-for="url in screens"
                :key="url"
                :src="resolveMediaUrl(url)"
                alt=""
                loading="lazy"
              />
            </div>
            <dl class="facts">
              <template v-for="row in listingRows" :key="row.key">
                <dt>{{ row.label }}</dt>
                <dd :class="{ changed: changedFields.includes(row.key) }">
                  <span>{{ row.value || '—' }}</span>
                  <span
                    v-if="changedFields.includes(row.key) && previous"
                    class="previous"
                    >{{
                      t('requests.dossier.before', {
                        value: format(row.key, previous[row.key]) || '—'
                      })
                    }}</span
                  >
                </dd>
              </template>
            </dl>
          </q-card>

          <!-- Source et version -->
          <q-card flat bordered class="workspace-card">
            <h2>{{ t('requests.dossier.source') }}</h2>
            <template v-if="snapshot.source?.type === 'url'">
              <p class="url-line">
                <q-icon name="link" />
                <a
                  :href="snapshot.source.external_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ snapshot.source.external_url }}</a
                >
              </p>
              <p class="text-caption">{{
                t('requests.dossier.urlChecked', {
                  date: formatDate(snapshot.source.url_check?.checked_at)
                })
              }}</p>
              <ul
                v-if="snapshot.source.url_check?.report?.warnings?.length"
                class="analysis-list"
              >
                <li
                  v-for="w in snapshot.source.url_check.report.warnings"
                  :key="w"
                  >{{ w }}</li
                >
              </ul>
            </template>
            <template v-else-if="version">
              <p>
                <strong>{{
                  t('publication.versions.version', {
                    number: version.version_number
                  })
                }}</strong>
                · {{ formatSize(version.package_size) }} ·
                {{ t(`publication.versions.scan.${version.scan_status}`) }}
              </p>
              <p v-if="version.release_notes" class="pre-line text-caption">{{
                version.release_notes
              }}</p>
              <p class="text-caption text-muted hash"
                >SHA-256 {{ version.hash_sha256 }}</p
              >
              <template v-if="version.permissions?.length">
                <h3>{{ t('builder.permissions') }}</h3>
                <p>{{
                  version.permissions
                    .map(p => t(`builder.permission.${p}`))
                    .join(', ')
                }}</p>
              </template>
              <template v-if="version.dangerous_findings?.length">
                <h3 class="text-orange-9">{{
                  t('requests.dossier.sensitive')
                }}</h3>
                <ul class="analysis-list">
                  <li v-for="f in version.dangerous_findings" :key="f">{{
                    f
                  }}</li>
                </ul>
              </template>
              <template v-if="warnings.length">
                <h3>{{ t('builder.warnings') }}</h3>
                <ul class="analysis-list">
                  <li v-for="w in warnings" :key="w">{{ w }}</li>
                </ul>
              </template>
              <ExternalResourcesReport
                v-if="dossier.request.version"
                :version="dossier.request.version"
                @changed="load"
              />
            </template>
            <p v-else class="text-muted">{{
              t('requests.dossier.noVersion')
            }}</p>
          </q-card>
        </div>

        <aside class="dossier-side">
          <!-- Développeur -->
          <q-card flat bordered class="workspace-card">
            <h2>{{ t('requests.dossier.developer') }}</h2>
            <p
              ><strong>{{
                dossier.developer.public_name || dossier.developer.name
              }}</strong></p
            >
            <p class="text-caption">
              {{ dossier.developer.email }}
              <span v-if="dossier.developer.country">
                · {{ dossier.developer.country.name }}</span
              >
            </p>
            <q-chip
              dense
              :color="
                dossier.developer.profile_status === 'verified'
                  ? 'positive'
                  : 'negative'
              "
              text-color="white"
              :icon="
                dossier.developer.profile_status === 'verified'
                  ? 'verified_user'
                  : 'gpp_bad'
              "
              :label="
                t(
                  dossier.developer.profile_status === 'verified'
                    ? 'requests.dossier.verified'
                    : 'requests.dossier.notVerified'
                )
              "
            />
            <ul v-if="dossier.developer.blockers.length" class="analysis-list">
              <li v-for="b in dossier.developer.blockers" :key="b">{{ b }}</li>
            </ul>
            <p class="text-caption text-muted">{{
              t(
                'requests.dossier.otherApps',
                { n: dossier.developer.other_apps },
                dossier.developer.other_apps
              )
            }}</p>
          </q-card>

          <!-- Décision -->
          <q-card flat bordered class="workspace-card decision-card">
            <h2>{{ t('requests.dossier.decision') }}</h2>
            <template v-if="isOpen">
              <q-btn
                v-if="request.status === 'pending'"
                outline
                no-caps
                icon="visibility"
                :label="t('requests.dossier.takeOver')"
                :loading="busy"
                class="q-mb-sm"
                @click="start"
              />
              <q-checkbox
                v-if="version?.dangerous_findings?.length"
                v-model="acknowledge"
                :label="t('requests.dossier.acknowledge')"
              />
              <q-banner
                v-if="dossier.resources.correction_requested"
                class="workspace-alert"
                >{{
                  t(
                    'requests.dossier.resourceCorrections',
                    { n: dossier.resources.correction_requested },
                    dossier.resources.correction_requested
                  )
                }}</q-banner
              >
              <q-input
                v-model="reason"
                outlined
                type="textarea"
                autogrow
                maxlength="2000"
                :label="t('requests.dossier.reason')"
                :hint="t('requests.dossier.reasonHint')"
              />
              <div class="decision-buttons">
                <q-btn
                  color="positive"
                  unelevated
                  no-caps
                  icon="check"
                  :label="t('requests.dossier.approve')"
                  :disable="
                    busy ||
                    (!!version?.dangerous_findings?.length && !acknowledge)
                  "
                  @click="decide('approved')"
                />
                <q-btn
                  color="orange-8"
                  unelevated
                  no-caps
                  icon="edit_note"
                  :label="t('requests.dossier.requestChanges')"
                  :disable="busy || reason.trim().length < 3"
                  @click="decide('changes_requested')"
                />
                <q-btn
                  color="negative"
                  flat
                  no-caps
                  icon="block"
                  :label="t('requests.dossier.reject')"
                  :disable="busy || reason.trim().length < 3"
                  @click="decide('rejected')"
                />
              </div>
              <p class="text-caption text-muted">{{
                t('requests.dossier.approveNote')
              }}</p>
            </template>
            <template v-else>
              <p
                >{{ t(`requests.status.${request.status}`) }} ·
                {{ formatDate(request.decided_at) }}
                <span v-if="request.reviewer"
                  >· {{ request.reviewer.name }}</span
                ></p
              >
              <p v-if="request.reason" class="pre-line">{{ request.reason }}</p>
            </template>
          </q-card>

          <!-- Notes internes -->
          <q-card flat bordered class="workspace-card">
            <h2>{{ t('requests.dossier.notes') }}</h2>
            <q-input
              v-model="note"
              outlined
              type="textarea"
              autogrow
              maxlength="5000"
              :hint="t('requests.dossier.notesHint')"
            />
            <q-btn
              flat
              no-caps
              color="primary"
              :label="t('workspace.save')"
              :loading="savingNote"
              @click="saveNote"
            />
          </q-card>

          <!-- Historique -->
          <q-card flat bordered class="workspace-card">
            <h2>{{ t('requests.dossier.history') }}</h2>
            <p
              v-if="!dossier.history.requests.length"
              class="text-caption text-muted"
              >{{ t('requests.dossier.firstRequest') }}</p
            >
            <q-list dense separator>
              <q-item v-for="h in dossier.history.requests" :key="h.id">
                <q-item-section>
                  <q-item-label
                    >{{ t(`requests.kind.${h.kind}`) }} ·
                    {{ t(`requests.status.${h.status}`) }}</q-item-label
                  >
                  <q-item-label caption>{{
                    formatDate(h.decided_at || h.submitted_at)
                  }}</q-item-label>
                  <q-item-label v-if="h.reason" caption>{{
                    h.reason
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </aside>
      </div>
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import ExternalResourcesReport from '@/components/ExternalResourcesReport.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { resolveMediaUrl } from '@/utils/media'

// Everything needed to decide, built from what the developer submitted (the snapshot).
const route = useRoute(),
  router = useRouter(),
  q = useQuasar(),
  { t, locale } = useI18n()
const REQUEST_COLORS = {
  pending: 'blue-7',
  in_review: 'indigo-6',
  approved: 'green-7',
  changes_requested: 'orange-8',
  rejected: 'red-7',
  withdrawn: 'grey-7'
}
const dossier = ref(null),
  loading = ref(true),
  busy = ref(false),
  savingNote = ref(false),
  error = ref(''),
  reason = ref(''),
  note = ref(''),
  acknowledge = ref(false)

const request = computed(() => dossier.value.request)
const snapshot = computed(() => request.value.snapshot || {})
const listing = computed(() => snapshot.value.listing || {})
const previous = computed(() => snapshot.value.published_listing)
const version = computed(() => snapshot.value.version)
const changedFields = computed(() =>
  (snapshot.value.changed_fields || []).filter(f => f !== 'category')
)
const isOpen = computed(() =>
  ['pending', 'in_review'].includes(request.value.status)
)
const screens = computed(() => [
  ...(listing.value.media?.screenshots?.mobile || []),
  ...(listing.value.media?.screenshots?.tablet || [])
])
// Detector limitations are repeated on every report; keep the reviewer's list short.
const warnings = computed(() =>
  (version.value?.warnings || []).filter(
    w => w && !w.startsWith('Analyse statique')
  )
)
const formatDate = value =>
  value ? new Date(value).toLocaleString(locale.value) : '—'
const formatSize = bytes =>
  bytes
    ? t('common.megabytes', {
        n: (bytes / 1048576).toLocaleString(locale.value, {
          maximumFractionDigits: 1
        })
      })
    : ''
const fieldLabel = field => {
  const keys = {
    short_description: 'shortDescription',
    category_id: 'category',
    official_site_url: 'officialUrl',
    contact_email: 'contactEmail',
    support_url: 'supportUrl',
    terms_url: 'termsUrl',
    privacy_policy_url: 'privacyUrl',
    privacy: 'dataCollected',
    icon_url: 'icon',
    media: 'screenshots'
  }
  return t(`workspace.field.${keys[field] || field}`)
}
function format(key, value) {
  if (value == null) return ''
  if (key === 'privacy')
    return (value.data_collected || [])
      .map(d => t(`workspace.data.${d}`))
      .join(', ')
  if (key === 'countries')
    return value.length
      ? t('workspace.recap.countries', { n: value.length }, value.length)
      : t('workspace.recap.allCountries')
  if (key === 'category_id') return listing.value.category || value
  if (key === 'media') {
    const n =
      (value.screenshots?.mobile?.length || 0) +
      (value.screenshots?.tablet?.length || 0)
    return t('requests.dossier.screens', { n }, n)
  }
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object')
    return Object.keys(value)
      .filter(k => value[k] && value[k] !== '0')
      .join(', ')
  return String(value)
}
const listingRows = computed(() =>
  [
    'category_id',
    'languages',
    'countries',
    'official_site_url',
    'contact_email',
    'support_url',
    'terms_url',
    'privacy_policy_url',
    'privacy',
    'media'
  ].map(key => ({
    key,
    label: fieldLabel(key),
    value: format(key, listing.value[key])
  }))
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    dossier.value = (await adminApi.request(route.params.id)).data
    note.value = dossier.value.request.internal_note || ''
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function start() {
  busy.value = true
  try {
    await adminApi.startRequest(request.value.id)
    await load()
  } catch (e) {
    q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    busy.value = false
  }
}
function decide(decision) {
  q.dialog({
    title: t(`requests.confirm.${decision}.title`),
    message: t(`requests.confirm.${decision}.message`),
    cancel: true,
    ok: { label: t(`requests.confirm.${decision}.ok`), noCaps: true }
  }).onOk(async () => {
    busy.value = true
    try {
      const { data } = await adminApi.decideRequest(request.value.id, {
        decision,
        reason: reason.value.trim() || null,
        acknowledge_findings: acknowledge.value
      })
      q.notify({
        type: 'positive',
        message:
          decision === 'approved'
            ? t(
                data.online
                  ? 'requests.done.online'
                  : 'requests.done.approvedOffline'
              )
            : t(`requests.done.${decision}`)
      })
      router.push('/admin/requests')
    } catch (e) {
      q.notify({ type: 'negative', message: apiMessage(e) })
    } finally {
      busy.value = false
    }
  })
}
async function saveNote() {
  savingNote.value = true
  try {
    await adminApi.noteRequest(request.value.id, note.value)
    q.notify({ type: 'positive', message: t('requests.dossier.noteSaved') })
  } catch (e) {
    q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    savingNote.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.dossier-head {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}
.dossier-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  overflow: hidden;
  flex: 0 0 auto;
  background: var(--surface-high);
}
.dossier-title h1 {
  margin: 2px 0;
}
.dossier-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dossier-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
  gap: 16px;
  align-items: start;
}
@media (max-width: 1000px) {
  .dossier-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
.dossier-main,
.dossier-side {
  display: grid;
  gap: 16px;
}
.dossier-side {
  position: sticky;
  top: 80px;
}
@media (max-width: 1000px) {
  .dossier-side {
    position: static;
  }
}
h2 {
  font-size: 18px;
  margin: 0 0 8px;
}
h3 {
  font-size: 15px;
  margin: 12px 0 4px;
}
.pre-line {
  white-space: pre-line;
}
.dossier-shots {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.dossier-shots img {
  height: 200px;
  border-radius: 12px;
  border: 1px solid var(--outline);
}
.facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px 14px;
  margin: 12px 0 0;
  font-size: 14px;
}
.facts dt {
  color: var(--muted);
}
.facts dd {
  margin: 0;
  overflow-wrap: anywhere;
  display: grid;
}
.facts dd.changed {
  background: rgba(255, 148, 22, 0.12);
  border-radius: 6px;
  padding: 0 6px;
}
.previous {
  font-size: 12px;
  color: var(--muted);
  text-decoration: line-through;
}
.changed-note {
  display: flex;
  gap: 6px;
  align-items: center;
  color: #8a4b00;
}
.url-line {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow-wrap: anywhere;
}
.hash {
  overflow-wrap: anywhere;
  font-family: ui-monospace, monospace;
}
.analysis-list {
  margin: 4px 0 8px;
  padding-left: 18px;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
.decision-card {
  display: grid;
  gap: 10px;
}
.decision-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
