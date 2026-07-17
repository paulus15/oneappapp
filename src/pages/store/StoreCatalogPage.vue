<template>
  <q-page class="home-page">
    <main class="home-content">
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
          <p
            >OneInstall est la passerelle universelle entre vos applications et
            tous les utilisateurs. Développez une fois. Exécutez partout.</p
          >
          <div class="hero-actions">
            <q-btn
              unelevated
              no-caps
              label="Découvrir OneInstall"
              href="#popular"
              class="primary-cta"
            />
            <q-btn
              outline
              no-caps
              label="Publier mon app"
              to="/developer"
              class="secondary-cta"
            />
          </div>
        </div>

        <div class="device-scene" aria-hidden="true">
          <span class="platform-badge android"><q-icon name="android" /></span>
          <span class="platform-badge web"><q-icon name="language" /></span>
          <span class="platform-badge apps"><q-icon name="apps" /></span>
          <span class="platform-badge windows"><q-icon name="window" /></span>
          <div class="phone-card">
            <span class="phone-speaker" />
            <div class="install-logo"><q-icon name="download" /></div>
            <strong>OneInstall</strong>
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

      <div class="content-grid">
        <div class="main-column">
          <section id="popular" class="home-section">
            <header class="section-heading">
              <div
                ><span class="section-kicker">Les incontournables</span
                ><h2>Applications populaires</h2></div
              >
              <a href="#recommended"
                >Voir tout <q-icon name="arrow_forward"
              /></a>
            </header>

            <div v-if="filteredApps.length" class="app-grid">
              <article
                v-for="app in filteredApps"
                :key="app.name"
                class="glass-panel app-card"
              >
                <div class="app-icon" :style="{ background: app.gradient }"
                  ><q-icon v-if="app.icon" :name="app.icon" /><strong v-else>{{
                    app.initials
                  }}</strong></div
                >
                <h3>{{ app.name }}</h3>
                <p>{{ app.category }}</p>
                <div class="rating"
                  ><q-icon name="star" /><span>{{ app.rating }}</span></div
                >
                <q-btn
                  unelevated
                  no-caps
                  icon="download"
                  label="Installer"
                  :to="app.to || '/'"
                />
              </article>
            </div>
            <div v-else class="empty-state glass-panel">
              <q-icon name="search_off" /><h3>Aucune application trouvée</h3
              ><p>Essayez une recherche plus générale.</p>
            </div>
          </section>

          <section id="recommended" class="home-section">
            <header class="section-heading">
              <div
                ><span class="section-kicker">Sélection OneInstall</span
                ><h2>Recommandé pour vous</h2></div
              >
              <a href="#trending">Voir tout <q-icon name="arrow_forward" /></a>
            </header>
            <div class="recommendation-grid">
              <article class="featured-game" :style="{ background: featuredGame.gradient }">
                <div class="stadium-lights" />
                <div class="ball"><span>⚽</span></div>
                <div class="featured-overlay">
                  <div>
                    <span class="feature-tag">Jeu du moment</span>
                    <h3>{{ featuredGame.name }}</h3>
                    <p>{{ featuredGame.category }}</p>
                    <span class="meta">
                      <q-icon name="star" /> {{ featuredGame.rating }} <small>{{ featuredGame.size }}</small>
                    </span>
                  </div>
                  <q-btn unelevated no-caps label="Installer" :to="featuredGame.to" />
                </div>
              </article>
              <div class="compact-apps">
                <article
                  v-for="app in recommendedApps"
                  :key="app.name"
                  class="glass-panel compact-card"
                >
                  <div
                    class="compact-icon"
                    :style="{ background: app.gradient }"
                    ><q-icon :name="app.icon"
                  /></div>
                  <div class="compact-copy"
                    ><h3>{{ app.name }}</h3>
                    <p>{{ app.category }}</p>
                    <span>
                      <q-icon name="star" /> {{ app.rating }}
                      <small>• {{ app.size }}</small>
                    </span>
                  </div>
                  <q-btn unelevated no-caps label="Installer" :to="app.to" />
                </article>
              </div>
            </div>
          </section>

          <section
            id="features"
            class="feature-grid"
            aria-label="Avantages OneInstall"
          >
            <article
              v-for="feature in features"
              :key="feature.title"
              class="glass-panel feature-card"
            >
              <q-icon :name="feature.icon" :style="{ color: feature.color }" />
              <h3>{{ feature.title }}</h3
              ><p>{{ feature.text }}</p>
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
              :style="{ background: selectedCategory === category.label ? 'rgba(99, 102, 241, 0.2)' : '', borderColor: selectedCategory === category.label ? 'var(--primary)' : '' }"
              @click="selectCategory(category.label)"
            >
              <span
                ><q-icon
                  :name="category.icon"
                  :style="{ color: category.color }"
                />{{ category.label }}</span
              ><q-icon name="chevron_right" />
            </a>
          </section>

          <section id="business" class="developer-card">
            <q-icon name="developer_mode" class="developer-watermark" />
            <h2>Développeur ?</h2>
            <p
              >Publiez votre application sur OneInstall et touchez des millions
              d’utilisateurs avec notre runtime universel.</p
            >
            <q-btn unelevated no-caps label="Commencer" to="/developer" />
          </section>

          <section id="trending" class="glass-panel side-card trending-card">
            <header
              ><h2>Top tendances</h2><a href="#popular">Voir tout</a></header
            >
            <article
              v-for="(app, index) in trendingApps"
              :key="app.name"
              class="trend-row cursor-pointer"
              @click="router.push(app.to)"
            >
              <b>{{ index + 1 }}</b>
              <div class="trend-icon" :style="{ background: app.gradient }">
                <q-icon :name="app.icon" />
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
      <p>© {{ currentYear }} OneInstall. Tous droits réservés.</p>
      <nav
        ><a href="#business">À propos</a><a href="#">Confidentialité</a
        ><a href="#">Conditions</a><a href="#">Support</a></nav
      >
    </footer>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/boot/axios'

