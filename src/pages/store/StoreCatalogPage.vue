<template>
  <q-page class="home-page">
    <main ref="motionRoot" class="home-content">
      <section class="hero-panel" aria-labelledby="hero-title">
        <div class="hero-orb hero-orb-one" />
        <div class="hero-orb hero-orb-two" />
        <div class="hero-copy">
          <span class="eyebrow"
            ><q-icon name="auto_awesome" /> La plateforme universelle</span
          >
          <h1 id="hero-title"
            >Une seule installation.<br />Toutes les plateformes.</h1
          >
          <p>Découvrez, testez et utilisez des applications Web modernes.</p>
          <div class="hero-actions">
            <q-btn
              unelevated
              no-caps
              label="Découvrir PWA Store"
              href="#popular"
              class="primary-cta"
            />
            <q-btn
              outline
              no-caps
              label="Devenir développeur"
              to="/developer/activate"
              class="secondary-cta"
            />
          </div>
        </div>

        <div class="device-scene" aria-hidden="true">
          <div class="floating-apps" v-if="rawApps.length">
            <div
              v-for="entry in rawApps.slice(0, 3)"
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
          <div class="phone-card">
            <span class="phone-speaker" />
            <img
              class="hero-brand-icon"
              src="/brand/pwa-store-icon.png"
              width="180"
              height="180"
              alt=""
            />
            <strong>PWA Store</strong>
            <small>Installer partout.<br />Ouvrir instantanément.</small>
          </div>
        </div>
        <div class="hero-dots" aria-hidden="true"><i /><i /><i /><i /></div>
      </section>

      <div v-if="activeSearch" class="search-notice">
        <span>Résultats pour « {{ activeSearch }} »</span>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Effacer la recherche"
          @click="clearSearch"
        />
      </div>

      <!-- Advanced Filter Panel -->
      <div
        class="filter-bar-panel glass-panel row items-center justify-between q-pa-md q-mb-sm"
      >
        <div class="filter-controls">
          <!-- Platform Filter -->
          <q-select
            v-model="selectedPlatform"
            :options="platformOptions"
            label="Plateforme"
            dense
            outlined
            emit-value
            map-options
            class="filter-select"
            @update:model-value="fetchApps"
          >
            <template v-slot:prepend>
              <q-icon name="devices" size="xs" />
            </template>
          </q-select>

          <!-- Price Filter -->
          <q-select
            v-model="selectedPriceType"
            :options="priceOptions"
            label="Prix"
            dense
            outlined
            emit-value
            map-options
            class="filter-select"
            @update:model-value="fetchApps"
          >
            <template v-slot:prepend>
              <q-icon name="payments" size="xs" />
            </template>
          </q-select>

          <!-- Sort By Filter -->
          <q-select
            v-model="sortBy"
            :options="sortOptions"
            label="Trier par"
            dense
            outlined
            emit-value
            map-options
            class="filter-select"
            @update:model-value="fetchApps"
          >
            <template v-slot:prepend>
              <q-icon name="sort" size="xs" />
            </template>
          </q-select>
        </div>

        <q-btn
          v-if="selectedPlatform || selectedPriceType || sortBy !== 'latest'"
          flat
          dense
          no-caps
          label="Réinitialiser"
          icon="refresh"
          color="primary"
          @click="resetFilters"
        />
      </div>

      <div class="content-grid">
        <div class="main-column">
          <!-- If activeSearch or filters are set, show search results grid -->
          <section
            v-if="
              activeSearch ||
              selectedPlatform ||
              selectedPriceType ||
              sortBy !== 'latest'
            "
            class="home-section"
          >
            <header class="section-heading">
              <div>
                <span class="section-kicker">Catalogue</span>
                <h2
                  >Applications correspondantes ({{ filteredApps.length }})</h2
                >
              </div>
            </header>

            <div v-if="filteredApps.length" class="app-grid">
              <article
                v-for="app in filteredApps"
                :key="app.id"
                class="glass-panel app-card cursor-pointer"
                @click="router.push(app.to)"
              >
                <div class="app-icon" :style="{ background: app.color }">
                  <AppIcon
                    :src="app.iconUrl"
                    :fallback-icon="app.icon"
                    :alt="`Icône de ${app.name}`"
                  />
                </div>
                <h3>{{ app.name }}</h3>
                <p>{{ app.category }}</p>
                <div class="row items-center justify-between q-mt-sm">
                  <span class="price-text text-weight-bold">{{
                    app.price > 0 ? app.price + ' FCFA' : 'Gratuit'
                  }}</span>
                  <div class="rating">
                    <q-icon name="star" /><span>{{ app.rating }}</span>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="empty-state glass-panel">
              <q-icon name="search_off" />
              <h3>Aucune application trouvée</h3>
              <p>Essayez avec d'autres filtres ou mots-clés.</p>
            </div>
          </section>

          <!-- Standard homepage sections -->
          <div v-else>
            <!-- Selection de l'équipe (Featured Apps) -->
            <section v-if="featuredApps.length > 0" class="home-section">
              <header class="section-heading">
                <div>
                  <span class="section-kicker">Sélection de l'équipe</span>
                  <h2>À la une</h2>
                </div>
              </header>
              <div class="featured-scroll-container">
                <div
                  v-for="app in featuredApps"
                  :key="app.id"
                  class="glass-panel featured-app-card cursor-pointer"
                  @click="router.push(app.to)"
                >
                  <div
                    class="featured-card-bg"
                    :style="{ background: app.color }"
                  />
                  <div class="featured-card-content row no-wrap items-center">
                    <div class="featured-card-icon">
                      <AppIcon
                        :src="app.iconUrl"
                        :fallback-icon="app.icon"
                        :alt="`Icône de ${app.name}`"
                      />
                    </div>
                    <div class="featured-card-text col q-ml-md">
                      <h3>{{ app.name }}</h3>
                      <p>{{ app.category }}</p>
                      <div class="row items-center q-gutter-x-sm q-mt-xs">
                        <span class="badge-custom price-badge">{{
                          app.price > 0 ? app.price + ' FCFA' : 'Gratuit'
                        }}</span>
                        <span class="badge-custom rating-badge"
                          ><q-icon name="star" size="xs" />
                          {{ app.rating }}</span
                        >
                        <span class="badge-custom download-badge"
                          ><q-icon name="download" size="xs" />
                          {{ app.downloads }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section Populaires -->
            <section id="popular" class="home-section">
              <header class="section-heading">
                <div>
                  <span class="section-kicker">Les incontournables</span>
                  <h2>Applications populaires</h2>
                </div>
                <router-link to="/popular"
                  >Voir tout <q-icon name="arrow_forward"
                /></router-link>
              </header>

              <div v-if="popularApps.length" class="app-grid">
                <article
                  v-for="app in popularApps.slice(0, 6)"
                  :key="app.id"
                  class="glass-panel app-card cursor-pointer"
                  @click="router.push(app.to)"
                >
                  <div class="app-icon" :style="{ background: app.color }">
                    <AppIcon
                      :src="app.iconUrl"
                      :fallback-icon="app.icon"
                      :alt="`Icône de ${app.name}`"
                    />
                  </div>
                  <h3>{{ app.name }}</h3>
                  <p>{{ app.category }}</p>
                  <div class="row items-center justify-between q-mt-sm">
                    <span class="price-text text-weight-bold">{{
                      app.price > 0 ? app.price + ' FCFA' : 'Gratuit'
                    }}</span>
                    <div class="rating">
                      <q-icon name="star" /><span>{{ app.rating }}</span>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <!-- Section Gratuites -->
            <section data-reveal class="home-section">
              <header class="section-heading">
                <div>
                  <span class="section-kicker">Gratuites</span>
                  <h2>Nouveautés gratuites</h2>
                </div>
              </header>

              <div v-if="freeApps.length" class="app-grid">
                <article
                  v-for="app in freeApps"
                  :key="app.id"
                  class="glass-panel app-card cursor-pointer"
                  @click="router.push(app.to)"
                >
                  <div class="app-icon" :style="{ background: app.color }">
                    <AppIcon
                      :src="app.iconUrl"
                      :fallback-icon="app.icon"
                      :alt="`Icône de ${app.name}`"
                    />
                  </div>
                  <h3>{{ app.name }}</h3>
                  <p>{{ app.category }}</p>
                  <div class="row items-center justify-between q-mt-sm">
                    <span class="price-text text-weight-bold">Gratuit</span>
                    <div class="rating">
                      <q-icon name="star" /><span>{{ app.rating }}</span>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="empty-state glass-panel">
                <p>Aucune application gratuite disponible.</p>
              </div>
            </section>

            <!-- Section Premium -->
            <section data-reveal class="home-section">
              <header class="section-heading">
                <div>
                  <span class="section-kicker">Payantes</span>
                  <h2>Applications Premium</h2>
                </div>
              </header>

              <div v-if="premiumApps.length" class="app-grid">
                <article
                  v-for="app in premiumApps"
                  :key="app.id"
                  class="glass-panel app-card cursor-pointer"
                  @click="router.push(app.to)"
                >
                  <div class="app-icon" :style="{ background: app.color }">
                    <AppIcon
                      :src="app.iconUrl"
                      :fallback-icon="app.icon"
                      :alt="`Icône de ${app.name}`"
                    />
                  </div>
                  <h3>{{ app.name }}</h3>
                  <p>{{ app.category }}</p>
                  <div class="row items-center justify-between q-mt-sm">
                    <span class="price-text text-primary text-weight-bold"
                      >{{ app.price }} FCFA</span
                    >
                    <div class="rating">
                      <q-icon name="star" /><span>{{ app.rating }}</span>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="empty-state glass-panel">
                <p>Aucune application premium disponible.</p>
              </div>
            </section>
          </div>

          <section
            id="features"
            class="feature-grid"
            aria-label="Avantages PWA Store"
          >
            <article
              v-for="feature in features"
              :key="feature.title"
              class="glass-panel feature-card"
            >
              <q-icon :name="feature.icon" :style="{ color: feature.color }" />
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.text }}</p>
            </article>
          </section>
        </div>

        <aside class="aside-column">
          <section id="categories" class="glass-panel side-card">
            <header><h2>Catégories</h2><a href="#popular">Voir tout</a></header>
            <a
              v-for="category in categories"
              :key="category.label"
              href="#popular"
              class="category-row"
              :style="{
                background:
                  selectedCategory === category.label
                    ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
                    : '',
                borderColor:
                  selectedCategory === category.label ? 'var(--primary)' : ''
              }"
              @click="selectCategory(category.label)"
            >
              <span>
                <q-icon
                  :name="category.icon"
                  :style="{ color: category.color }"
                />{{ category.label }}
              </span>
              <q-icon name="chevron_right" />
            </a>
          </section>

          <section id="business" class="developer-card">
            <q-icon name="developer_mode" class="developer-watermark" />
            <h2>Développeur ?</h2>
            <p
              >Vous développez des applications ? Devenez développeur sur PWA
              Store.</p
            >
            <q-btn
              unelevated
              no-caps
              label="Devenir développeur"
              to="/developer/activate"
            />
          </section>

          <section id="trending" class="glass-panel side-card trending-card">
            <header
              ><h2>Top tendances</h2
              ><router-link to="/trending">Voir tout</router-link></header
            >
            <article
              v-for="(app, index) in trendingApps"
              :key="app.name"
              class="trend-row cursor-pointer"
              @click="router.push(app.to)"
            >
              <b>{{ index + 1 }}</b>
              <div class="trend-icon" :style="{ background: app.color }">
                <AppIcon
                  :src="app.iconUrl"
                  :fallback-icon="app.icon"
                  :alt="`Icône de ${app.name}`"
                />
              </div>
              <div>
                <h3>{{ app.name }}</h3>
                <p>{{ app.category }}</p>
              </div>
              <span><q-icon name="star" /> {{ app.rating }}</span>
            </article>
          </section>
        </aside>
      </div>
    </main>

    <footer class="home-footer">
      <router-link to="/" aria-label="PWA Store, accueil"
        ><BrandLogo
      /></router-link>
      <p>© {{ currentYear }} PWA Store. Tous droits réservés.</p>
      <nav
        ><a href="#business">À propos</a><a href="#">Confidentialité</a
        ><a href="#">Conditions</a><a href="#">Support</a></nav
      >
    </footer>
  </q-page>
