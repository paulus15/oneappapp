<template>
  <q-page class="home-page">
    <main ref="motionRoot" class="home-content">
      <section
        class="hero-panel"
        :class="{ 'hero-intro': intro }"
        aria-labelledby="hero-title"
      >
        <div class="hero-orb hero-orb-one" />
        <div class="hero-orb hero-orb-two" />
        <div class="hero-copy">
          <span class="eyebrow"
            ><q-icon name="auto_awesome" /> {{ t('store.hero.eyebrow') }}</span
          >
          <h1 id="hero-title">
            <span class="line"
              ><span class="line-inner">{{ t('store.hero.line1') }}</span></span
            >
            <span class="line"
              ><span class="line-inner">{{ t('store.hero.line2') }}</span></span
            >
          </h1>
          <p>{{ t('store.hero.lead') }}</p>
          <div class="hero-actions">
            <q-btn
              unelevated
              no-caps
              :label="t('store.hero.explore')"
              to="/applications"
              class="primary-cta"
            />
            <q-btn
              v-if="!isMobile"
              outline
              no-caps
              :label="t('store.hero.becomeDeveloper')"
              to="/developer/activate"
              class="secondary-cta"
            />
          </div>
        </div>

        <div class="device-scene" aria-hidden="true">
          <div v-if="home?.latest?.length" class="floating-apps">
            <div
              v-for="entry in home.latest.slice(0, 3)"
              :key="entry.id"
              class="floating-app"
            >
              <q-icon name="apps" /><span>{{ entry.name }}</span>
            </div>
          </div>
          <span class="platform-badge android"><q-icon name="android" /></span>
          <span class="platform-badge web"><q-icon name="language" /></span>
          <span class="platform-badge apps"><q-icon name="apps" /></span>
          <span class="platform-badge windows"><q-icon name="window" /></span>
          <div class="phone-wrap">
            <div class="phone-card">
              <span class="phone-speaker" />
              <span class="install-ring" />
              <img
                class="hero-brand-icon"
                src="/brand/pwa-store-icon.png"
                width="180"
                height="180"
                alt=""
              />
              <strong>PWA Store</strong>
              <small
                >{{ t('store.hero.phone1') }}<br />{{
                  t('store.hero.phone2')
                }}</small
              >
            </div>
          </div>
        </div>
        <div class="hero-dots" aria-hidden="true"><i /><i /><i /><i /></div>
      </section>

      <!-- Search results (?search=) -->
      <template v-if="activeSearch">
        <div class="search-notice">
          <span>{{
            t('store.search.resultsFor', { query: activeSearch })
          }}</span>
          <q-btn
            flat
            round
            dense
            icon="close"
            :aria-label="t('store.search.clear')"
            @click="clearSearch"
          />
        </div>

        <div class="filter-bar-panel glass-panel">
          <div class="filter-controls">
            <q-select
              v-model="selectedPlatform"
              :options="platformOptions"
              :label="t('store.filters.platform')"
              dense
              outlined
              emit-value
              map-options
              class="filter-select"
            >
              <template #prepend><q-icon name="devices" size="xs" /></template>
            </q-select>
            <q-select
              v-model="selectedPriceType"
              :options="priceOptions"
              :label="t('store.filters.price')"
              dense
              outlined
              emit-value
              map-options
              class="filter-select"
            >
              <template #prepend><q-icon name="payments" size="xs" /></template>
            </q-select>
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              :label="t('store.filters.sort')"
              dense
              outlined
              emit-value
              map-options
              class="filter-select"
            >
              <template #prepend><q-icon name="sort" size="xs" /></template>
            </q-select>
          </div>
          <q-btn
            v-if="selectedPlatform || selectedPriceType || sortBy !== 'latest'"
            flat
            dense
            no-caps
            :label="t('store.filters.reset')"
            icon="refresh"
            color="primary"
            @click="resetFilters"
          />
        </div>

        <section class="home-section" aria-labelledby="results-title">
          <header class="section-heading">
            <div>
              <span class="section-kicker">{{ t('store.search.kicker') }}</span>
              <h2 id="results-title">{{
                t('store.search.count', { n: total }, total)
              }}</h2>
            </div>
          </header>
          <AppGrid
            :apps="rawApps"
            :loading="loading"
            :empty="t('store.search.empty')"
            empty-icon="search_off"
          />
        </section>
      </template>

      <!-- Discover -->
      <template v-else>
        <AppRow
          id="featured"
          variant="featured"
          priority
          :title="t('store.home.featured')"
          :kicker="t('store.home.featuredKicker')"
          :apps="sections.featured"
          :loading="pending"
        />
        <AppRow
          id="trending"
          :title="t('store.home.trending')"
          :kicker="t('store.home.trendingKicker')"
          to="/rankings?type=trending"
          :apps="sections.trending"
          :loading="pending"
        />
        <AppRow
          id="latest"
          :title="t('store.home.latest')"
          :kicker="t('store.home.latestKicker')"
          to="/rankings?type=new"
          :apps="sections.latest"
          :loading="pending"
        />
        <AppRow
          id="recommended"
          :title="t('store.home.recommended')"
          :kicker="t('store.home.recommendedKicker')"
          to="/recommended"
          :apps="sections.recommended"
          :loading="pending"
        />
        <AppRow
          v-for="collection in sections.collections"
          :key="collection.id"
          :title="collection.title"
          :kicker="t('store.home.collectionKicker')"
          :to="`/collections/${collection.slug}`"
          :apps="collection.applications || []"
        />

        <section
          v-if="pending || sections.categories.length"
          id="categories"
          class="home-section"
          aria-labelledby="categories-title"
        >
          <header class="section-heading">
            <div>
              <span class="section-kicker">{{
                t('store.home.categoriesKicker')
              }}</span>
              <h2 id="categories-title">{{ t('store.home.categories') }}</h2>
            </div>
            <router-link
              to="/categories"
              :aria-label="
                t('store.row.seeAllOf', { title: t('store.home.categories') })
              "
              >{{ t('store.row.seeAll') }} <q-icon name="arrow_forward"
            /></router-link>
          </header>
          <div v-if="pending" class="category-tiles">
            <q-skeleton
              v-for="n in 4"
              :key="n"
              height="68px"
              class="tile-skeleton"
            />
          </div>
          <div v-else class="category-tiles">
            <CategoryTile
              v-for="category in sections.categories"
              :key="category.id"
              :category="category"
            />
          </div>
        </section>

        <section
          v-if="sections.discover.length"
          id="discover"
          class="home-section"
          aria-labelledby="discover-title"
        >
          <header class="section-heading">
            <div>
              <span class="section-kicker">{{
                t('store.home.discoverKicker')
              }}</span>
              <h2 id="discover-title">{{ t('store.home.discover') }}</h2>
            </div>
            <router-link
              to="/applications"
              :aria-label="
                t('store.row.seeAllOf', { title: t('store.home.discover') })
              "
              >{{ t('store.row.seeAll') }} <q-icon name="arrow_forward"
            /></router-link>
          </header>
          <AppGrid :apps="sections.discover" />
        </section>

        <div v-if="home && !hasApps" class="home-empty glass-panel">
          <q-icon name="storefront" />
          <h2>{{ t('store.home.emptyTitle') }}</h2>
          <p>{{ t('store.home.emptyText') }}</p>
        </div>

        <section v-if="!isMobile" id="business" class="developer-band">
          <q-icon name="developer_mode" class="developer-watermark" />
          <div>
            <h2>{{ t('store.home.developerTitle') }}</h2>
            <p>{{ t('store.home.developerText') }}</p>
          </div>
          <div class="developer-actions">
            <q-btn
              unelevated
              no-caps
              :label="t('store.hero.becomeDeveloper')"
              to="/developer/activate"
            />
            <q-btn
              flat
              no-caps
              :label="t('store.home.learnMore')"
              to="/developers"
            />
          </div>
        </section>
      </template>

      <section
        id="features"
        class="feature-grid"
        :aria-label="t('store.features.label')"
      >
        <article
          v-for="feature in features"
          :key="feature.key"
          class="glass-panel feature-card"
        >
          <q-icon :name="feature.icon" :style="{ color: feature.color }" />
          <h3>{{ t(`store.features.${feature.key}.title`) }}</h3>
          <p>{{ t(`store.features.${feature.key}.text`) }}</p>
        </article>
      </section>
    </main>

    <AppFooter />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppFooter from '@/components/AppFooter.vue'
