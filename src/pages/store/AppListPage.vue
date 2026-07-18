<template>
  <q-page class="app-list-page">
    <main class="list-content">
      <!-- Back Button -->
      <q-btn
        flat
        no-caps
        icon="arrow_back"
        label="Retour à l'accueil"
        class="back-btn q-mb-md"
        to="/"
      />

      <!-- Title & Kicker -->
      <header class="list-header q-mb-lg">
        <span class="eyebrow"
          ><q-icon name="auto_awesome" /> {{ subtitle }}</span
        >
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </header>

      <div class="content-grid">
        <!-- Main Column -->
        <div class="main-column">
          <div class="search-bar-row q-mb-md">
            <label class="list-search">
              <q-icon name="search" />
              <input
                v-model="search"
                type="search"
                placeholder="Rechercher une application dans cette liste..."
                aria-label="Rechercher"
                @input="debouncedFetch"
              />
            </label>
          </div>

          <div v-if="loading" class="row justify-center q-my-xl">
            <q-spinner-orbit color="indigo" size="48px" />
          </div>

          <div v-else-if="apps.length" class="app-grid">
            <article
              v-for="app in apps"
              :key="app.id"
              class="glass-panel app-card cursor-pointer"
              @click="router.push('/apps/' + app.id)"
            >
              <div class="app-icon" :style="{ background: app.gradient }">
                <q-icon v-if="app.icon" :name="app.icon" />
                <strong v-else>{{ app.initials }}</strong>
              </div>
              <h3>{{ app.name }}</h3>
              <p>{{ app.category }}</p>
              <div class="rating">
                <q-icon name="star" /><span>{{ app.rating }}</span>
              </div>
              <q-btn
                unelevated
                no-caps
                icon="visibility"
                label="Détails"
                :to="'/apps/' + app.id"
              />
            </article>
          </div>

          <div v-else class="empty-state glass-panel">
            <q-icon name="search_off" />
            <h3>Aucune application trouvée</h3>
            <p>Essayez une autre recherche ou filtre.</p>
          </div>
        </div>

        <!-- Sidebar Column (Category filter) -->
        <aside class="aside-column">
          <section id="categories" class="glass-panel side-card">
            <header>
              <h2>Catégories</h2>
              <a
                href="#"
                @click.prevent="selectCategory('')"
                v-if="selectedCategory"
                >Réinitialiser</a
              >
            </header>
            <a
              v-for="category in categories"
              :key="category.label"
              href="#"
              class="category-row"
              :style="{
                background:
                  selectedCategory === category.label
                    ? 'rgba(99, 102, 241, 0.2)'
                    : '',
                borderColor:
                  selectedCategory === category.label ? 'var(--primary)' : ''
              }"
              @click.prevent="selectCategory(category.label)"
            >
              <span>
                <q-icon
                  :name="category.icon"
                  :style="{ color: category.color }"
                />
                {{ category.label }}
              </span>
              <q-icon name="chevron_right" />
            </a>
          </section>
        </aside>
      </div>
    </main>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/boot/axios'

const route = useRoute()
const router = useRouter()

const apps = ref([])
const loading = ref(false)
const search = ref('')
const selectedCategory = ref('')

const filterType = computed(() => {
  const path = route.path
  if (path.includes('recommended')) return 'recommended'
  if (path.includes('trending')) return 'trending'
  if (path.includes('popular')) return 'popular'
  return 'popular'
})

const title = computed(() => {
  switch (filterType.value) {
    case 'recommended':
      return 'Recommandé pour vous'
    case 'trending':
      return 'Top tendances'
    case 'popular':
      return 'Applications populaires'
    default:
      return 'Applications'
  }
})

const subtitle = computed(() => {
  switch (filterType.value) {
    case 'recommended':
      return 'Sélection OneInstall'
    case 'trending':
      return 'En hausse en ce moment'
    case 'popular':
      return 'Les incontournables'
    default:
      return 'Store'
  }
})

const description = computed(() => {
  switch (filterType.value) {
    case 'recommended':
      return 'Des applications et jeux triés sur le volet pour leur qualité et leur utilité au quotidien.'
    case 'trending':
      return 'Les applications qui connaissent la plus forte croissance de téléchargement ces derniers jours.'
    case 'popular':
      return 'Les applications les plus téléchargées et les mieux notées par la communauté OneInstall.'
    default:
      return 'Parcourez la liste des applications.'
  }
})