const route = useRoute()
const router = useRouter()
const currentYear = new Date().getFullYear()
const activeSearch = computed(() => String(route.query.search || '').trim())

const rawApps = ref([])
const loading = ref(false)
const selectedCategory = ref('')

const getGradient = (category) => {
  switch (category) {
    case 'Jeux': return 'linear-gradient(135deg, #f12711, #f5af19)'
    case 'Productivité': return 'linear-gradient(135deg, #2980b9, #6dd5fa)'
    case 'Social': return 'linear-gradient(135deg, #8e2de2, #4a00e0)'
    default: return 'linear-gradient(135deg, #11998e, #38ef7d)'
  }
}

const getIcon = (category) => {
  switch (category) {
    case 'Jeux': return 'sports_esports'
    case 'Productivité': return 'task_alt'
    case 'Social': return 'forum'
    default: return 'widgets'
  }
}

async function fetchApps() {
  loading.value = true
  try {
    const params = {}
    if (activeSearch.value) params.search = activeSearch.value
    if (selectedCategory.value) params.category = selectedCategory.value

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
    category: app.category,
    rating: app.average_rating || '5.0',
    initials: app.name.substring(0, 3).toUpperCase(),
    gradient: getGradient(app.category),
    icon: getIcon(app.category),
    to: '/apps/' + app.id
  }))
})

const filteredApps = computed(() => {
  return popularApps.value
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
    gradient: 'linear-gradient(135deg, #f12711, #f5af19)'
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
    color: '#8f91ff'
  },
  {
    icon: 'sync',
    title: 'Mises à jour auto',
    text: 'Vos applications sont toujours à jour.',
    color: '#22c9e6'
  },
  {
    icon: 'security',
    title: 'Sécurisé et fiable',
    text: 'Contrôlé et certifié par OneInstall.',
    color: '#bb75f2'
  },
  {
    icon: 'public',
    title: 'Fait en Afrique',
    text: 'Une solution pensée pour le monde.',
    color: '#f2b84b'
  }
]

