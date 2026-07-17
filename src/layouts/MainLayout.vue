<template>
  <q-layout
    view="hHh Lpr lFf"
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
          aria-label="Ouvrir la navigation"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <router-link
          to="/"
          class="mobile-brand lt-md"
          aria-label="OneInstall, accueil"
        >
          <span class="brand-mark"><q-icon name="apps" /></span>
          <strong>OneInstall</strong>
        </router-link>

        <label class="header-search">
          <q-icon name="search" />
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher une application, un jeu, une entreprise..."
            aria-label="Rechercher"
            @keyup.enter="submitSearch"
          />
        </label>

        <nav class="top-links gt-md" aria-label="Liens secondaires">
          <router-link to="/developer">Développeurs</router-link>
          <router-link to="/">Apps</router-link>
          <a href="#features">Documentation</a>
        </nav>

        <div class="header-actions">
          <button
            class="icon-action language-action gt-xs"
            type="button"
            aria-label="Langue française"
          >
            <q-icon name="language" />
            <span>FR</span>
          </button>
          <button
            class="icon-action"
            type="button"
            :aria-label="
              isDark ? 'Activer le thème clair' : 'Activer le thème sombre'
            "
            :title="isDark ? 'Thème clair' : 'Thème sombre'"
            @click="toggleTheme"
          >
            <q-icon :name="isDark ? 'light_mode' : 'dark_mode'" />
          </button>
          <button
            class="icon-action notification-action gt-xs"
            type="button"
            aria-label="Notifications"
          >
            <q-icon name="notifications_none" />
            <span class="notification-dot" />
          </button>

          <template v-if="authStore.isAuthenticated">
            <q-btn flat no-caps class="profile-button">
              <q-avatar size="38px" class="profile-avatar">
                {{ authStore.userName?.charAt(0).toUpperCase() || 'U' }}
              </q-avatar>
              <span class="profile-copy gt-sm">
                <strong>{{ authStore.userName }}</strong>
                <small>{{ authStore.user?.role || 'Membre' }}</small>
              </span>
              <q-icon name="expand_more" class="gt-sm" />
              <q-menu auto-close class="profile-menu">
                <q-list style="min-width: 180px">
                  <q-item clickable to="/developer">
                    <q-item-section avatar
                      ><q-icon name="person_outline"
                    /></q-item-section>
                    <q-item-section>Mon espace</q-item-section>
                  </q-item>
                  <q-item clickable class="text-negative" @click="handleLogout">
                    <q-item-section avatar
                      ><q-icon name="logout"
                    /></q-item-section>
                    <q-item-section>Déconnexion</q-item-section>
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
            aria-label="Se connecter"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="256"
      :breakpoint="1024"
      class="one-drawer"
    >
      <div class="drawer-content">
        <router-link to="/" class="brand" aria-label="OneInstall, accueil">
          <span class="brand-mark"><q-icon name="apps" /></span>
          <span>
            <strong>OneInstall</strong>
            <small>One App. All Platforms.</small>
          </span>
        </router-link>

        <q-list class="navigation-list">
          <q-item
            v-for="item in mainNavigation"
            :key="item.label"
            clickable
            v-ripple
            :to="item.to"
            :href="item.href"
            exact
            active-class="nav-active"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <p class="drawer-label">Espace développeur</p>
        <q-list class="navigation-list developer-list">
          <q-item
            v-for="item in developerNavigation"
            :key="item.label"
            clickable
            v-ripple
            :to="item.to"
            :href="item.href"
            active-class="nav-active"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>

        <div class="publish-card">
          <span class="publish-glow" />
          <strong>Publiez votre application</strong>
          <p
            >Atteignez des millions d’utilisateurs en Afrique et dans le
            monde.</p
          >
          <q-btn unelevated no-caps label="Commencer" to="/developer" />
        </div>
      </div>
    </q-drawer>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)
const search = ref('')
const isDark = ref(true)

const mainNavigation = [
  { label: 'Accueil', icon: 'home', to: '/' },
  { label: 'Applications', icon: 'apps', href: '#popular' },
  { label: 'Jeux', icon: 'sports_esports', href: '#recommended' },
  { label: 'Catégories', icon: 'category', href: '#categories' },
  { label: 'Entreprises', icon: 'business', href: '#business' },
  { label: 'Collections', icon: 'collections_bookmark', href: '#recommended' },
  { label: 'Mises à jour', icon: 'update', href: '#trending' }
]

const developerNavigation = [
  { label: 'Mes applications', icon: 'terminal', to: '/developer' },
  { label: 'Statistiques', icon: 'insert_chart', to: '/developer' },
  { label: 'Publier une app', icon: 'publish', to: '/developer' },
  { label: 'Revenus', icon: 'payments', to: '/developer' }
]