</template>

<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { usePageMotion } from '@/composables/usePageMotion'
const motionRoot = ref(null)
usePageMotion(motionRoot)
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/boot/axios'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const currentYear = new Date().getFullYear()
const activeSearch = computed(() => String(route.query.search || '').trim())

const rawApps = ref([])
const loading = ref(false)
const selectedCategory = ref('')

const selectedPriceType = ref('')
const selectedPlatform = ref('')
const sortBy = ref('latest')

const platformOptions = [
  { label: 'Toutes plateformes', value: '' },
  { label: 'Web / PWA', value: 'web' },
  { label: 'Android', value: 'android' },
  { label: 'Windows', value: 'windows' },
  { label: 'iOS', value: 'ios' }
]

const priceOptions = [
  { label: 'Tous tarifs', value: '' },
  { label: 'Gratuites', value: 'free' },
  { label: 'Payantes', value: 'paid' }
]

const sortOptions = [
  { label: 'Nouveautés', value: 'latest' },
  { label: 'Téléchargements', value: 'downloads' },
  { label: 'Note moyenne', value: 'rating' },
  { label: 'Prix croissant', value: 'price_asc' },
  { label: 'Prix décroissant', value: 'price_desc' }
]

const getCategoryColor = category => {
  switch (category) {
    case 'Jeux':
      return 'var(--pwa-accent)'
    case 'Productivité':
      return 'var(--pwa-primary)'
    case 'Social':
      return 'var(--pwa-secondary)'
    default:
      return 'var(--pwa-primary)'
  }
}

