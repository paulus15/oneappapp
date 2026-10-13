<template>
  <q-page class="home-page">
    <!-- Night-blue band: country and categories on phones, the hero from tablets up. -->
    <section class="store-band" aria-labelledby="hero-title">
      <div class="band-decor" aria-hidden="true">
        <span class="globe" />
        <span class="float-tile tile-a"><q-icon name="add" /></span>
        <span class="float-tile tile-b"><q-icon name="school" /></span>
        <span class="float-tile tile-c"><q-icon name="shopping_cart" /></span>
        <span class="float-tile tile-d"><q-icon name="favorite" /></span>
      </div>
      <div class="band-inner">
        <div class="hero-copy">
          <h1 id="hero-title">{{
            ui('Des applications web pour tous vos besoins.')
          }}</h1>
          <p>{{
            ui(
              'Découvrez des PWA vérifiées, installables et adaptées à votre pays.'
            )
          }}</p>
          <div class="hero-actions">
            <q-btn
              unelevated
              no-caps
              icon="explore"
              :label="ui('Explorer les applications')"
              to="/applications"
              class="primary-cta"
            />
            <q-btn
              v-if="!isMobile"
              outline
              no-caps
              icon="rocket_launch"
              :label="ui('Publier une PWA')"
              to="/developer/activate"
              class="secondary-cta"
            />
          </div>
        </div>
        <div class="band-filters">
          <CountryChoice pill />
          <CategoryChips
            v-if="sections.categories.length"
            v-model="activeCategory"
            :categories="sections.categories"
          />
        </div>
      </div>
    </section>

    <main class="home-sheet">
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

      <!-- One category chosen in the chips -->
      <section
        v-else-if="activeCategory"
        class="home-section"
        aria-labelledby="category-title"
      >
        <header class="section-heading">
          <h2 id="category-title">{{ activeCategoryName }}</h2>
          <router-link
            :to="`/categories/${activeCategory}`"
            :aria-label="t('store.row.seeAllOf', { title: activeCategoryName })"
            >{{ t('store.row.seeAll') }}</router-link
          >
        </header>
        <div v-if="categoryLoading" class="tile-grid" aria-busy="true">
          <div v-for="n in 6" :key="n" class="tile-skeleton">
            <q-skeleton class="tile-skeleton-icon" />
            <q-skeleton type="text" width="70%" />
            <q-skeleton type="text" width="45%" />
          </div>
        </div>
        <div v-else-if="categoryApps.length" class="tile-grid">
          <StoreAppTile v-for="app in categoryApps" :key="app.id" :app="app" />
        </div>
        <div v-else class="home-empty">
          <q-icon name="category" />
          <p>{{
            categoryError ||
            ui('Aucune application dans cette catégorie pour votre pays.')
          }}</p>
        </div>
      </section>

      <!-- Discover -->
      <template v-else>
        <ul class="trust-strip" :aria-label="ui('Pourquoi PWA Store')">
          <li v-for="item in trust" :key="item.label">
            <span class="trust-icon" :style="{ '--trust': item.color }"
              ><q-icon :name="item.icon" aria-hidden="true"
            /></span>
            <span>{{ item.label }}</span>
          </li>
        </ul>

        <q-banner v-if="homeError" class="workspace-alert" role="alert">
          {{
            ui('Le catalogue n’a pas pu être chargé. Vérifiez votre connexion.')
          }}
          <template #action>
            <q-btn flat no-caps :label="ui('Réessayer')" @click="loadHome" />
          </template>
        </q-banner>

        <section
          v-for="block in tileSections"
          :id="block.id"
          :key="block.id"
          class="home-section"
          :aria-labelledby="`${block.id}-title`"
        >
          <header class="section-heading">
            <h2 :id="`${block.id}-title`">{{ block.title }}</h2>
            <router-link
              v-if="block.to && block.apps.length"
              :to="block.to"
              :aria-label="t('store.row.seeAllOf', { title: block.title })"
              >{{ t('store.row.seeAll') }}</router-link
            >
          </header>
          <div v-if="pending" class="tile-grid" aria-busy="true">
            <div v-for="n in 6" :key="n" class="tile-skeleton">
              <q-skeleton class="tile-skeleton-icon" />
              <q-skeleton type="text" width="70%" />
              <q-skeleton type="text" width="45%" />
            </div>
          </div>
          <div v-else class="tile-grid">
            <StoreAppTile v-for="app in block.apps" :key="app.id" :app="app" />
          </div>
        </section>

        <AppRow
          id="featured"
          variant="featured"
          :title="ui('Sélections du moment')"
          :apps="sections.featured"
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
            <h2 id="categories-title">{{ t('store.home.categories') }}</h2>
            <router-link
              to="/categories"
              :aria-label="
                t('store.row.seeAllOf', { title: t('store.home.categories') })
              "
              >{{ t('store.row.seeAll') }}</router-link
            >
          </header>
          <div v-if="pending" class="category-tiles">
            <q-skeleton
              v-for="n in 4"
              :key="n"
              height="68px"
              class="category-skeleton"
            />
          </div>
          <div v-else class="category-tiles">
            <CategoryTile
              v-for="category in sections.categories.slice(0, 8)"
              :key="category.id"
              :category="category"
            />
          </div>
        </section>

        <div v-if="home && !homeError && !hasApps" class="home-empty">
          <q-icon name="storefront" />
          <h2>{{ t('store.home.emptyTitle') }}</h2>
          <p>{{ t('store.home.emptyText') }}</p>
        </div>

        <!-- Developer actions are offered on computers only. -->
        <section v-if="!isMobile" id="business" class="developer-band">
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
import CountryChoice from '@/components/CountryChoice.vue'
import CategoryChips from '@/components/store/CategoryChips.vue'
import StoreAppTile from '@/components/store/StoreAppTile.vue'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
import { ui } from '@/i18n/text'
import { catalogApi } from '@/services/catalog'

