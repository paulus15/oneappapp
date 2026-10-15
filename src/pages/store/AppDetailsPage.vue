<template>
  <q-page class="details-page">
    <q-btn
      flat
      no-caps
      icon="arrow_back"
      :label="t('store.details.back')"
      class="back-btn"
      to="/"
    />

    <!-- Loading: the final layout, in skeleton form (no jump when data arrives). -->
    <div v-if="loading" class="details-shell" aria-busy="true">
      <q-skeleton class="details-cover skeleton-cover" />
      <div class="details-header glass-panel">
        <q-skeleton class="details-icon" />
        <div class="details-title">
          <q-skeleton type="text" width="50%" height="34px" />
          <q-skeleton type="text" width="30%" />
          <q-skeleton type="text" width="40%" />
        </div>
      </div>
      <div class="details-grid">
        <div class="details-main">
          <q-skeleton height="220px" class="skeleton-block" />
          <q-skeleton height="140px" class="skeleton-block" />
        </div>
        <div class="details-side">
          <q-skeleton height="180px" class="skeleton-block" />
        </div>
      </div>
    </div>

    <div v-else-if="unavailable" class="details-state glass-panel">
      <q-icon name="public_off" />
      <h1>{{ t('store.details.unavailable') }}</h1>
      <p>{{ t('store.details.unavailableHelp') }}</p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        :label="t('store.details.backToStore')"
        to="/"
      />
    </div>

    <div v-else-if="error" class="details-state glass-panel" role="alert">
      <q-icon name="error_outline" />
      <h1>{{ t('store.details.errorTitle') }}</h1>
      <p>{{ error }}</p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="t('common.retry')"
        @click="fetchAppDetails"
      />
    </div>

    <article v-else-if="app" class="details-shell">
      <div class="details-cover">
        <CoverImage
          :cover="card.cover"
          priority
          :fallback-color="card.color"
          :icon="card.icon"
          :icon-url="card.iconUrl"
          sizes="(min-width: 1320px) 1280px, 100vw"
        />
      </div>

      <header class="details-header glass-panel">
        <span class="details-icon" :style="{ background: card.color }">
          <AppIcon
            :src="app.icon_url"
            :alt="t('store.card.iconAlt', { name: app.name })"
            :fallback-icon="card.icon"
          />
        </span>
        <div class="details-title">
          <h1 class="app-title">{{ app.name }}</h1>
          <div class="dev-name">
            {{ t('store.details.publishedBy') }}
            <router-link
              v-if="app.publisher"
              :to="`/entities/${app.publisher.id}`"
              >{{ app.publisher.public_name }}</router-link
            >
            <router-link
              v-else-if="
                app.developer?.developer_profile?.status === 'verified' &&
                app.developer.developer_profile.public_name
              "
              :to="`/publishers/${app.developer.developer_profile.id}`"
              >{{ app.developer.developer_profile.public_name }}</router-link
            >
            <span v-else>{{ app.developer?.name }}</span>
          </div>
          <div class="details-chips">
            <router-link
              v-if="card.category && card.categorySlug"
              :to="`/categories/${card.categorySlug}`"
              class="details-chip"
              >{{ ui(card.category) }}</router-link
            >
            <span v-else-if="card.category" class="details-chip">{{
              ui(card.category)
            }}</span>
            <HostingBadge :source-type="app.source_type" />
            <span
              v-if="app.content_rating?.age"
              class="age-pill"
              :title="t('content.rating.notOfficial')"
              >{{ app.content_rating.age }}+</span
            >
            <span v-if="app.contains_ads" class="ads-pill">{{
              t('content.ads.badge')
            }}</span>
            <span
              v-if="declaredPermissions.length"
              class="details-chip security-chip"
            >
              <q-icon name="shield" class="q-mr-xs" />
              {{
                t(
                  'store.details.permissionsCount',
                  { n: declaredPermissions.length },
                  declaredPermissions.length
                )
              }}
            </span>
            <span v-if="card.rating" class="details-rating"
              ><q-icon name="star" />{{ card.rating }}
              <small>{{
                t('store.details.reviews', { n: card.reviews }, card.reviews)
              }}</small></span
            >
          </div>
        </div>
        <div class="details-actions">
          <q-btn
            unelevated
            no-caps
            icon="launch"
            :label="
              t(
                authStore.isAuthenticated
                  ? 'store.details.activate'
                  : 'store.details.loginToActivate'
              )
            "
            class="launch-pwa-btn"
            :disable="extracting"
            @click="launchApp"
          />
          <div class="details-secondary">
            <q-btn
              flat
              no-caps
              color="primary"
              :icon="favorited ? 'favorite' : 'favorite_border'"
              :label="
                favorited
                  ? t('store.details.inFavorites')
                  : t('store.details.addFavorite')
              "
              :class="{ 'motion-pop': popping }"
              @click="addFavorite"
            />
            <q-btn
              flat
              no-caps
              color="primary"
              icon="share"
              :label="t('store.details.share')"
              @click="share"
            />
            <ReportButton
              v-if="app.status === 'published' && !isOwnerOrAdmin"
              target-type="application"
              :target-id="app.id"
            />
            <SuggestionButton
              v-if="app.status === 'published' && !isOwnerOrAdmin"
              :app-id="app.id"
              :app-name="app.name"
            />
            <q-btn
              v-if="isOwnerOrAdmin"
              flat
              no-caps
              icon="edit"
              color="primary"
              :label="t('store.details.edit')"
              :to="`/developer/apps/${app.id}`"
            />
          </div>
        </div>
      </header>

      <div class="details-grid">
        <div class="details-main">
          <section
            v-if="screenshots.length"
            class="detail-card glass-panel"
            aria-labelledby="shots-title"
          >
            <AppScreenshots :screenshots="screenshots" :app-name="app.name" />
          </section>

          <section
            class="detail-card glass-panel"
            aria-labelledby="about-title"
          >
            <h2 id="about-title" class="section-title">{{
              t('store.details.about')
            }}</h2>
            <p v-if="app.short_description" class="lead-text">{{
              app.short_description
            }}</p>
            <p class="description-text">{{
              app.description || t('store.details.noDescription')
            }}</p>
          </section>

          <section
            v-if="info.length"
            class="detail-card glass-panel"
            aria-labelledby="info-title"
          >
            <h2 id="info-title" class="section-title">{{
              t('store.details.information')
            }}</h2>
            <dl class="info-grid">
              <div v-for="row in info" :key="row.key" class="info-row">
                <dt><q-icon :name="row.icon" />{{ row.label }}</dt>
                <dd>
                  <a
                    v-if="row.href"
                    :href="row.href"
                    :target="row.external ? '_blank' : undefined"
                    :rel="row.external ? 'noopener noreferrer' : undefined"
                    >{{ row.value
                    }}<q-icon v-if="row.external" name="open_in_new"
                  /></a>
                  <template v-else>{{ row.value }}</template>
                </dd>
              </div>
            </dl>
          </section>

          <section
            class="detail-card glass-panel"
            aria-labelledby="permissions-card-title"
          >
            <h2 id="permissions-card-title" class="section-title">
              <q-icon name="shield" color="primary" />
              {{ t('store.details.permissions') }}
            </h2>
            <p class="muted-text">{{ t('store.details.sandboxIntro') }}</p>
            <div v-if="declaredPermissions.length" class="chips q-mt-sm">
              <q-chip
                v-for="perm in declaredPermissions"
                :key="perm.key"
                dense
                :icon="perm.icon"
                class="soft-chip"
                >{{ perm.label }}</q-chip
              >
            </div>
            <p v-else class="muted-text q-mt-sm">{{
              t('store.details.noPermissions')
            }}</p>
            <template v-if="domains.length">
              <h3 class="mini-title q-mt-md">{{
                t('store.details.domains')
              }}</h3>
              <div class="chips">
                <q-chip
                  v-for="domain in domains"
                  :key="domain"
                  dense
                  icon="language"
                  class="soft-chip"
                  >{{ domain }}</q-chip
                >
              </div>
            </template>
          </section>

          <section class="detail-card glass-panel">
            <AppReviews :app="app" @changed="refreshRating" />
          </section>
        </div>

        <aside class="details-side">
          <section class="detail-card glass-panel install-card">
            <h2 class="section-title">{{ t('store.details.install') }}</h2>
            <p>{{
              t(
                'store.details.activationCount',
                { n: Number(app.activations_count || 0) },
                Number(app.activations_count || 0)
              )
            }}</p>
            <p class="text-caption">{{ t('store.details.activationHelp') }}</p>
            <p v-if="latestVersion" class="install-version">{{
              t('store.details.version', {
                version: latestVersion.version_number
              })
            }}</p>
            <div v-if="isInstalled" class="installed-badge q-mb-sm">
              <q-icon name="check_circle" color="positive" size="18px" />
              <span>{{ t('store.details.installedOnDevice') }}</span>
            </div>
            <q-btn
              v-if="app.status === 'published'"
              unelevated
              no-caps
              :icon="isInstalled ? 'open_in_new' : 'add_to_home_screen'"
              :label="
                isInstalled
                  ? t('store.details.openInstalledApp')
                  : t(
                      authStore.isAuthenticated
                        ? 'store.details.activate'
                        : 'store.details.loginToActivate'
                    )
              "
              class="full-width install-pwa-btn"
              :class="{ 'installed-active-btn': isInstalled }"
              :loading="extracting"
              @click="launchApp"
            />
            <q-btn
              v-if="
                !isInstalled &&
                app.status === 'published' &&
                (app.source_type === 'url' ||
                  latestVersion?.status === 'active')
              "
              flat
              no-caps
              class="full-width"
              :label="t('store.details.declareInstalled')"
              @click="confirmInstallation"
            />
            <p class="install-note">{{ t('store.details.installNote') }}</p>
            <div v-if="latestVersion" class="pwa-install-info">
              <q-icon name="info" />
              <span>{{ t('store.details.pwaInfo') }}</span>
            </div>
            <div v-if="latestVersion?.hash_sha256" class="hash-box">
              SHA256: {{ latestVersion.hash_sha256.substring(0, 16) }}…
            </div>
          </section>

          <section class="detail-card glass-panel">
            <h2 class="section-title"
              ><q-icon name="shield" /> {{ t('store.details.sandbox') }}</h2
            >
            <p class="muted-text">{{ t('store.details.sandboxIntro') }}</p>
            <h3 class="mini-title">{{ t('store.details.permissions') }}</h3>
            <div v-if="declaredPermissions.length" class="chips">
              <q-chip
                v-for="perm in declaredPermissions"
                :key="perm.key"
                dense
                :icon="perm.icon"
                class="soft-chip"
                >{{ perm.label }}</q-chip
              >
            </div>
            <p v-else class="muted-text">{{
              t('store.details.noPermissions')
            }}</p>
            <h3 class="mini-title">{{ t('store.details.domains') }}</h3>
            <div v-if="domains.length" class="chips">
              <q-chip
                v-for="domain in domains"
                :key="domain"
                dense
                icon="language"
                class="soft-chip"
                >{{ domain }}</q-chip
              >
            </div>
            <p v-else class="muted-text">{{ t('store.details.noDomains') }}</p>
          </section>

          <section class="detail-card glass-panel">
            <h2 class="section-title">{{ t('store.details.versions') }}</h2>
            <q-list v-if="app.versions?.length" separator>
              <q-item
                v-for="ver in app.versions"
                :key="ver.id"
                class="q-px-none"
              >
                <q-item-section>
                  <q-item-label class="version-number"
                    >v{{ ver.version_number }}</q-item-label
                  >
                  <q-item-label caption>{{
                    formatDate(ver.created_at)
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    icon="download"
                    :aria-label="
                      t('store.details.download', {
                        version: ver.version_number
                      })
                    "
                    @click="downloadVersion(ver.id)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <p v-else class="muted-text">{{ t('store.details.noVersions') }}</p>
          </section>
        </aside>
      </div>

      <AppRow
        :title="t('store.details.similar')"
        :apps="similar"
        class="similar-row"
      />
    </article>

    <q-dialog v-model="extracting" persistent>
      <q-card class="extraction-dialog">
        <q-card-section class="column items-center q-gutter-md">
          <q-spinner-orbit color="primary" size="lg" />
          <div class="text-h6 text-weight-bold text-center">{{
            t('store.details.opening')
          }}</div>
          <div class="extraction-caption text-caption text-center">{{
            t('store.details.openingHelp')
          }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { usePageSeo } from '@/composables/usePageSeo'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { api } from '@/boot/axios'
import AppIcon from '@/components/AppIcon.vue'
import AppReviews from '@/components/AppReviews.vue'
import AppRow from '@/components/AppRow.vue'
import CoverImage from '@/components/CoverImage.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import ReportButton from '@/components/ReportButton.vue'
import AppScreenshots from '@/components/AppScreenshots.vue'
import SuggestionButton from '@/components/SuggestionButton.vue'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
import { ui } from '@/i18n/text'
import { permissionInfo } from '@/utils/appPermissions'
import { canWebInstall, webInstall } from '@/utils/webInstall'
import { catalogApi } from '@/services/catalog'
import { communityApi } from '@/services/community'
import { campaignApi } from '@/services/growth'
import { toCard } from '@/utils/appCard'
import { deviceIdentity, devicePlatform } from '@/utils/device'
import {
  compatibilityKeys,
  countryCodes,
  displayName,
  safeEmail,
  safeExternalUrl
} from '@/utils/listing'
import { resolveMediaUrl } from '@/utils/media'
import {
  campaignFor,
  forgetCampaign,
  isCampaignToken,
  rememberCampaign
} from '@/utils/growth'
import { useAuthStore } from '@/stores/auth'

const { t, te, locale } = useI18n()
const { isMobile } = useWorkspaceAccess()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const app = ref(null)
const loading = ref(true)
const error = ref('')
const unavailable = ref(false)
const extracting = ref(false)
const similar = ref([])
const favorited = ref(false),
  popping = ref(false)
const localInstalled = ref(false)

const isInstalled = computed(() => {
  if (app.value?.is_installed) return true
  if (localInstalled.value) return true
  try {
    return localStorage.getItem(`pwa-installed-${route.params.id}`) === '1'
  } catch {
    return false
  }
})

usePageSeo(() => ({
  ...(app.value && !loading.value
    ? {
        title: `${app.value.name} — Application PWA | PWAStore`,
        description: app.value.short_description || app.value.description,
        name: app.value.name
      }
    : {}),
  noindex:
    !!error.value ||
    unavailable.value ||
    (!!app.value && app.value.status !== 'published')
}))

const card = computed(() => (app.value ? toCard(app.value) : {}))

function extractPermissions(appData, versionData) {
  // Approved declaration only: pending changes and the code analysis are not public.
  const p = appData?.permissions ?? versionData?.permissions_required ?? []
  if (Array.isArray(p)) return p
  if (typeof p === 'string') {
    try {
      const parsed = JSON.parse(p)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return p
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return []
}

// Declared on the listing; builds published before that kept them on the version.
const declaredPermissions = computed(() =>
  extractPermissions(app.value, latestVersion.value).map(permissionInfo)
)
const latestVersion = computed(() => {
  if (!app.value?.versions || app.value.versions.length === 0) return null
  return (
    app.value.versions.find(v => v.status === 'active') || app.value.versions[0]
  )
})

const domains = computed(
  () =>
    latestVersion.value?.detected_domains ||
    latestVersion.value?.domains_whitelist ||
    []
)

const isOwnerOrAdmin = computed(() => {
  if (isMobile.value || !authStore.isAuthenticated || !app.value) return false
  return (
    authStore.user?.id === app.value.developer_id ||
    authStore.user?.role === 'admin'
  )
})

const screenshots = computed(() => {
  const shots = app.value?.media?.screenshots || {}
  return ['mobile', 'tablet'].flatMap(device =>
    (Array.isArray(shots[device]) ? shots[device] : [])
      .map((src, i) => ({
        key: `${device}-${i}`,
        device,
        src: resolveMediaUrl(src)
      }))
      .filter(shot => shot.src)
  )
})

const MAX_COUNTRIES = 8
// The "Informations" block: only what the publisher declared, nothing guessed.
const info = computed(() => {
  const a = app.value
  if (!a) return []
  const rows = []
  const add = (key, icon, value, href = '', external = false) => {
    if (value)
      rows.push({
        key,
        icon,
        label: t(`store.details.info.${key}`),
        value,
        href,
        external
      })
  }
  add('version', 'update', latestVersion.value?.version_number)
  add(
    'category',
    'category',
    card.value.category ? ui(card.value.category) : ''
  )
  const languages = (Array.isArray(a.languages) ? a.languages : [])
    .map(code => displayName(code, locale.value, 'language'))
    .filter(Boolean)
  add('languages', 'translate', languages.join(', '))
  const countries = countryCodes(a.countries)
  if (countries.length && a.availability !== 'all') {
    const names = countries
      .slice(0, MAX_COUNTRIES)
      .map(code => displayName(code, locale.value, 'region'))
    const more = countries.length - MAX_COUNTRIES
    add(
      'availability',
      'public',
      more > 0
        ? `${names.join(', ')} ${t('store.details.moreCountries', { n: more }, more)}`
        : names.join(', ')
    )
  } else if (a.availability === 'all' || Array.isArray(a.countries))
    add('availability', 'public', t('store.details.allCountries'))
  if (a.content_rating?.age) {
    const descriptors = [
      ...(a.content_rating.descriptors || []).map(d => d.split('.')[0]),
      ...(a.content_rating.interactive || [])
    ]
      .filter(key => te(`content.rating.descriptor.${key}`))
      .map(key => t(`content.rating.descriptor.${key}`))
    add(
      'rating',
      'verified_user',
      [`${a.content_rating.age}+`, ...descriptors].join(' · ')
    )
  }
  if (typeof a.contains_ads === 'boolean')
    add(
      'ads',
      'campaign',
      a.contains_ads ? t('content.ads.badge') : t('store.details.noAds')
    )
  const collected = a.privacy?.data_collected
  if (Array.isArray(collected)) {
    const labels = collected
      .filter(code => code !== 'none' && te(`workspace.data.${code}`))
      .map(code => t(`workspace.data.${code}`))
    add(
      'dataCollected',
      'privacy_tip',
      labels.length ? labels.join(', ') : t('store.details.noDataCollected')
    )
  }
  const compat = compatibilityKeys(a.compatibility)
    .filter(key => te(`workspace.compatibility.${key}`))
    .map(key => t(`workspace.compatibility.${key}`))
  add('compatibility', 'devices', compat.join(', '))
  const email = safeEmail(a.contact_email)
  add('contact', 'mail', email, email ? `mailto:${email}` : '')
  for (const [key, icon, field] of [
    ['support', 'support_agent', 'support_url'],
    ['privacyPolicy', 'policy', 'privacy_policy_url'],
    ['terms', 'gavel', 'terms_url']
  ]) {
    const url = safeExternalUrl(a[field])
    if (url) add(key, icon, new URL(url).host, url, true)
  }
  return rows
})

// Share-link attribution (?c=<token>): the visit is counted once, the token is kept for
// this app only (session storage), then removed from the address bar without a reload.
let pendingCampaign = null
const visitedCampaigns = new Set()
function captureCampaign() {
  const query = route.query || {}
  if (!Object.hasOwn(query, 'c')) return
  const { c: token, ...rest } = query
  Promise.resolve(
    router.replace({ path: route.path, query: rest, hash: route.hash })
  ).catch(() => {})
  const routeId = String(route.params.id || '')
  if (!routeId || !isCampaignToken(token) || visitedCampaigns.has(token)) return
  visitedCampaigns.add(token)
  pendingCampaign = {
    routeId,
    token,
    settled: null,
    visit: campaignApi
      .visit(token)
      .then(({ data }) => ({ ok: true, appId: data?.application_id }))
      .catch(e => ({ ok: e?.response?.status !== 404 }))
  }
}

// Keeps the token only when the server confirms it belongs to the app shown here.
// Shared by the view and the "Ouvrir" requests: the check runs once per token.
function settleCampaign(appId) {
  const pending = pendingCampaign
  if (!pending || pending.routeId !== String(route.params.id || ''))
    return Promise.resolve()
  pending.settled ||= pending.visit.then(result => {
    const sameApp =
      result.appId === undefined ||
      result.appId === null ||
      String(result.appId) === String(appId)
    if (result.ok && sameApp) rememberCampaign(appId, pending.token)
    else if (campaignFor(appId) === pending.token) forgetCampaign(appId)
  })
  return pending.settled
}

// "Ouvrir" waits for a visit still in flight, but never more than a moment.
function settleCampaignWithin(appId, ms = 1500) {
  let timer
  return Promise.race([
    settleCampaign(appId).catch(() => {}),
    new Promise(resolve => (timer = setTimeout(resolve, ms)))
  ]).finally(() => clearTimeout(timer))
}

// Optional request body carrying the campaign of this app, if any.
const campaignBody = appId => {
  const campaign = campaignFor(appId)
  return campaign ? [{ campaign }] : []
}

async function recordAttributedView(appId) {
  try {
    await settleCampaign(appId)
  } catch {
    // Attribution is best effort; the view is still recorded.
  }
  communityApi
    .recordView(appId, campaignFor(appId) || undefined)
    .catch(() => {})
}

async function fetchAppDetails() {
  captureCampaign()
  loading.value = true
  error.value = ''
  unavailable.value = false
  // The page is reused when moving to a similar app: never carry the previous one's state.
  localInstalled.value = false
  try {
    const device = deviceIdentity()
    const response = await api.get('/apps/' + route.params.id, {
      // In a header, not the URL: addresses end up in server logs.
      headers: device ? { 'X-Device-Id': device } : {}
    })
    app.value = response.data
    if (app.value?.is_installed) {
      localInstalled.value = true
      try {
        localStorage.setItem(`pwa-installed-${app.value.id}`, '1')
      } catch {}
    }
    similar.value = []
    if (app.value.status === 'published') {
      void recordAttributedView(app.value.id)
      catalogApi
        .similar(app.value.id)
        .then(({ data }) => (similar.value = Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  } catch (err) {
    app.value = null
    const message = err.response?.data?.message || ''
    // Country restriction (CountryAvailability): a friendly state, not an error.
    if (err.response?.status === 403 && /pays|country/i.test(message))
      unavailable.value = true
    else error.value = message || t('store.details.loadError')
  } finally {
    loading.value = false
  }
}

async function refreshRating() {
  try {
    const { data } = await api.get('/apps/' + route.params.id)
    app.value.average_rating = data.average_rating
    app.value.reviews_count = data.reviews_count
  } catch {
    // The reviews list already shows the change; the header refreshes next visit.
  }
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function confirmInstallation() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  $q.dialog({
    title: t('store.details.installDialog.title'),
    message: t('store.details.installDialog.message'),
    cancel: true
  }).onOk(async () => {
    try {
      const device = deviceIdentity()
      if (!device) throw new Error(t('store.details.noStorage'))
      await api.post('/installations', {
        application_id: app.value.id,
        app_version_id:
          app.value.source_type === 'url' ? null : latestVersion.value?.id,
        device_uuid: device,
        platform: devicePlatform(),
        status: 'installed',
        metadata: { source: 'user_confirmation' }
      })
      $q.notify({ type: 'positive', message: t('store.details.installSaved') })
      localInstalled.value = true
      try {
        localStorage.setItem(`pwa-installed-${app.value.id}`, '1')
      } catch {}
      if (app.value) app.value.is_installed = true
    } catch (e) {
      $q.notify({
        type: 'negative',
        message:
          e.response?.data?.message ||
          e.message ||
          t('store.details.installFailed')
      })
    }
  })
}

async function downloadVersion(id) {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    const { data } = await api.get(`/versions/${id}/download`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data),
      link = document.createElement('a')
    link.href = url
    link.download = `${app.value.identifier || 'application'}-${id}.zip`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    const device = deviceIdentity()
    if (
      authStore.isAuthenticated &&
      device &&
      app.value.status === 'published'
    ) {
      try {
        await api.post('/installations', {
          application_id: app.value.id,
          app_version_id: id,
          device_uuid: device,
          platform: devicePlatform(),
          status: 'downloaded',
          metadata: { source: 'store_download' }
        })
      } catch {
        $q.notify({
          type: 'warning',
          message: t('store.details.downloadNotSaved')
        })
      }
    }
  } catch {
    $q.notify({ type: 'negative', message: t('store.details.downloadFailed') })
  }
}

function signInToActivate() {
  return router.push({ path: '/login', query: { redirect: route.fullPath } })
}

async function launchApp() {
  if (!authStore.isAuthenticated) {
    await signInToActivate()
    return
  }
  if (extracting.value) return
  // Supporting browsers install the app from here, with their own prompt: no redirection.
  if (!isInstalled.value && canWebInstall(app.value.web_install)) {
    await installFromStore()
    return
  }
  await openApp()
}

async function installFromStore() {
  extracting.value = true
  try {
    // First call after the click, so the browser still sees the user's gesture.
    const outcome = await webInstall(app.value.web_install)
    if (outcome === 'installed') {
      await recordWebInstall()
      $q.notify({
        type: 'positive',
        message: ui('{app} est installée sur cet appareil.', {
          app: app.value.name
        })
      })
    } else if (outcome === 'cancelled') {
      $q.notify({ type: 'info', message: ui('Installation annulée.') })
    } else {
      // Not installable from here (manifest changed, browser policy…): offer the usual link.
      $q.notify({
        type: 'warning',
        message: ui(
          'L’installation directe n’est pas possible pour cette application.'
        ),
        actions: [
          {
            label: ui('Ouvrir l’application'),
            color: 'white',
            handler: openApp
          }
        ]
      })
    }
  } finally {
    extracting.value = false
  }
}

// Counted like an activation, and saved as an installation confirmed by the browser.
async function recordWebInstall() {
  localInstalled.value = true
  app.value.is_installed = true
  try {
    localStorage.setItem(`pwa-installed-${app.value.id}`, '1')
  } catch {}
  try {
    await settleCampaignWithin(app.value.id)
    const { data } = await api.post(
      `/apps/${app.value.id}/activate`,
      ...campaignBody(app.value.id)
    )
    app.value.activations_count = data.activations_count
    const device = deviceIdentity()
    if (device)
      await api.post('/installations', {
        application_id: app.value.id,
        app_version_id: null,
        device_uuid: device,
        platform: devicePlatform(),
        status: 'installed',
        metadata: { source: 'web_install' }
      })
  } catch {
    // The app is installed; only the statistics missed this one.
  }
}

async function openApp() {
  if (extracting.value) return
  extracting.value = true
  // Open synchronously to preserve the user's browser gesture.
  const target = window.open('about:blank', '_blank')
  if (target) target.opener = null
  try {
    await settleCampaignWithin(app.value.id)
    const { data } = await api.post(
      `/apps/${app.value.id}/activate`,
      ...campaignBody(app.value.id)
    )
    const url = new URL(data.url)
    if (url.protocol !== 'https:')
      throw new Error(t('store.details.unsafeLaunch'))
    app.value.activations_count = data.activations_count
    if (target) target.location.replace(url.href)
    else window.location.assign(url.href)
  } catch (err) {
    target?.close()
    if (err.response?.status === 401) {
      authStore.clearSession()
      await signInToActivate()
      return
    }
    $q.notify({
      type: 'negative',
      message:
        err.response?.data?.message ||
        err.message ||
        t('store.details.launchFailed')
    })
  } finally {
    extracting.value = false
  }
}

async function addFavorite() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await api.put(`/favorites/${app.value.id}`)
    favorited.value = true
    popping.value = true
    setTimeout(() => (popping.value = false), 450)
    $q.notify({ type: 'positive', message: t('store.details.favoriteAdded') })
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: e.response?.data?.message || t('store.details.favoriteFailed')
    })
  }
}

async function share() {
  const data = {
    title: app.value.name,
    text:
      app.value.short_description ||
      t('store.details.shareText', { name: app.value.name }),
    url: window.location.href
  }
  try {
    if (navigator.share) {
      await navigator.share(data)
      return
    }
    await navigator.clipboard.writeText(data.url)
    $q.notify({ type: 'positive', message: t('store.details.linkCopied') })
  } catch (e) {
    // Closing the share sheet is not an error worth reporting.
    if (e?.name !== 'AbortError')
      $q.notify({ type: 'negative', message: t('store.details.shareFailed') })
  }
}

// Coming back to the tab after installing: at most one check every 30 seconds.
let lastFocusCheck = 0
async function checkInstallOnFocus() {
  if (!app.value?.id || isInstalled.value) return
  if (Date.now() - lastFocusCheck < 30000) return
  lastFocusCheck = Date.now()
  try {
    const device = deviceIdentity()
    const { data } = await api.get('/apps/' + app.value.id, {
      // In a header, not the URL: addresses end up in server logs.
      headers: device ? { 'X-Device-Id': device } : {}
    })
    if (data.is_installed) {
      app.value.is_installed = true
      localInstalled.value = true
      try {
        localStorage.setItem(`pwa-installed-${app.value.id}`, '1')
      } catch {}
    }
  } catch {}
}

onMounted(() => {
  fetchAppDetails()
  window.addEventListener('focus', checkInstallOnFocus)
})
onBeforeUnmount(() => {
  window.removeEventListener('focus', checkInstallOnFocus)
})
watch(
  () => [route.params.id, route.query?.c],
  ([id, token], [previous]) => {
    if (id && id !== previous) {
      // A visit still checking for the previous app must not carry over.
      pendingCampaign = null
      fetchAppDetails()
    } else if (token !== undefined) {
      // Same app, new share link (?c= changed without leaving the page).
      captureCampaign()
      if (app.value?.id) void settleCampaign(app.value.id)
    }
  }
)
</script>

<style scoped lang="scss">
.details-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 12px var(--ui-page-gutter) 32px;
  overflow-x: clip;
  color: var(--text);
  background: var(--page);
}
.back-btn {
  margin-bottom: 8px;
  color: var(--pwa-link);
}
.details-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.details-cover {
  overflow: hidden;
  max-height: 420px;
  border-radius: var(--ui-radius-lg);
  box-shadow: var(--ui-shadow-sm);
}
.details-cover :deep(.cover-image) {
  max-height: 420px;
}
.skeleton-cover {
  aspect-ratio: 16 / 9;
  height: auto;
}
.details-header {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin: -64px 16px 0;
  padding: 16px 18px;
  border-radius: var(--ui-radius-lg);
  background: var(--surface-low);
  box-shadow: var(--ui-shadow-md);
}
.details-icon {
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--pwa-on-primary);
  border-radius: 22px;
  box-shadow: 0 12px 26px rgba(2, 5, 20, 0.22);
}
.details-icon :deep(.q-icon) {
  font-size: 40px;
}
.details-title {
  min-width: 0;
}
.app-title {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
}
.dev-name {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}
.dev-name a {
  color: var(--pwa-link);
  font-weight: 650;
  text-decoration: none;
}
.details-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.details-chip {
  padding: 2px 10px;
  color: var(--text);
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  text-decoration: none;
}
a.details-chip:hover {
  color: var(--pwa-link);
}
.details-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 700;
}
.details-rating .q-icon {
  color: var(--pwa-accent);
}
.details-rating small {
  color: var(--muted);
  font-weight: 500;
}
.details-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.details-secondary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.launch-pwa-btn {
  min-width: 200px;
  min-height: 44px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 999px;
  font-weight: 750;
  box-shadow: 0 6px 18px rgba(var(--pwa-primary-rgb), 0.32);
}
.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
  gap: 16px;
}
.details-main,
.details-side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-card {
  min-width: 0;
  padding: clamp(14px, 1.6vw, 20px);
  border-radius: var(--ui-radius-lg);
}
.skeleton-block {
  border-radius: var(--ui-radius-lg);
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 750;
}
.mini-title {
  margin: 12px 0 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.lead-text {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}
.description-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.muted-text {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
.screenshot-card {
  margin: 0;
  overflow: hidden;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 14px;
}
.screenshot-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shot-mobile {
  width: clamp(140px, 36vw, 200px);
  aspect-ratio: 9 / 19.5;
}
.shot-tablet {
  width: clamp(240px, 64vw, 420px);
  aspect-ratio: 4 / 3;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px 20px;
  margin: 0;
}
.info-row {
  min-width: 0;
}
.info-row dt {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}
.info-row dt .q-icon {
  font-size: 16px;
}
.info-row dd {
  margin: 2px 0 0 22px;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.info-row a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--pwa-link);
  text-decoration: none;
}
.info-row a .q-icon {
  font-size: 14px;
}
.install-version {
  margin: -6px 0 10px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 650;
}
.install-pwa-btn {
  margin-bottom: 6px;
  color: var(--pwa-on-primary);
  background: #16a34a;
  font-weight: 700;
}
.install-note {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.installed-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  font-size: 13px;
  font-weight: 600;
  width: fit-content;
}
.installed-active-btn {
  background: var(--primary) !important;
  color: white !important;
}
.pwa-install-info {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  color: var(--muted);
  background: rgba(var(--pwa-primary-rgb), 0.08);
  border: 1px solid rgba(var(--pwa-primary-rgb), 0.2);
  border-radius: 12px;
  font-size: 12px;
}
.hash-box {
  margin-top: 10px;
  padding: 6px 10px;
  overflow: hidden;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 6px;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.soft-chip {
  margin: 0;
  color: var(--text);
  background: var(--surface-high);
}
.version-number {
  font-weight: 700;
}
.similar-row {
  margin-top: 12px;
}
.details-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 560px;
  margin: 32px auto;
  padding: 36px 20px;
  color: var(--muted);
  text-align: center;
  border-radius: var(--ui-radius-lg);
}
.details-state > .q-icon {
  color: var(--pwa-link);
  font-size: 44px;
}
.details-state h1 {
  margin: 0;
  color: var(--text);
  font-size: 22px;
  line-height: 1.3;
}
.details-state p {
  margin: 0 0 8px;
}
.extraction-dialog {
  min-width: 300px;
  padding: 16px;
  color: var(--pwa-text);
  background: var(--pwa-surface);
  border-radius: 16px;
}
.extraction-caption {
  color: var(--pwa-muted);
}
@media (max-width: 1023px) {
  .details-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .details-header {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .details-actions {
    grid-column: 1 / -1;
    align-items: stretch;
  }
  .details-secondary {
    justify-content: flex-start;
  }
}
@media (max-width: 599px) {
  .details-cover {
    border-radius: var(--ui-radius-md);
  }
  .details-header {
    gap: 12px;
    margin: -36px 8px 0;
    padding: 14px;
  }
  .details-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
  }
  .launch-pwa-btn {
    width: 100%;
    min-width: 0;
  }
}
.age-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: var(--q-primary);
  cursor: help;
}
.ads-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  border: 1px solid var(--outline);
}
</style>