const getCategoryName = category =>
  typeof category === 'object'
    ? category?.name || 'Autres'
    : category || 'Autres'

const getIcon = category => {
  switch (category) {
    case 'Jeux':
      return 'sports_esports'
    case 'Productivité':
      return 'task_alt'
    case 'Social':
      return 'forum'
    default:
      return 'widgets'
  }
}

async function fetchApps() {
  loading.value = true
  try {
    const params = {}
    if (activeSearch.value) params.search = activeSearch.value
    if (selectedCategory.value) params.category = selectedCategory.value
    if (selectedPriceType.value) params.price_type = selectedPriceType.value
    if (selectedPlatform.value) params.platform = selectedPlatform.value
    if (sortBy.value) params.sort_by = sortBy.value

    const response = await api.get('/apps', { params })
    rawApps.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching applications', err)
  } finally {
    loading.value = false
  }
}

const popularApps = computed(() => {
  return rawApps.value.map(app => ({
    id: app.id,
    name: app.name,
    category: getCategoryName(app.category),
    price: Number(app.price),
    rating: app.average_rating || '5.0',
    initials: app.name.substring(0, 3).toUpperCase(),
    iconUrl: app.icon_url || '',
    color:
      app.category?.color || getCategoryColor(getCategoryName(app.category)),
    icon: app.category?.icon || getIcon(getCategoryName(app.category)),
    to: '/apps/' + app.id
  }))
})