const categories = [
  { label: 'Jeux', icon: 'sports_esports', color: '#f5b041' },
  { label: 'Productivité', icon: 'task_alt', color: '#22c9e6' },
  { label: 'Social', icon: 'forum', color: '#a569bd' },
  { label: 'Utilitaires', icon: 'widgets', color: '#5dade2' }
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
  gap: 20px;
  padding: 20px 24px;
}
.glass-panel {
  background: var(--glass);
  border: 1px solid var(--outline);
  box-shadow: 0 12px 30px rgba(4, 9, 25, 0.06);
  backdrop-filter: blur(16px);
}
.hero-panel {
  position: relative;
  min-height: 280px;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 24px 4% 24px 6%;
  background: linear-gradient(
    105deg,
    var(--surface-low) 0%,
    var(--surface) 57%,
    color-mix(in srgb, var(--secondary) 18%, var(--surface)) 100%
  );
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(4, 8, 24, 0.1);
}
.hero-copy {
  position: relative;
  z-index: 3;
  max-width: 580px;
}
.eyebrow,
.section-kicker {
  color: var(--primary);
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
  color: var(--surface-low);
  background: var(--text);
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
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--primary) 30%, transparent),
    transparent 68%
  );
}
.hero-orb-two {
  bottom: -150px;
  left: 30%;
  width: 300px;
  height: 300px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, #22c9e6 18%, transparent),
    transparent 68%
  );
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
  background: linear-gradient(
    160deg,
    var(--surface-low),
    color-mix(in srgb, var(--surface-high) 87%, #0b1326)
  );
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
  color: var(--primary-text);
  background: linear-gradient(135deg, var(--primary-soft), var(--primary));
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
  color: #3ddc84;
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
  color: var(--primary);
  animation-delay: -2.2s;
}
.platform-badge.windows {
  right: 12px;
  bottom: 40px;
  color: #00a4ef;
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
  gap: 20px;
}
.main-column,
.aside-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  color: var(--primary);
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
  border-radius: 12px;
  transition:
    transform 0.2s,
    background 0.2s,
    border-color 0.2s;
}
.app-card:hover {
  transform: translateY(-3px);
  background: var(--surface-high);
  border-color: color-mix(in srgb, var(--primary) 35%, transparent);
}
.app-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 8px;
  color: #fff;
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
  color: #4cd7f6;
  font-size: 12px;
}
.app-card .q-btn {
  width: 100%;
  min-height: 28px;
  margin-top: auto;
  color: var(--primary);
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
  background:
    radial-gradient(circle at 70% 20%, #5aa7ff 0, #20377b 25%, #091a35 67%),
    #0d1834;
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.featured-game::after {
  content: '';
  position: absolute;
  inset: 45% 0 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0 1px,
      transparent 1px 40px
    ),
    linear-gradient(#177d43, #0e5431);
  transform: perspective(350px) rotateX(28deg) scale(1.2);
  transform-origin: bottom;
}
.stadium-lights {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 10% 18%,
      rgba(255, 255, 255, 0.8),
      transparent 8%
    ),
    radial-gradient(
      ellipse at 90% 18%,
      rgba(255, 255, 255, 0.7),
      transparent 8%
    );
  opacity: 0.35;
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
  color: #fff;
  background: linear-gradient(
    0deg,
    rgba(4, 9, 28, 0.95),
    rgba(4, 9, 28, 0.1) 78%
  );
}
.featured-overlay h3 {
  margin: 2px 0 1px;
  font-size: 15px;
}
.featured-overlay p {
  margin: 0 0 4px;
  color: #c4cbdf;
  font-size: 10px;
}
.feature-tag {
  color: #8eecff;
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
  color: #b8c0d3;
  font-weight: 400;
}
.featured-overlay .q-btn {
  color: var(--primary-text);
  background: #c0c1ff;
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
  color: #fff;
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
  color: var(--primary);
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
  border-radius: 10px;
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
  border-radius: 12px;
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
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 18%, var(--surface)),
    color-mix(in srgb, var(--secondary) 22%, var(--surface))
  );
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
  border-radius: 12px;
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
  color: var(--primary-text);
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
  color: var(--primary);
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
  color: #fff;
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
  color: var(--primary);
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
    gap: 16px;
    padding: 12px;
  }
  .hero-panel {
    min-height: 320px;
    align-items: flex-start;
    padding: 24px 16px;
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
    bottom: -110px;
    transform: translateX(50%) scale(0.58);
  }
  .content-grid,
  .main-column {
    gap: 16px;
  }
  .app-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .app-card:last-child {
    display: flex;
  }
  .aside-column {
    display: flex;
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
    padding: 20px 12px;
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
</style>