import AppGrid from '@/components/AppGrid.vue'
import AppRow from '@/components/AppRow.vue'
import CategoryTile from '@/components/CategoryTile.vue'
import { useHeroIntro } from '@/composables/useHeroIntro'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
import { catalogApi } from '@/services/catalog'

const { t } = useI18n()
const { isMobile } = useWorkspaceAccess()
const motionRoot = ref(null)
const { intro } = useHeroIntro(motionRoot)
const route = useRoute()
const router = useRouter()
const activeSearch = computed(() => String(route.query.search || '').trim())

const home = ref(null)
const homeLoading = ref(true)
const pending = computed(() => !home.value && homeLoading.value)

const rawApps = ref([])
const total = ref(0)
const loading = ref(false)
const selectedPriceType = ref('')
const selectedPlatform = ref('')
const sortBy = ref('latest')

const platformOptions = computed(() => [
  { label: t('store.filters.allPlatforms'), value: '' },
  { label: 'Web / PWA', value: 'web' },
  { label: 'Android', value: 'android' },
  { label: 'Windows', value: 'windows' },
  { label: 'iOS', value: 'ios' }
])
const priceOptions = computed(() => [
  { label: t('store.filters.allPrices'), value: '' },
  { label: t('store.filters.free'), value: 'free' },
  { label: t('store.filters.paid'), value: 'paid' }
])
const sortOptions = computed(() =>
  ['latest', 'downloads', 'rating', 'price_asc', 'price_desc'].map(value => ({
    label: t(`store.sort.${value}`),
    value
  }))
)