const { t } = useI18n()
const { isMobile } = useWorkspaceAccess()
const route = useRoute()
const router = useRouter()
const activeSearch = computed(() => String(route.query.search || '').trim())

const home = ref(null)
const homeLoading = ref(true)
const homeError = ref(false)
const pending = computed(() => !home.value && homeLoading.value)

// The chosen chip lives in the URL (?category=), so Back and shared links keep it.
const activeCategory = computed({
  get: () => String(route.query.category || ''),
  set: slug =>
    router.replace({
      query: { ...route.query, category: slug || undefined }
    })
})
const activeCategoryName = computed(() => {
  const category = sections.value.categories.find(
    c => c.slug === activeCategory.value
  )
  return category ? ui(category.name) : ''
})
const categoryApps = ref([])
const categoryLoading = ref(false)
const categoryError = ref('')

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
  // Only categories holding apps visible in this country; the busiest first.
  const categories = [...list(data.categories)]
    .filter(c => c?.slug && Number(c.applications_count || 0) > 0)
    .sort(
      (a, b) =>
        Number(b.applications_count || 0) - Number(a.applications_count || 0)
    )
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
// Store-style tile grids; a section without apps is never shown (no invented content).
const tileSections = computed(() =>
  [
    {
      id: 'popular',
      title: ui('Applications populaires'),
      to: '/rankings',
      apps: sections.value.trending.length
        ? sections.value.trending
        : list(home.value?.popular)
    },
    {
      id: 'latest',
      title: ui('Nouveautés'),
      to: '/rankings?type=new',
      apps: sections.value.latest
    },
    {
      id: 'recommended',
      title: ui('Recommandées pour vous'),
      to: '/recommended',
      apps: sections.value.recommended
    },
    {
      id: 'discover',
      title: ui('Applications à découvrir'),
      to: '/applications',
      apps: sections.value.discover
    }
  ]
    .map(block => ({ ...block, apps: block.apps.slice(0, 12) }))
    .filter(block =>
      pending.value ? block.id !== 'recommended' : block.apps.length
    )
)
const hasApps = computed(() =>
  ['featured', 'trending', 'latest', 'recommended', 'discover'].some(
    key => sections.value[key].length
  )
)