const getGradient = category => {
  switch (category) {
    case 'Jeux':
      return 'linear-gradient(135deg, #f12711, #f5af19)'
    case 'Productivité':
      return 'linear-gradient(135deg, #2980b9, #6dd5fa)'
    case 'Social':
      return 'linear-gradient(135deg, #8e2de2, #4a00e0)'
    default:
      return 'linear-gradient(135deg, #11998e, #38ef7d)'
  }
}

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
    const params = {
      filter: filterType.value
    }
    if (search.value.trim()) params.search = search.value.trim()
    if (selectedCategory.value) params.category = selectedCategory.value

    const response = await api.get('/apps', { params })
    const data = response.data.data || response.data || []

    apps.value = data.map(app => ({
      id: app.id,
      name: app.name,
      category: app.category,
      rating: app.average_rating || '5.0',
      initials: app.name.substring(0, 3).toUpperCase(),
      gradient: getGradient(app.category),
      icon: getIcon(app.category)
    }))
  } catch (err) {
    console.error('Error fetching applications list', err)
  } finally {
    loading.value = false
  }
}

let timeoutId = null
function debouncedFetch() {
  if (timeoutId) clearTimeout(timeoutId)
  timeoutId = setTimeout(() => {
    fetchApps()
  }, 300)
}

function selectCategory(categoryName) {
  if (selectedCategory.value === categoryName) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = categoryName
  }
  fetchApps()
}

watch(
  () => route.path,
  () => {
    search.value = ''
    selectedCategory.value = ''
    fetchApps()
  }
)

onMounted(() => {
  fetchApps()
})

const categories = [
  { label: 'Jeux', icon: 'sports_esports', color: '#f5b041' },
  { label: 'Productivité', icon: 'task_alt', color: '#22c9e6' },
  { label: 'Social', icon: 'forum', color: '#a569bd' },
  { label: 'Utilitaires', icon: 'widgets', color: '#5dade2' }
]
</script>

<style scoped lang="scss">
.app-list-page {
  min-height: 100vh;
  color: var(--text);
  background: var(--page);
}
.list-content {
  padding: 28px clamp(16px, 3vw, 40px) 48px;
}
.back-btn {
  color: var(--primary);
}
.list-header {
  max-width: 800px;
  padding: 22px 24px;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--primary) 9%, var(--surface-low)),
    var(--surface-low)
  );
  border: 1px solid var(--outline);
  border-radius: 18px;
  box-shadow: var(--ui-shadow-sm);
}
.eyebrow {
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
}
.list-header h1 {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  line-height: 1.1;
  color: var(--text);
  letter-spacing: -0.03em;
}
.list-header p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
.glass-panel {
  background: var(--glass);
  border: 1px solid var(--outline);
  box-shadow: 0 12px 30px rgba(4, 9, 25, 0.06);
  backdrop-filter: blur(16px);
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
}
.search-bar-row {
  width: 100%;
}
.list-search {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.list-search .q-icon {
  position: absolute;
  left: 17px;
  color: var(--muted);
  font-size: 21px;
}
.list-search input {
  width: 100%;
  height: 46px;
  padding: 0 18px 0 48px;
  color: var(--text);
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 999px;
  outline: none;
  font: inherit;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.list-search input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
}
.app-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 12px 12px;
  border-radius: 15px;
  transition:
    transform 0.25s var(--ui-ease),
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}
.app-card:hover {
  box-shadow: var(--ui-shadow-md);
  transform: translateY(-5px);
  background: var(--surface-high);
  border-color: color-mix(in srgb, var(--primary) 35%, transparent);
}
.app-icon {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  color: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(2, 5, 20, 0.18);
}
.app-icon .q-icon {
  font-size: 28px;
}
.app-icon strong {
  font-size: 18px;
}
.app-card h3 {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-card p {
  margin: 2px 0;
  color: var(--muted);
  font-size: 11px;
}
.rating {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 11px;
}
.rating .q-icon {
  color: #4cd7f6;
  font-size: 13px;
}
.app-card .q-btn {
  width: 100%;
  min-height: 30px;
  margin-top: auto;
  color: var(--primary);
  background: var(--surface-highest);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
}
.empty-state {
  padding: 40px 20px;
  color: var(--muted);
  text-align: center;
  border-radius: 12px;
}
.empty-state > .q-icon {
  font-size: 48px;
}
.empty-state h3 {
  margin: 8px 0 4px;
  color: var(--text);
  font-size: 16px;
}
.empty-state p {
  margin: 0;
  font-size: 12px;
}
.side-card {
  padding: 16px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.side-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.side-card h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text);
}
.side-card header a {
  color: var(--primary);
  font-size: 11px;
  text-decoration: none;
  font-weight: 700;
}
.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: 0.18s;
}
.category-row:hover {
  background: var(--surface-high);
  border-color: var(--outline);
}
.category-row span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.category-row span .q-icon {
  font-size: 16px;
}
.category-row > .q-icon {
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 1023px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 767px) {
  .app-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 480px) {
  .app-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .list-content {
    padding-inline: 12px;
  }
  .list-header {
    padding: 18px;
  }
}
</style>