const list = value => (Array.isArray(value) ? value : [])
const uniqueApps = (...groups) => {
  const seen = new Set()
  return groups.flat().filter(app => {
    if (!app || seen.has(app.id)) return false
    seen.add(app.id)
    return true
  })
}

// Only what /home returns. Older APIs have no `trending` / `recommended`: popular stands in
// for the first, and the second stays hidden rather than repeating the same row.
const sections = computed(() => {
  const data = home.value || {}
  const popular = list(data.popular)
  const trending = data.trending ? list(data.trending) : popular
  const recommended = data.recommended
    ? list(data.recommended)
    : data.trending
      ? popular
      : []
  const featured = list(data.featured).length
    ? list(data.featured)
    : list(data.latest).slice(0, 6)
  const categories = [...list(data.categories)]
    .filter(c => c?.slug)
    .sort(
      (a, b) =>
        Number(b.applications_count || 0) - Number(a.applications_count || 0)
    )
    .slice(0, 8)
  return {
    featured,
    trending,
    latest: list(data.latest),
    recommended,
    collections: list(data.collections).filter(
      c => list(c.applications).length
    ),
    categories,
    discover: uniqueApps(
      list(data.recently_updated),
      popular,
      list(data.latest)
    ).slice(0, 12)
  }
})
const hasApps = computed(() =>
  ['featured', 'trending', 'latest', 'recommended', 'discover'].some(
    key => sections.value[key].length
  )
)

async function loadHome() {
  homeLoading.value = true
  try {
    home.value = (await catalogApi.home()).data || {}
  } catch (err) {
    console.error('Error fetching home sections', err)
    home.value = {}
  } finally {
    homeLoading.value = false
  }
}

async function fetchApps() {
  if (!activeSearch.value) return
  loading.value = true
  try {
    const params = { sort_by: sortBy.value, search: activeSearch.value }
    if (selectedPriceType.value) params.price_type = selectedPriceType.value
    if (selectedPlatform.value) params.platform = selectedPlatform.value
    const { data } = await catalogApi.apps(params)
    rawApps.value = list(data?.data)
    total.value = Number(data?.total ?? rawApps.value.length)
  } catch (err) {
    console.error('Error fetching applications', err)
    rawApps.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  router.push({ path: '/' })
}

function resetFilters() {
  selectedPriceType.value = ''
  selectedPlatform.value = ''
  sortBy.value = 'latest'
}

watch(activeSearch, value => {
  if (!value) resetFilters()
})
watch([activeSearch, selectedPlatform, selectedPriceType, sortBy], fetchApps)

onMounted(() => {
  loadHome()
  fetchApps()
})

const features = [
  { key: 'modern', icon: 'devices', color: 'var(--pwa-primary)' },
  { key: 'verified', icon: 'fact_check', color: 'var(--pwa-primary)' },
  { key: 'reviews', icon: 'reviews', color: 'var(--pwa-secondary)' },
  { key: 'africa', icon: 'public', color: 'var(--pwa-accent)' }
]
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  overflow-x: clip;
  color: var(--text);
  background: var(--page);
}
.home-content {
  position: relative;
  z-index: 1;
  min-width: 0;
  max-width: 1320px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin: 0 auto;
  padding: 14px var(--ui-page-gutter) 28px;
}
.home-content > * {
  min-width: 0;
}

