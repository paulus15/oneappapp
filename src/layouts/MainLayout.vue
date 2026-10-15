<template>
  <q-layout
    view="lHh Lpr lFf"
    class="one-layout"
    :class="{ 'theme-dark': isDark }"
  >
    <q-header class="one-header">
      <q-toolbar class="one-toolbar">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="menu-button lt-md"
          :aria-label="ui('Ouvrir la navigation')"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <router-link
          to="/"
          class="mobile-brand lt-md"
          :aria-label="ui('PWA Store, accueil')"
        >
          <BrandLogo compact />
          <span class="mobile-brand-name" aria-hidden="true"
            >PWA <b>Store</b></span
          >
        </router-link>

        <router-link
          to="/"
          class="desktop-brand gt-sm"
          :aria-label="ui('PWA Store, accueil')"
          ><BrandLogo
        /></router-link>
        <div class="header-search">
          <q-icon name="search" />
          <input
            v-model="search"
            type="search"
            :placeholder="
              $q.screen.lt.sm
                ? ui('Rechercher')
                : ui('Rechercher une application, un jeu, une entreprise...')
            "
            :aria-label="ui('Rechercher')"
            @focus="searchFocused = true"
            @blur="onSearchBlur"
            @keyup.enter="submitSearch"
          />

          <!-- Search Overlay Suggestions / History -->
          <div
            v-if="searchFocused && (suggestions.length || searchHistory.length)"
            class="search-overlay-box glass-panel"
          >
            <!-- Autocomplete Suggestions -->
            <div v-if="suggestions.length > 0" class="search-section">
              <div class="search-section-title"
                ><q-icon name="auto_awesome" /> {{ ui('Suggestions') }}</div
              >
              <div class="search-suggestions-list">
                <div
                  v-for="sug in suggestions"
                  :key="sug"
                  class="search-item cursor-pointer"
                  @mousedown="selectSearchTerm(sug)"
                >
                  <q-icon name="search" />
                  <span>{{ sug }}</span>
                </div>
              </div>
            </div>

            <!-- Search History -->
            <div v-if="searchHistory.length > 0" class="search-section">
              <div
                class="search-section-title row justify-between items-center"
              >
                <span
                  ><q-icon name="history" /> {{ ui('Historique récent') }}</span
                >
                <q-btn
                  flat
                  dense
                  no-caps
                  :label="ui('Effacer')"
                  class="clear-history-btn"
                  @mousedown="clearHistory"
                />
              </div>
              <div class="search-history-list">
                <div
                  v-for="(hist, index) in searchHistory"
                  :key="index"
                  class="search-item row justify-between items-center cursor-pointer"
                  @mousedown="selectSearchTerm(hist)"
                >
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="history" />
                    <span>{{ hist }}</span>
                  </div>
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    size="xs"
                    class="remove-history-btn"
                    @mousedown.stop="removeHistoryItem(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav class="top-links gt-md" :aria-label="t('store.nav.primary')">
          <router-link
            v-for="item in mainNavigation"
            :key="item.key"
            :to="item.to"
            :class="{ active: isActive(item) }"
            >{{ t(`nav.${item.key}`) }}</router-link
          >
          <router-link to="/developers">{{ ui('Développeurs') }}</router-link>
        </nav>

        <div class="header-actions">
          <button
            class="icon-action language-action gt-xs"
            type="button"
            :aria-label="t('language.change')"
            :title="t('language.change')"
          >
            <q-icon name="language" />
            <span>{{ activeLocale.short }}</span>
            <q-menu auto-close>
              <q-list style="min-width: 150px">
                <q-item
                  v-for="l in LOCALES"
                  :key="l.value"
                  clickable
                  :active="l.value === locale"
                  role="menuitemradio"
                  :aria-checked="l.value === locale"
                  :lang="l.value"
                  @click="setLocale(l.value)"
                >
                  <q-item-section>{{ l.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </button>
          <button
            class="icon-action gt-xs"
            type="button"
            :aria-label="
              isDark
                ? ui('Activer le thème clair')
                : ui('Activer le thème sombre')
            "
            :title="isDark ? ui('Thème clair') : ui('Thème sombre')"
            @click="toggleTheme"
          >
            <transition name="theme-swap" mode="out-in">
              <q-icon
                :key="isDark ? 'light' : 'dark'"
                :name="isDark ? 'light_mode' : 'dark_mode'"
              />
            </transition>
          </button>
          <CountryChoice class="gt-xs" />
          <NotificationBell />

          <template v-if="authStore.isAuthenticated">
            <q-btn flat no-caps class="profile-button">
              <q-avatar size="38px" class="profile-avatar">
                {{ authStore.userName?.charAt(0).toUpperCase() || 'U' }}
              </q-avatar>
              <span class="profile-copy gt-sm">
                <strong>{{ authStore.userName }}</strong>
                <small>{{ authStore.user?.role || ui('Membre') }}</small>
              </span>
              <q-icon name="expand_more" class="gt-sm" />
              <q-menu auto-close class="profile-menu">
                <q-list style="min-width: 180px">
                  <q-item clickable to="/account">
                    <q-item-section avatar
                      ><q-icon name="person_outline"
                    /></q-item-section>
                    <q-item-section>{{ ui('Mon espace') }}</q-item-section>
                  </q-item>
                  <q-item clickable class="text-negative" @click="handleLogout">
                    <q-item-section avatar
                      ><q-icon name="logout"
                    /></q-item-section>
                    <q-item-section>{{ ui('Déconnexion') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </template>
          <q-btn
            v-else
            flat
            round
            icon="person_outline"
            to="/login"
            class="icon-action login-action"
            :aria-label="ui('Se connecter')"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="272"
      :breakpoint="1024"
      class="one-drawer"
    >
      <div class="drawer-content">
        <router-link
          to="/"
          class="brand"
          :aria-label="ui('PWA Store, accueil')"
        >
          <BrandLogo />
        </router-link>

        <p class="drawer-label drawer-label-first">{{ ui('Explorer') }}</p>
        <q-list class="navigation-list">
          <q-item
            v-for="item in mainNavigation"
            :key="item.key"
            clickable
            v-ripple
            :to="item.to"
            :exact="item.to === '/'"
            active-class="nav-active"
            @click="handleNavigation"
          >
            <q-item-section avatar>
              <span class="nav-icon"><q-icon :name="item.icon" /></span>
            </q-item-section>
            <q-item-section>{{ t(`nav.${item.key}`) }}</q-item-section>
            <q-item-section v-if="item.badge" side>
              <q-badge rounded :label="item.badge" class="nav-badge" />
            </q-item-section>
          </q-item>
        </q-list>

        <template v-if="authStore.isAdmin">
          <p class="drawer-label">{{ ui('Administration') }}</p>
          <router-link to="/admin" class="developer-entry">
            <span class="developer-entry-icon"
              ><q-icon name="admin_panel_settings"
            /></span>
            <span class="developer-entry-copy">
              <strong>{{ ui('Back-office') }}</strong>
              <small>{{ ui('Modération, comptes et journal') }}</small>
            </span>
            <q-icon name="arrow_forward" class="developer-entry-arrow" />
          </router-link>
        </template>

        <p class="drawer-label">{{ ui('Espace développeur') }}</p>
        <router-link to="/developer/profile" class="developer-entry">
          <span class="developer-entry-icon"><q-icon name="terminal" /></span>
          <span class="developer-entry-copy">
            <strong>{{ ui('Espace développeur') }}</strong>
            <small>{{ t('nav.developerSpaceHint') }}</small>
          </span>
          <q-icon name="arrow_forward" class="developer-entry-arrow" />
        </router-link>

        <!-- Help and feedback: same look as the navigation entries. -->
        <p class="drawer-label">{{ ui('Aide et avis') }}</p>
        <q-list class="navigation-list">
          <q-item clickable v-ripple to="/help" @click="handleNavigation">
            <q-item-section avatar>
              <span class="nav-icon"><q-icon name="help_outline" /></span>
            </q-item-section>
            <q-item-section>{{ ui('Centre d’aide') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="openFeedback">
            <q-item-section avatar>
              <span class="nav-icon"><q-icon name="forum" /></span>
            </q-item-section>
            <q-item-section>{{ ui('Donner mon avis') }}</q-item-section>
          </q-item>
        </q-list>
        <!-- Feedback about the platform, read by the PWA Store team only. -->
        <SuggestionButton ref="feedback" platform hide-trigger />

        <!-- Phone settings (the header keeps them on larger screens). -->
        <template v-if="$q.screen.lt.sm">
          <p class="drawer-label">{{ ui('Préférences') }}</p>
          <q-list class="navigation-list drawer-prefs">
            <q-item clickable v-ripple @click="toggleTheme">
              <q-item-section avatar>
                <span class="nav-icon"
                  ><q-icon :name="isDark ? 'light_mode' : 'dark_mode'"
                /></span>
              </q-item-section>
              <q-item-section>{{ ui('Thème sombre') }}</q-item-section>
              <q-item-section side>
                <q-toggle
                  :model-value="isDark"
                  dense
                  :aria-label="ui('Thème sombre')"
                  @update:model-value="toggleTheme"
                  @click.stop
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <span class="nav-icon"><q-icon name="language" /></span>
              </q-item-section>
              <q-item-section>{{ ui('Langue') }}</q-item-section>
              <q-item-section side>
                <q-btn-toggle
                  :model-value="locale"
                  :options="
                    LOCALES.map(l => ({ label: l.short, value: l.value }))
                  "
                  :aria-label="t('language.label')"
                  dense
                  unelevated
                  no-caps
                  rounded
                  toggle-color="primary"
                  class="lang-toggle"
                  @update:model-value="setLocale"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <span class="nav-icon"><q-icon name="public" /></span>
              </q-item-section>
              <q-item-section>{{ ui('Pays') }}</q-item-section>
              <q-item-section side>
                <CountryChoice pill />
              </q-item-section>
            </q-item>
          </q-list>
        </template>

        <!-- Everything below sits at the bottom of the menu. -->
        <div class="drawer-spacer" />

        <div class="publish-card">
          <span class="publish-glow" />
          <span class="publish-icon"><q-icon name="rocket_launch" /></span>
          <strong>{{ ui('Publiez votre application') }}</strong>
          <p>
            {{
              ui(
                'Proposez vos PWA et suivez leur publication depuis votre espace.'
              )
            }}
          </p>
          <q-btn
            unelevated
            no-caps
            :label="ui('Commencer')"
            to="/developer/activate"
          />
        </div>

        <q-btn
          v-if="canInstallStore"
          unelevated
          no-caps
          color="primary"
          class="full-width text-weight-bold q-mt-sm"
          icon="add_to_home_screen"
          :label="ui('Installer PWA Store')"
          @click="promptInstallStore"
        />
      </div>
    </q-drawer>

    <q-page-container class="page-container">
      <CountryMissingBanner />
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <nav
      class="mobile-bottom-nav lt-md"
      :aria-label="ui('Navigation mobile principale')"
    >
      <q-btn
        v-for="item in mobileNavigation"
        :key="item.key"
        flat
        no-caps
        :icon="item.icon"
        :label="item.label"
        :to="item.to"
        :class="{ active: item.active }"
        :aria-current="item.active ? 'page' : undefined"
      />
    </nav>
  </q-layout>
</template>

<script setup>
import { ui } from '@/i18n/text'

import NotificationBell from '@/components/NotificationBell.vue'
import CountryChoice from '@/components/CountryChoice.vue'
import SuggestionButton from '@/components/SuggestionButton.vue'
import CountryMissingBanner from '@/components/CountryMissingBanner.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import { useTheme } from '@/composables/useTheme'
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/boot/axios'
import { useI18n } from 'vue-i18n'
import { LOCALES, setLocale } from '@/i18n'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)
const search = ref('')
const { isDark, toggleTheme } = useTheme()
const { t, locale } = useI18n()
const activeLocale = computed(
  () => LOCALES.find(l => l.value === locale.value) || LOCALES[0]
)

const searchFocused = ref(false)
const searchHistory = ref([])
const suggestions = ref([])
// The auth store clears the stored history on sign-out; forget the copy on screen too.
watch(
  () => authStore.isAuthenticated,
  signedIn => {
    if (!signedIn) searchHistory.value = []
  }
)

const deferredInstallPrompt = ref(null)
const canInstallStore = computed(() => !!deferredInstallPrompt.value)

// Découvrir · Applications · Catégories · Classements: one entry per destination.
const mainNavigation = [
  { key: 'discover', icon: 'explore', to: '/' },
  { key: 'applications', icon: 'apps', to: '/applications' },
  { key: 'categories', icon: 'category', to: '/categories' },
  { key: 'rankings', icon: 'leaderboard', to: '/rankings' }
]
// Phone bar, as in a native store: Home, Categories, Favourites, Profile.
// Signed-out visitors are sent to the sign-in page, then back to what they asked for.
const mobileNavigation = computed(() => {
  const signedIn = authStore.isAuthenticated
  const onAccount = route.path === '/account'
  const accountTab = route.query.tab || 'activity'
  const favorites = '/account?tab=favorites'
  return [
    {
      key: 'home',
      icon: 'home',
      label: ui('Accueil'),
      to: '/',
      active: route.path === '/'
    },
    {
      key: 'categories',
      icon: 'grid_view',
      label: ui('Catégories'),
      to: '/categories',
      active: route.path.startsWith('/categories')
    },
    {
      key: 'favorites',
      icon: 'favorite_border',
      label: ui('Favoris'),
      to: signedIn
        ? favorites
        : { path: '/login', query: { redirect: favorites } },
      active: onAccount && accountTab === 'favorites'
    },
    {
      key: 'profile',
      icon: 'person_outline',
      label: ui('Profil'),
      to: signedIn ? '/account' : '/login',
      active:
        (onAccount && accountTab !== 'favorites') || route.path === '/login'
    }
  ]
})
const isActive = item =>
  item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)

onMounted(() => {
  search.value = String(route.query.search || '')

  // Load search history
  try {
    const history = localStorage.getItem('oneapp_search_history')
    if (history) searchHistory.value = JSON.parse(history)
  } catch {
    try {
      localStorage.removeItem('oneapp_search_history')
    } catch {
      // Storage unavailable: the history simply starts empty.
    }
  }

  // Listen to PWA installation events (removed on unmount: the layout is mounted again
  // after visiting the sign-in or developer layouts, and must not stack listeners).
  window.addEventListener('beforeinstallprompt', onInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})

function onInstallPrompt(e) {
  e.preventDefault()
  deferredInstallPrompt.value = e
}
function onAppInstalled() {
  deferredInstallPrompt.value = null
  $q.notify({
    type: 'positive',
    get message() {
      return ui('PWA Store a été installé avec succès sur votre appareil !')
    }
  })
}

// Watch search query for autocomplete suggestions
watch(search, async newVal => {
  const query = String(newVal || '').trim()
  if (query.length < 2) {
    suggestions.value = []
    return
  }
  try {
    const response = await api.get('/apps/suggestions', {
      params: { search: query }
    })
    suggestions.value = response.data || []
  } catch (err) {
    console.error('Error fetching search suggestions', err)
  }
})

function onSearchBlur() {
  setTimeout(() => {
    searchFocused.value = false
  }, 200)
}

function selectSearchTerm(term) {
  search.value = term
  submitSearch()
}

function submitSearch() {
  const query = search.value.trim()
  if (query) {
    // Add to history
    if (!searchHistory.value.includes(query)) {
      searchHistory.value.unshift(query)
      if (searchHistory.value.length > 5) {
        searchHistory.value.pop()
      }
      localStorage.setItem(
        'oneapp_search_history',
        JSON.stringify(searchHistory.value)
      )
    }
  }
  router.push({
    path: '/',
    query: query ? { search: query } : {}
  })
}

function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem('oneapp_search_history')
}

function removeHistoryItem(index) {
  searchHistory.value.splice(index, 1)
  localStorage.setItem(
    'oneapp_search_history',
    JSON.stringify(searchHistory.value)
  )
}

function handleNavigation() {
  if ($q.screen.lt.md) leftDrawerOpen.value = false
}

const feedback = ref(null)
function openFeedback() {
  handleNavigation()
  feedback.value?.open()
}

async function handleLogout() {
  if (await authStore.logout()) router.push('/')
}

async function promptInstallStore() {
  if (!deferredInstallPrompt.value) return
  deferredInstallPrompt.value.prompt()
  await deferredInstallPrompt.value.userChoice
  deferredInstallPrompt.value = null
}
</script>

<style lang="scss">
.one-layout {
  color: var(--text);
  background: var(--page);
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  transition:
    background-color 0.25s ease,
    color 0.25s ease;
}

.one-header {
  left: 272px;
  max-width: 100vw;
  color: var(--text);
  background: color-mix(in srgb, var(--surface-highest) 64%, transparent);
  border-bottom: 1px solid var(--outline);
  box-shadow: none;
  backdrop-filter: blur(18px);
}

.one-toolbar {
  width: 100%;
  min-width: 0;
  min-height: 64px;
  padding: 0 20px;
  gap: 14px;
}
.header-search {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 650px;
  z-index: 20;
}
.header-search .q-icon {
  position: absolute;
  left: 17px;
  z-index: 1;
  color: var(--muted);
  font-size: 21px;
}
.header-search input {
  width: 100%;
  height: 42px;
  padding: 0 18px 0 48px;
  color: var(--text);
  background: var(--surface-highest);
  border: 1px solid var(--outline);
  border-radius: 999px;
  outline: none;
  font: inherit;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.search-overlay-box {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.search-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.search-section-title {
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 4px;
}
.clear-history-btn {
  font-size: 9px;
  color: var(--pwa-link);
  padding: 0;
  min-height: 0;
}
.search-suggestions-list,
.search-history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--surface-high);
  }

  .q-icon {
    position: static;
    font-size: 16px;
    color: var(--muted);
  }
}
.remove-history-btn {
  color: var(--muted);
  opacity: 0.7;

  &:hover {
    color: var(--text);
    opacity: 1;
  }
}
.header-search input::placeholder {
  color: var(--muted);
  opacity: 0.72;
}
.header-search input:focus {
  border-color: var(--pwa-link);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
}
.top-links {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-left: auto;
}
.top-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}
.top-links a:hover,
.top-links a.active {
  color: var(--pwa-link);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.icon-action {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.2s ease;
}
.icon-action:hover {
  color: var(--text);
  background: var(--surface-highest);
}
.language-action {
  width: auto;
  padding: 0 10px;
  font-weight: 700;
}
.notification-action {
  position: relative;
}
.notification-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pwa-accent);
  box-shadow: 0 0 0 2px var(--surface-highest);
}
.profile-button {
  color: var(--text);
  border-radius: 12px;
  padding: 4px 6px;
}
.profile-avatar {
  color: var(--pwa-on-primary);
  font-weight: 800;
  background: var(--primary);
}
.profile-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0 8px;
  line-height: 1.25;
}
.profile-copy strong {
  font-size: 13px;
}
.profile-copy small {
  color: var(--muted);
  font-size: 11px;
  text-transform: capitalize;
}
.profile-menu {
  color: var(--text);
  background: var(--surface-low);
}