const filteredApps = computed(() => {
  return popularApps.value
})

const featuredApps = computed(() => {
  return rawApps.value
    .filter(app => app.is_featured)
    .map(app => ({
      id: app.id,
      name: app.name,
      category: getCategoryName(app.category),
      price: Number(app.price),
      rating: app.average_rating || '5.0',
      downloads: app.downloads_count || 0,
      iconUrl: app.icon_url || '',
      color:
        app.category?.color || getCategoryColor(getCategoryName(app.category)),
      icon: app.category?.icon || getIcon(getCategoryName(app.category)),
      to: '/apps/' + app.id
    }))
})

const freeApps = computed(() => {
  return popularApps.value.filter(app => app.price <= 0).slice(0, 6)
})

const premiumApps = computed(() => {
  return popularApps.value.filter(app => app.price > 0).slice(0, 6)
})

const recommendedApps = computed(() => {
  return popularApps.value.slice(0, 2).map(app => ({
    ...app,
    size: '12 Mo'
  }))
})

const trendingApps = computed(() => {
  return popularApps.value.slice(0, 3)
})

const featuredGame = computed(() => {
  const game = popularApps.value.find(app => app.category === 'Jeux')
  if (game) {
    return {
      ...game,
      size: '125 Mo'
    }
  }
  return {
    id: 1,
    name: 'Retro Games Hub',
    category: 'Jeux',
    rating: '4.8',
    size: '12 Mo',
    to: '/apps/1',
    color: 'var(--pwa-accent)'
  }
})

function selectCategory(categoryName) {
  if (selectedCategory.value === categoryName) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = categoryName
  }
  fetchApps()
}

function clearSearch() {
  router.push({ path: '/' })
}