async function loadHome() {
  homeLoading.value = true
  homeError.value = false
  try {
    home.value = (await catalogApi.home()).data || {}
  } catch (err) {
    console.error('Error fetching home sections', err)
    homeError.value = true
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

async function fetchCategory() {
  if (!activeCategory.value || activeSearch.value) return
  const slug = activeCategory.value
  categoryLoading.value = true
  categoryError.value = ''
  try {
    const { data } = await catalogApi.apps({
      category: slug,
      sort_by: 'downloads'
    })
    // A later chip may have been chosen meanwhile: keep only the latest answer.
    if (slug === activeCategory.value) categoryApps.value = list(data?.data)
  } catch {
    if (slug === activeCategory.value) {
      categoryApps.value = []
      categoryError.value = ui(
        'Les applications n’ont pas pu être chargées. Vérifiez votre connexion.'
      )
    }
  } finally {
    if (slug === activeCategory.value) categoryLoading.value = false
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
watch(activeCategory, fetchCategory)

onMounted(() => {
  loadHome()
  fetchApps()
  fetchCategory()
})

// Labels follow the interface language (computed, not frozen at setup).
const trust = computed(() => [
  {
    icon: 'verified_user',
    color: '#12a150',
    label: ui('Applications vérifiées')
  },
  { icon: 'bolt', color: '#075bff', label: ui('Applications installables') },
  {
    icon: 'storefront',
    color: '#ff9416',
    label: ui('Sans Play Store ni App Store')
  },
  {
    icon: 'public',
    color: '#7c4dff',
    label: ui('Catalogue adapté à votre pays')
  }
])
</script>

<style scoped lang="scss">
/* Night blue, electric blue and cyan from the PWA Store identity; orange stays an accent. */
.home-page {
  --night: #071a3d;
  --night-2: #0b2a63;
  min-height: 100vh;
  overflow-x: clip;
  color: var(--text);
  background: var(--page);
}

/* Band */
.store-band {
  position: relative;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(
      120% 90% at 85% 10%,
      rgba(8, 200, 248, 0.28),
      transparent 55%
    ),
    radial-gradient(
      90% 80% at 0% 100%,
      rgba(7, 91, 255, 0.45),
      transparent 60%
    ),
    linear-gradient(135deg, var(--night) 0%, var(--night-2) 100%);
  isolation: isolate;
}
.band-inner {
  position: relative;
  z-index: 2;
  max-width: 1320px;
  margin: 0 auto;
  padding: clamp(28px, 5vw, 56px) var(--ui-page-gutter) 56px;
}
.hero-copy {
  max-width: 620px;
}
.hero-copy h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 46px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
}
.hero-copy p {
  max-width: 520px;
  margin: 12px 0 22px;
  color: #c9d8ff;
  font-size: clamp(14px, 1.4vw, 17px);
  line-height: 1.5;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hero-actions .q-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 700;
}
.primary-cta {
  color: #fff;
  background: var(--pwa-primary);
}
.secondary-cta {
  color: #fff;
}
.band-filters {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  margin-top: 26px;
  min-width: 0;
}
.band-filters > :deep(*) {
  max-width: 100%;
}
.band-filters :deep(.category-chips) {
  width: 100%;
}

/* Decoration: a dotted globe and floating app tiles (pure CSS, hidden from assistive tech). */
.band-decor {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.globe {
  position: absolute;
  top: 50%;
  right: -60px;
  width: 440px;
  aspect-ratio: 1;
  transform: translateY(-50%);
  border-radius: 50%;
  background:
    radial-gradient(
      circle at 35% 35%,
      rgba(8, 200, 248, 0.35),
      transparent 60%
    ),
    radial-gradient(rgba(140, 200, 255, 0.55) 1px, transparent 1.6px) 0 0 / 12px
      12px;
  box-shadow:
    inset -30px -20px 80px rgba(3, 12, 40, 0.75),
    0 0 80px rgba(8, 200, 248, 0.25);
  opacity: 0.85;
}
.float-tile {
  position: absolute;
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 28px;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  animation: float 6s ease-in-out infinite;
}
.tile-a {
  top: 16%;
  right: 34%;
  background: linear-gradient(145deg, #2ed47a, #12a150);
}
.tile-b {
  top: 30%;
  right: 8%;
  background: linear-gradient(145deg, #8b5cf6, #6d28d9);
  animation-delay: -2s;
}
.tile-c {
  bottom: 18%;
  right: 30%;
  background: linear-gradient(145deg, #ffae42, #ff7a00);
  animation-delay: -4s;
}
.tile-d {
  bottom: 26%;
  right: 4%;
  background: linear-gradient(145deg, #ff5f8f, #e11d48);
  animation-delay: -1s;
}
@keyframes float {
  50% {
    transform: translateY(-10px);
  }
}

/* White sheet over the band, as in a native store */
.home-sheet {
  position: relative;
  z-index: 3;
  max-width: 1320px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin: -28px auto 0;
  padding: 24px var(--ui-page-gutter) 32px;
  background: var(--page);
  border-radius: 28px 28px 0 0;
}
.home-sheet > * {
  min-width: 0;
}

/* Trust strip */
.trust-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.trust-strip li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  font-size: 13.5px;
  font-weight: 650;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: var(--ui-shadow-sm, 0 2px 8px rgba(4, 18, 51, 0.06));
}
.trust-icon {
  flex: none;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
  background: var(--trust);
  border-radius: 50%;
}

/* Sections */
.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-heading h2 {
  margin: 0;
  font-size: clamp(17px, 2vw, 21px);
  font-weight: 750;
  letter-spacing: -0.02em;
}
.section-heading a {
  flex: 0 0 auto;
  color: var(--pwa-link);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.section-kicker {
  color: var(--pwa-link);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 14px 10px;
}
.tile-skeleton {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
}
.tile-skeleton-icon {
  width: 100%;
  max-width: 96px;
  aspect-ratio: 1;
  height: auto;
  border-radius: 22%;
}
.category-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.category-skeleton {
  border-radius: var(--ui-radius-md);
}
.home-empty {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 32px 20px;
  color: var(--muted);
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--outline);
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

/* Search mode */
.search-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 10px;
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

/* Developer band */
.developer-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 20px 22px;
  color: #fff;
  background: linear-gradient(135deg, #071a3d, #0b3a8f);
  border-radius: var(--ui-radius-lg);
}
.developer-band h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 750;
}
.developer-band p {
  margin: 0;
  color: #c9d8ff;
  font-size: 13.5px;
}
.developer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.developer-actions .q-btn:first-child {
  color: #fff;
  background: var(--pwa-accent);
}
.developer-actions .q-btn:last-child {
  color: #fff;
}

/* Desktop: wider tiles, the band is a hero */
@media (min-width: 1024px) {
  .band-inner {
    min-height: 330px;
    padding-bottom: 64px;
  }
  /* The right side belongs to the decoration: chips never run under the floating tiles. */
  .band-filters {
    max-width: 62%;
  }
  .tile-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
/* Tablet */
@media (min-width: 600px) and (max-width: 1023px) {
  .tile-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .trust-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .globe {
    width: 320px;
    right: -120px;
  }
  .float-tile {
    display: none;
  }
}
/* From tablets up the header already carries the country: the band keeps the categories. */
@media (min-width: 600px) {
  .band-filters > .country-choice {
    display: none;
  }
}
/* Phones: a native-store screen. No hero text: country, categories, then apps. */
@media (max-width: 599px) {
  .hero-copy,
  .float-tile,
  .trust-strip {
    display: none;
  }
  .globe {
    width: 240px;
    right: -110px;
    opacity: 0.45;
  }
  .band-inner {
    padding: 14px 16px 44px;
  }
  .band-filters {
    margin-top: 0;
    gap: 12px;
  }
  .home-sheet {
    gap: 26px;
    padding: 20px 16px 24px;
    border-radius: 24px 24px 0 0;
  }
  .tile-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 6px;
  }
  .category-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .developer-band {
    padding: 18px;
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
}
@media (max-width: 359px) {
  .tile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .category-tiles {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .float-tile {
    animation: none;
  }
}
</style>