onMounted(() => {
  const savedTheme = localStorage.getItem('oneinstall-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = savedTheme ? savedTheme === 'dark' : prefersDark
  $q.dark.set(isDark.value)
  search.value = String(route.query.search || '')
})

function toggleTheme() {
  isDark.value = !isDark.value
  $q.dark.set(isDark.value)
  localStorage.setItem('oneinstall-theme', isDark.value ? 'dark' : 'light')
}

function submitSearch() {
  router.push({
    path: '/',
    query: search.value.trim() ? { search: search.value.trim() } : {}
  })
}

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style lang="scss">
.one-layout {
  --page: #f5f7ff;
  --surface-low: #ffffff;
  --surface: #f0f2fb;
  --surface-high: #e5e8f4;
  --surface-highest: #d9deed;
  --text: #1a2236;
  --muted: #61697c;
  --outline: rgba(36, 43, 65, 0.13);
  --glass: rgba(255, 255, 255, 0.7);
  --primary: #5558dc;
  --primary-soft: #e1e0ff;
  --primary-text: #28269f;
  --secondary: #7b21c8;
  color: var(--text);
  background: var(--page);
  transition:
    background-color 0.25s ease,
    color 0.25s ease;
}

.one-layout.theme-dark {
  --page: #0b1326;
  --surface-low: #131b2e;
  --surface: #171f33;
  --surface-high: #222a3d;
  --surface-highest: #2d3449;
  --text: #dae2fd;
  --muted: #c7c4d7;
  --outline: rgba(255, 255, 255, 0.09);
  --glass: rgba(15, 23, 42, 0.54);
  --primary: #c0c1ff;
  --primary-soft: #8083ff;
  --primary-text: #0d0096;
  --secondary: #9f4ee6;
}

.one-header {
  left: 256px;
  color: var(--text);
  background: color-mix(in srgb, var(--surface-highest) 64%, transparent);
  border-bottom: 1px solid var(--outline);
  box-shadow: none;
  backdrop-filter: blur(18px);
}

.one-toolbar {
  min-height: 72px;
  padding: 0 28px;
  gap: 20px;
}
.header-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 650px;
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
  height: 46px;
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
.header-search input::placeholder {
  color: var(--muted);
  opacity: 0.72;
}
.header-search input:focus {
  border-color: var(--primary);
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
.top-links a:hover {
  color: var(--primary);
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
  background: #ff7066;
  box-shadow: 0 0 0 2px var(--surface-highest);
}
.profile-button {
  color: var(--text);
  border-radius: 12px;
  padding: 4px 6px;
}
.profile-avatar {
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #7376ff, #7127c1);
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
  background: color-mix(in srgb, var(--surface-low) 88%, transparent);
  border-right: 1px solid var(--outline) !important;
  backdrop-filter: blur(20px);
}
.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 24px 10px 20px;
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
  padding: 0 14px;
  margin-bottom: 27px;
}
.brand-mark {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--primary-text);
  background: linear-gradient(135deg, var(--primary-soft), var(--primary));
  border-radius: 12px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 22%, transparent);
}
.brand-mark .q-icon {
  font-size: 23px;
}
.brand > span:last-child {
  display: flex;
  flex-direction: column;
}
.brand strong {
  font-size: 20px;
  letter-spacing: -0.6px;
}
.brand small {
  margin-top: 1px;
  color: var(--muted);
  font-size: 11px;
}
.navigation-list .q-item {
  min-height: 46px;
  margin: 2px 0;
  padding: 0 14px;
  color: var(--muted);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}
.navigation-list .q-item:hover {
  color: var(--text);
  background: var(--surface-high);
}
.navigation-list .q-item__section--avatar {
  min-width: 37px;
}
.navigation-list .q-icon {
  font-size: 21px;
}
.navigation-list .nav-active {
  color: var(--primary);
  background: color-mix(in srgb, var(--secondary) 22%, var(--surface));
}
.drawer-label {
  margin: 24px 14px 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.publish-card {
  position: relative;
  overflow: hidden;
  margin: auto 8px 0;
  padding: 16px;
  background: linear-gradient(135deg, var(--surface-highest), var(--surface));
  border: 1px solid var(--outline);
  border-radius: 14px;
}
.publish-card > * {
  position: relative;
  z-index: 1;
}
.publish-card strong {
  display: block;
  font-size: 13px;
}
.publish-card p {
  margin: 5px 0 12px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}
.publish-card .q-btn {
  width: 100%;
  color: var(--primary-text);
  background: linear-gradient(90deg, var(--primary-soft), var(--primary));
  border-radius: 9px;
  font-size: 12px;
  font-weight: 800;
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
    max-width: none;
  }
}

@media (max-width: 599px) {
  .one-toolbar {
    min-height: 64px;
    padding: 0 10px;
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
    font-size: 12px;
  }
  .header-actions {
    gap: 0;
  }
  .icon-action {
    width: 35px;
    height: 35px;
  }
  .login-action {
    min-width: 35px;
    padding: 0;
  }
}
</style>