function resetFilters() {
  selectedPriceType.value = ''
  selectedPlatform.value = ''
  sortBy.value = 'latest'
  fetchApps()
}

watch(activeSearch, () => {
  fetchApps()
})

onMounted(() => {
  fetchApps()
})

const features = [
  {
    icon: 'devices',
    title: 'Installation universelle',
    text: 'Une seule app pour Android, iOS et le Web.',
    color: 'var(--pwa-primary)'
  },
  {
    icon: 'sync',
    title: 'Mises à jour auto',
    text: 'Vos applications sont toujours à jour.',
    color: 'var(--pwa-primary)'
  },
  {
    icon: 'security',
    title: 'Sécurisé et fiable',
    text: 'Contrôlé et certifié par PWA Store.',
    color: 'var(--pwa-muted)'
  },
  {
    icon: 'public',
    title: 'Fait en Afrique',
    text: 'Une solution pensée pour le monde.',
    color: 'var(--q-warning)'
  }
]

const categories = [
  { label: 'Jeux', icon: 'sports_esports', color: 'var(--pwa-accent)' },
  { label: 'Productivité', icon: 'task_alt', color: 'var(--pwa-primary)' },
  { label: 'Social', icon: 'forum', color: 'var(--pwa-secondary)' },
  { label: 'Utilitaires', icon: 'widgets', color: 'var(--pwa-primary)' }
]
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  color: var(--text);
  background: var(--page);
}
.home-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px var(--ui-page-gutter);
}
.glass-panel {
  background: var(--glass);
  border: 1px solid var(--outline);
  box-shadow: 0 12px 30px rgba(4, 9, 25, 0.06);
  backdrop-filter: blur(16px);
}
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
.install-logo {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 14px;
  box-shadow: 0 0 25px color-mix(in srgb, var(--primary) 35%, transparent);
}
.install-logo .q-icon {
  font-size: 26px;
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
  animation: float 4s ease-in-out infinite;
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
  animation-delay: -1.4s;
}
.platform-badge.apps {
  top: 40px;
  right: 4px;
  color: var(--pwa-link);
  animation-delay: -2.2s;
}
.platform-badge.windows {
  right: 12px;
  bottom: 40px;
  color: var(--pwa-platform-windows);
  animation-delay: -0.7s;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-8px) rotate(2deg);
  }
}
.search-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: -10px;
  padding: 8px 12px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(230px, 1fr);
  gap: 14px;
}
.main-column,
.aside-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.aside-column {
  gap: 16px;
}
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-heading h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.section-heading a,
.side-card header a {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--pwa-link);
  text-decoration: none;
  font-size: 11px;
  font-weight: 700;
}
.app-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px 10px;
  border-radius: 15px;
  transition:
    transform 0.25s var(--ui-ease),
    background 0.2s,
    border-color 0.2s;
}
.app-card:hover {
  transform: translateY(-5px);
  background: var(--surface-high);
  border-color: color-mix(in srgb, var(--primary) 35%, transparent);
}
.app-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 8px;
  color: var(--pwa-on-primary);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(2, 5, 20, 0.18);
}
.app-icon .q-icon {
  font-size: 24px;
}
.app-icon strong {
  font-size: 16px;
}
.app-card h3 {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-card p {
  margin: 2px 0;
  color: var(--muted);
  font-size: 10px;
}
.rating {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 10px;
}
.rating .q-icon,
.meta .q-icon,
.compact-copy span .q-icon,
.trend-row > span .q-icon {
  color: var(--pwa-secondary);
  font-size: 12px;
}
.app-card .q-btn {
  width: 100%;
  min-height: 28px;
  margin-top: auto;
  color: var(--pwa-link);
  background: var(--surface-highest);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}
.empty-state {
  padding: 30px 16px;
  color: var(--muted);
  text-align: center;
  border-radius: 12px;
}
.empty-state > .q-icon {
  font-size: 36px;
}
.empty-state h3 {
  margin: 6px 0 2px;
  color: var(--text);
  font-size: 14px;
}
.empty-state p {
  margin: 0;
  font-size: 11px;
}
.recommendation-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 10px;
}
.featured-game {
  position: relative;
  min-height: 180px;
  overflow: hidden;
  background: var(--pwa-dark);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.featured-game::after {
  content: '';
  position: absolute;
  inset: 45% 0 0;
  background: var(--pwa-primary-soft);
  transform: perspective(350px) rotateX(28deg) scale(1.2);
  transform-origin: bottom;
}
.stadium-lights {
  position: absolute;
  inset: 0;
  background: none;
}
.ball {
  position: absolute;
  z-index: 1;
  top: 30px;
  right: 12%;
  font-size: 40px;
  filter: drop-shadow(0 8px 8px rgba(0, 0, 0, 0.4));
  transform: rotate(-18deg);
}
.featured-overlay {
  position: absolute;
  z-index: 3;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 40px 14px 12px;
  color: var(--pwa-on-primary);
  background: rgba(4, 9, 28, 0.65);
}
.featured-overlay h3 {
  margin: 2px 0 1px;
  font-size: 15px;
}
.featured-overlay p {
  margin: 0 0 4px;
  color: var(--pwa-dark-muted);
  font-size: 10px;
}
.feature-tag {
  color: var(--pwa-secondary);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.meta {
  font-size: 11px;
  font-weight: 700;
}
.meta small {
  margin-left: 6px;
  color: var(--pwa-dark-muted);
  font-weight: 400;
}
.featured-overlay .q-btn {
  color: var(--pwa-text);
  background: var(--pwa-surface);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  min-height: 28px;
  padding: 0 10px;
}
.compact-apps {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
}
.compact-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
}
.compact-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--pwa-on-primary);
  border-radius: 10px;
  box-shadow: 0 6px 14px rgba(4, 7, 20, 0.15);
}
.compact-icon .q-icon {
  font-size: 22px;
}
.compact-copy {
  min-width: 0;
}
.compact-copy h3 {
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.compact-copy p {
  margin: 1px 0 2px;
  color: var(--muted);
  font-size: 10px;
}
.compact-copy span {
  color: var(--muted);
  font-size: 10px;
}
.compact-card > .q-btn {
  color: var(--pwa-link);
  background: var(--surface-highest);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  min-height: 26px;
  padding: 0 8px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.feature-card {
  padding: 12px 8px;
  text-align: center;
  border-radius: 14px;
  transition:
    transform 0.25s var(--ui-ease),
    border-color 0.2s ease;
}
.feature-card:hover {
  border-color: color-mix(in srgb, var(--primary) 25%, var(--outline));
  transform: translateY(-3px);
}
.feature-card > .q-icon {
  font-size: 22px;
}
.feature-card h3 {
  margin: 4px 0 2px;
  font-size: 10px;
  font-weight: 700;
}
.feature-card p {
  margin: 0;
  color: var(--muted);
  font-size: 8px;
  line-height: 1.35;
}
.side-card {
  padding: 12px 14px;
  border-radius: 16px;
}
.side-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.side-card h2 {
  margin: 0;
  font-size: 12px;
}
.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px;
  color: var(--muted);
  text-decoration: none;
  border-radius: 6px;
  font-size: 11px;
}
.category-row:hover {
  color: var(--text);
  background: var(--surface-high);
}
.category-row > span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.category-row > span .q-icon {
  font-size: 16px;
}
.category-row > .q-icon {
  font-size: 14px;
}
.developer-card {
  position: relative;
  overflow: hidden;
  padding: 14px;
  background: color-mix(in srgb, var(--primary) 12%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
  border-radius: 16px;
}
.developer-card h2 {
  position: relative;
  margin: 0 0 4px;
  font-size: 14px;
}
.developer-card p {
  position: relative;
  max-width: 90%;
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}
.developer-card .q-btn {
  position: relative;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  min-height: 28px;
  padding: 0 10px;
}
.developer-watermark {
  position: absolute;
  right: -10px;
  bottom: -15px;
  color: var(--pwa-link);
  font-size: 80px;
  opacity: 0.1;
}
.trending-card {
  padding-bottom: 8px;
}
.trend-row {
  display: grid;
  grid-template-columns: 10px 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}
.trend-row > b {
  color: var(--muted);
  font-size: 10px;
}
.trend-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: var(--pwa-on-primary);
  border-radius: 8px;
}
.trend-icon .q-icon {
  font-size: 16px;
}
.trend-row h3 {
  margin: 0;
  overflow: hidden;
  font-size: 10px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}
.trend-row p {
  margin: 0;
  color: var(--muted);
  font-size: 8px;
}
.trend-row > span {
  color: var(--muted);
  font-size: 8px;
  white-space: nowrap;
}
.home-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  color: var(--muted);
  border-top: 1px solid var(--outline);
  font-size: 10px;
}
.home-footer p {
  margin: 0;
}
.home-footer nav {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.home-footer a {
  color: var(--muted);
  text-decoration: none;
}
.home-footer a:hover {
  color: var(--pwa-link);
}

@media (max-width: 1350px) {
  .app-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .app-card:last-child {
    display: none;
  }
  .device-scene {
    right: 2%;
    transform: translateY(-50%) scale(0.8);
  }
  .hero-copy {
    max-width: 60%;
  }
}
@media (max-width: 1199px) {
  .home-content {
    padding: 16px;
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
  .aside-column {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: start;
  }
  .developer-card {
    min-height: 100%;
  }
  .hero-panel {
    padding-left: 4%;
  }
  .recommendation-grid {
    grid-template-columns: 1fr 1fr;
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
  .app-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .recommendation-grid {
    grid-template-columns: 1fr;
  }
  .aside-column {
    grid-template-columns: 1fr 1fr;
  }
  .trending-card {
    grid-column: 1 / -1;
  }
  .feature-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 699px) {
  .home-content {
    gap: 12px;
    padding: 12px;
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
  .content-grid,
  .main-column {
    gap: 12px;
  }
  .app-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .app-card:last-child {
    display: flex;
  }
  .aside-column {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .developer-card {
    min-height: auto;
  }
  .compact-card {
    grid-template-columns: auto 1fr;
  }
  .compact-card > .q-btn {
    grid-column: 1 / -1;
    width: 100%;
  }
  .home-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 16px 12px;
  }
}
@media (max-width: 420px) {
  .hero-panel {
    min-height: 360px;
    padding: 16px 12px;
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
  .section-heading h2 {
    font-size: 16px;
  }
  .section-kicker {
    font-size: 8px;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
  .home-footer nav {
    gap: 10px 14px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .platform-badge {
    animation: none;
  }
  * {
    scroll-behavior: auto !important;
  }
}

.filter-bar-panel {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  gap: 16px;
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

.price-text {
  font-size: 14px;
  color: var(--pwa-link);
}

.featured-scroll-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 4px 16px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--outline);
    border-radius: 4px;
  }
}

.featured-app-card {
  position: relative;
  flex: 0 0 320px;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 16px;
  scroll-snap-align: start;
  transition:
    transform 0.25s var(--ui-ease),
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
}

.featured-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.85;
  z-index: 1;
}

.featured-card-content {
  position: relative;
  z-index: 2;
  width: 100%;
  color: var(--pwa-on-primary);
}

.featured-card-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  display: grid;
  place-items: center;

  .q-icon {
    font-size: 32px;
    color: var(--pwa-on-primary);
  }
}

.featured-card-text {
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--pwa-on-primary);
  }
  p {
    margin: 2px 0 6px;
    font-size: 11px;
    opacity: 0.8;
    color: var(--pwa-on-primary);
  }
}

.badge-custom {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--pwa-on-primary);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 699px) {
  .home-page,
  .home-content,
  .content-grid,
  .main-column,
  .home-section,
  .featured-scroll-container {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .home-page {
    overflow-x: clip;
  }

  .filter-bar-panel {
    width: 100%;
    max-width: 100%;
    align-items: stretch;
    flex-direction: column;
    overflow: hidden;
    padding: 12px !important;
  }

  .filter-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .filter-select {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .filter-select:last-child {
    grid-column: 1 / -1;
  }

  .featured-app-card {
    flex-basis: min(320px, calc(100vw - 48px));
  }
}

@media (max-width: 420px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }

  .filter-select:last-child {
    grid-column: auto;
  }
}
</style>

<style scoped lang="scss">
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
  animation: card-float 6s ease-in-out infinite;
}
.floating-app span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.floating-app:nth-child(2) {
  right: 0;
  top: 42%;
  animation-delay: -2s;
}
.floating-app:nth-child(3) {
  left: 2%;
  bottom: 0;
  animation-delay: -4s;
}
@keyframes card-float {
  50% {
    transform: translateY(-8px) rotate(1deg);
  }
}
@media (max-width: 1023px), (prefers-reduced-motion: reduce) {
  .floating-app {
    animation: none;
  }
}
</style>