/* Hero (useHeroIntro drives .eyebrow, .line-inner, .phone-wrap, .platform-badge…). */
.hero-panel {
  position: relative;
  min-height: 240px;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 20px 4% 20px 5%;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 18px;
  box-shadow: var(--ui-shadow-md);
  isolation: isolate;
}
.hero-copy {
  position: relative;
  z-index: 3;
  max-width: 580px;
}
.eyebrow,
.section-kicker {
  color: var(--pwa-link);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
}
.hero-copy h1 {
  margin: 0;
  max-width: 550px;
  color: var(--text);
  font-size: clamp(26px, 3.2vw, 38px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.04em;
}
.hero-copy p {
  max-width: 500px;
  margin: 10px 0 16px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hero-actions .q-btn {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}
.primary-cta {
  color: var(--pwa-on-primary);
  background: var(--pwa-primary);
}
.secondary-cta {
  color: var(--text);
}
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.6;
}
.hero-orb-one {
  top: -100px;
  right: 5%;
  width: 250px;
  height: 250px;
  background: color-mix(in srgb, var(--primary) 22%, transparent);
}
.hero-orb-two {
  bottom: -150px;
  left: 30%;
  width: 300px;
  height: 300px;
  background: color-mix(in srgb, var(--secondary) 14%, transparent);
}
.device-scene {
  position: absolute;
  z-index: 2;
  top: 50%;
  right: 4%;
  width: 260px;
  height: 270px;
  transform: translateY(-50%);
}
.phone-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 154px;
  height: 252px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%) rotate(2deg);
  background: var(--surface-low);
  border: 4px solid var(--surface-highest);
  border-radius: 24px;
  box-shadow: 15px 20px 45px rgba(2, 5, 20, 0.3);
}
.phone-speaker {
  position: absolute;
  top: 9px;
  width: 40px;
  height: 4px;
  background: var(--surface-highest);
  border-radius: 8px;
}
.phone-card strong {
  font-size: 15px;
}
.phone-card small {
  margin-top: 6px;
  color: var(--muted);
  text-align: center;
  line-height: 1.3;
  font-size: 9px;
}
.platform-badge {
  position: absolute;
  z-index: 4;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(3, 7, 24, 0.2);
}
.platform-badge .q-icon {
  font-size: 20px;
}
.platform-badge.android {
  top: 24px;
  left: 12px;
  color: var(--pwa-platform-android);
}
.platform-badge.web {
  bottom: 40px;
  left: 4px;
  color: var(--text);
}
.platform-badge.apps {
  top: 40px;
  right: 4px;
  color: var(--pwa-link);
}
.platform-badge.windows {
  right: 12px;
  bottom: 40px;
  color: var(--pwa-platform-windows);
}
.hero-copy h1 .line {
  display: block;
  overflow: hidden;
  padding-bottom: 0.08em;
  margin-bottom: -0.08em;
}
.hero-copy h1 .line-inner {
  display: inline-block;
}
.phone-wrap {
  position: absolute;
  inset: 0;
}
.install-ring {
  position: absolute;
  top: 34%;
  left: 50%;
  width: 96px;
  height: 96px;
  margin: -48px 0 0 -48px;
  border-radius: 28px;
  border: 2px solid var(--pwa-secondary);
  opacity: 0;
  pointer-events: none;
}
.hero-intro
  :is(
    .eyebrow,
    .hero-copy > p,
    .hero-actions > *,
    .phone-wrap,
    .platform-badge
  ) {
  opacity: 0;
}
.hero-intro .line-inner {
  transform: translateY(110%);
}
.floating-apps {
  position: absolute;
  inset: 15% -5%;
  z-index: 4;
  pointer-events: none;
}
.floating-app {
  position: absolute;
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: 175px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--pwa-surface);
  color: var(--pwa-text);
  border: 1px solid rgba(8, 200, 248, 0.3);
  box-shadow: 0 14px 40px #075bff20;
}
.floating-app span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.floating-app:nth-child(2) {
  right: 0;
  top: 42%;
}
.floating-app:nth-child(3) {
  left: 2%;
  bottom: 0;
}