.one-drawer {
  color: var(--text);
  background: color-mix(in srgb, var(--surface-low) 95%, var(--page));
  border-right: 1px solid var(--outline) !important;
  box-shadow: 12px 0 36px rgba(5, 12, 30, 0.04);
}
.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 10px 10px 14px;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-highest) transparent;
}
.brand,
.mobile-brand {
  display: flex;
  align-items: center;
  color: var(--text);
  text-decoration: none;
}
.brand {
  gap: 12px;
  min-height: 52px;
  padding: 4px 10px;
  margin-bottom: 12px;
  border-radius: 13px;
  transition: background-color 0.2s ease;
}
.brand:hover {
  background: color-mix(in srgb, var(--surface-high) 65%, transparent);
}
.brand-mark {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 13px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 22%, transparent);
}
.brand-mark .q-icon {
  font-size: 23px;
}
.brand > span:last-child:not(.pwa-brand) {
  display: flex;
  flex-direction: column;
}
.brand strong {
  font-size: 19px;
  letter-spacing: -0.6px;
}
.brand small {
  margin-top: 1px;
  color: var(--muted);
  font-size: 11px;
}
.navigation-list .q-item {
  position: relative;
  min-height: 43px;
  margin: 2px 0;
  padding: 0 11px;
  color: var(--muted);
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 650;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}
.navigation-list .q-item:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--surface-high) 70%, transparent);
  border-color: var(--outline);
  transform: translateX(2px);
}
.navigation-list .q-item__section--avatar {
  min-width: 42px;
}
.nav-icon {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--surface-highest) 56%, transparent);
  border: 1px solid color-mix(in srgb, var(--outline) 68%, transparent);
  border-radius: 9px;
  transition: 0.18s ease;
}
.navigation-list .q-icon {
  font-size: 19px;
}
.navigation-list .nav-active {
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 12%, var(--surface-low));
  border-color: color-mix(in srgb, var(--primary) 20%, transparent);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 8%, transparent);
}
.navigation-list .nav-active::before {
  position: absolute;
  left: -1px;
  width: 3px;
  height: 22px;
  background: var(--primary);
  border-radius: 0 4px 4px 0;
  content: '';
}
.navigation-list .nav-active .nav-icon {
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 14%, var(--surface-low));
  border-color: color-mix(in srgb, var(--primary) 22%, transparent);
}
.nav-badge {
  min-width: 20px;
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 13%, var(--surface));
  font-size: 9px;
  font-weight: 800;
}
.drawer-spacer {
  flex: 1 1 auto;
  min-height: 16px;
}
.drawer-prefs .q-item__section--side {
  padding-left: 8px;
}
.one-drawer .drawer-prefs .country-pill {
  max-width: 130px;
  min-height: 32px;
  padding: 0 10px;
  font-size: 12.5px;
  box-shadow: none;
  border: 1px solid var(--outline);
}
.lang-toggle {
  border: 1px solid var(--outline);
}
.drawer-label {
  margin: 16px 12px 6px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.drawer-label-first {
  margin-top: 0;
}
.developer-entry {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 56px;
  padding: 8px 10px;
  color: var(--text);
  background: color-mix(in srgb, var(--primary) 9%, var(--surface-low));
  border: 1px solid color-mix(in srgb, var(--primary) 17%, var(--outline));
  border-radius: 13px;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.developer-entry:hover {
  border-color: color-mix(in srgb, var(--primary) 38%, transparent);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary) 10%, transparent);
  transform: translateY(-1px);
}
.developer-entry-icon {
  width: 36px;
  height: 36px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 14%, var(--surface-low));
  border-radius: 10px;
}
.developer-entry-icon .q-icon {
  font-size: 20px;
}
.developer-entry-copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}
.developer-entry-copy strong {
  font-size: 12px;
}
.developer-entry-copy small {
  overflow: hidden;
  color: var(--muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.developer-entry-arrow {
  color: var(--pwa-link);
  font-size: 17px;
  transition: transform 0.2s ease;
}
.developer-entry:hover .developer-entry-arrow {
  transform: translateX(2px);
}
.publish-card {
  position: relative;
  overflow: hidden;
  margin: auto 0 0;
  padding: 12px;
  background: color-mix(in srgb, var(--surface-highest) 40%, var(--surface));
  border: 1px solid var(--outline);
  border-radius: 14px;
}
.publish-card > * {
  position: relative;
  z-index: 1;
}
.publish-card strong {
  display: block;
  margin-top: 9px;
  font-size: 12px;
}
.publish-card p {
  margin: 5px 0 12px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}
.publish-card .q-btn {
  width: 100%;
  color: var(--pwa-on-primary);
  background: var(--primary);
  min-height: 36px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
}
.publish-icon {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 14%, var(--surface-low));
  border-radius: 9px;
}
.publish-icon .q-icon {
  font-size: 17px;
}
.publish-glow {
  position: absolute;
  z-index: 0;
  top: -24px;
  right: -20px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.18;
  filter: blur(18px);
}
.page-container {
  min-height: 100vh;
  background: var(--page);
}
.page-container :is(#popular, #recommended, #categories, #business, #trending) {
  scroll-margin-top: 92px;
}
.mobile-bottom-nav {
  position: fixed;
  z-index: 3000;
  right: auto;
  bottom: max(10px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  height: 60px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 6px;
  background: color-mix(in srgb, var(--surface-low) 88%, transparent);
  border: 1px solid var(--outline);
  border-radius: 18px;
  box-shadow: 0 16px 50px rgba(4, 9, 25, 0.22);
  backdrop-filter: blur(22px) saturate(145%);
}
.mobile-bottom-nav .q-btn {
  min-width: 0;
  min-height: 46px;
  padding: 3px 2px;
  color: var(--muted);
  border-radius: 13px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.mobile-bottom-nav .q-btn .q-btn__content {
  gap: 1px;
  flex-direction: column;
}
.mobile-bottom-nav .q-btn .q-icon {
  font-size: 21px;
}
.mobile-bottom-nav .q-btn.active {
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 12%, var(--surface));
}

@media (max-width: 1023px) {
  .one-header {
    left: 0;
  }
  .one-toolbar {
    padding: 0 16px;
    gap: 10px;
  }
  .mobile-brand {
    gap: 8px;
    margin-right: 4px;
  }
  .mobile-brand .brand-mark {
    width: 35px;
    height: 35px;
    border-radius: 10px;
  }
  .mobile-brand strong {
    font-size: 16px;
  }
  .header-search {
    width: auto;
    max-width: none;
  }
  .page-container {
    padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  }
}

/* Phones and tablets: night-blue header, as in a native store. */
@media (max-width: 1023px) {
  .one-header {
    color: #fff;
    background: #071a3d;
    border-bottom: 0;
    backdrop-filter: none;
  }
  .one-header .menu-button,
  .one-header .icon-action,
  .one-header .profile-button {
    color: #fff;
  }
  .mobile-brand {
    display: inline-flex;
    align-items: center;
    color: #fff;
    text-decoration: none;
  }
  .mobile-brand-name {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .mobile-brand-name b {
    color: #08c8f8;
  }
  .header-search input {
    color: #0b1b3f;
    background: #fff;
    border-color: transparent;
  }
  .header-search .q-icon {
    color: #5b6b8c;
  }
}
@media (max-width: 599px) {
  /* Logo and actions on the first row, the search bar on its own row below. */
  .one-toolbar {
    flex-wrap: wrap;
    row-gap: 8px;
    min-height: 58px;
    padding: 6px 12px 10px;
  }
  .header-search {
    order: 10;
    flex: 1 0 100%;
  }
  .header-actions {
    margin-left: auto;
  }
  .menu-button {
    margin-right: -5px;
  }
  .mobile-brand strong,
  .mobile-brand .brand-mark {
    display: none;
  }
  .header-search input {
    height: 40px;
    padding-right: 10px;
    font-size: 16px;
  }
  .header-actions {
    gap: 0;
  }
  .icon-action {
    width: 44px;
    height: 44px;
  }
  .login-action {
    min-width: 35px;
    padding: 0;
  }
}
</style>