/* Search mode */
.search-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: -16px;
  padding: 8px 12px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}
.search-notice span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.filter-bar-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: -12px;
  padding: 14px;
  border-radius: 16px;
}
.filter-controls {
  min-width: 0;
  display: flex;
  flex: 1;
  align-items: center;
  gap: 16px;
}
.filter-select {
  min-width: 170px;
  background: var(--surface-highest);
  border-radius: 8px;
  :deep(.q-field__control) {
    border-radius: 8px;
  }
}

/* Sections */
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.section-heading h2 {
  margin: 0;
  font-size: clamp(17px, 2vw, 20px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.section-heading a {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--pwa-link);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}
.category-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.tile-skeleton {
  border-radius: var(--ui-radius-md);
}
.home-empty {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 36px 20px;
  color: var(--muted);
  text-align: center;
  border-radius: var(--ui-radius-lg);
}
.home-empty > .q-icon {
  color: var(--pwa-link);
  font-size: 40px;
}
.home-empty h2 {
  margin: 6px 0 0;
  color: var(--text);
  font-size: 18px;
}
.home-empty p {
  max-width: 420px;
  margin: 0;
}
.developer-band {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  overflow: hidden;
  padding: 18px 20px;
  background: color-mix(in srgb, var(--primary) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
  border-radius: var(--ui-radius-lg);
}
.developer-band > div {
  position: relative;
}
.developer-band h2 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 750;
}
.developer-band p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.developer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.developer-actions .q-btn:first-child {
  color: var(--pwa-on-primary);
  background: var(--primary);
}
.developer-watermark {
  position: absolute;
  right: 30%;
  bottom: -24px;
  color: var(--pwa-link);
  font-size: 96px;
  opacity: 0.08;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.feature-card {
  padding: 14px 12px;
  text-align: center;
  border-radius: 14px;
}
.feature-card > .q-icon {
  font-size: 22px;
}
.feature-card h3 {
  margin: 6px 0 2px;
  font-size: 13px;
  font-weight: 700;
}
.feature-card p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 1350px) {
  .device-scene {
    right: 2%;
    transform: translateY(-50%) scale(0.8);
  }
  .hero-copy {
    max-width: 60%;
  }
}
@media (max-width: 899px) {
  .hero-panel {
    min-height: 280px;
  }
  .hero-copy {
    max-width: 65%;
  }
  .device-scene {
    right: -5%;
    transform: translateY(-50%) scale(0.65);
  }
  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 699px) {
  .home-content {
    gap: 22px;
    padding: 12px 12px 20px;
  }
  .hero-panel {
    min-height: 286px;
    align-items: flex-start;
    padding: 18px 16px;
  }
  .hero-copy {
    max-width: none;
  }
  .hero-copy h1 {
    font-size: 28px;
  }
  .hero-copy p {
    font-size: 12px;
  }
  .device-scene {
    top: auto;
    right: 50%;
    bottom: -140px;
    transform: translateX(50%) scale(0.58);
  }
  .filter-bar-panel {
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }
  .filter-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .filter-select {
    width: 100%;
    min-width: 0;
  }
  .filter-select:last-child {
    grid-column: 1 / -1;
  }
  .category-tiles {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
/* Phones: the phone mock-up does not fit beside the text; the promise and the action stay. */
@media (max-width: 599px) {
  .device-scene {
    display: none;
  }
  .hero-panel {
    min-height: 0;
    padding: 22px 18px;
  }
}
@media (max-width: 420px) {
  .hero-panel {
    padding: 20px 16px;
  }
  .hero-copy h1 {
    font-size: 24px;
  }
  .hero-actions {
    flex-direction: column;
  }
  .hero-actions .q-btn {
    width: 100%;
  }
  .filter-controls {
    grid-template-columns: 1fr;
  }
  .filter-select:last-child {
    grid-column: auto;
  }
  .category-tiles {
    grid-template-columns: 1fr;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
