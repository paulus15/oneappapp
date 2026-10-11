<template>
  <q-layout
    view="lHh Lpr lFf"
    class="developer-layout"
    :class="{ 'theme-dark': isDark }"
  >
    <q-header class="developer-header">
      <q-toolbar class="developer-toolbar">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="lt-md"
          aria-label="Ouvrir la navigation"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <router-link
          to="/"
          class="console-brand"
          aria-label="PWA Store, accueil"
          ><BrandLogo responsive
        /></router-link>
        <div class="toolbar-heading gt-xs">
          <span class="toolbar-eyebrow">Espace développeur</span>
          <strong>Console</strong>
        </div>

        <q-space />

        <q-btn
          flat
          no-caps
          icon="storefront"
          label="Voir le Store"
          to="/"
          class="store-button gt-xs"
        />
        <q-btn
          flat
          round
          :icon="isDark ? 'light_mode' : 'dark_mode'"
          :aria-label="
            isDark ? 'Activer le thème clair' : 'Activer le thème sombre'
          "
          @click="toggleTheme"
        />
        <NotificationBell />

        <q-btn flat no-caps class="developer-profile">
          <q-avatar size="36px">{{ userInitial }}</q-avatar>
          <span class="profile-copy gt-sm">
            <strong>{{ authStore.userName }}</strong>
            <small>{{ authStore.user?.role || 'Développeur' }}</small>
          </span>
          <q-icon name="expand_more" class="gt-sm" />
          <q-menu auto-close class="developer-menu">
            <q-list style="min-width: 190px">
              <q-item clickable to="/">
                <q-item-section avatar
                  ><q-icon name="storefront"
                /></q-item-section>
                <q-item-section>Retour au Store</q-item-section>
              </q-item>
              <q-item clickable class="text-negative" @click="handleLogout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Déconnexion</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="264"
      :breakpoint="1024"
      class="developer-drawer"
    >
      <div class="drawer-shell">
        <router-link to="/developer" class="developer-brand">
          <BrandLogo />
        </router-link>

        <p class="nav-label">Workspace</p>
        <q-list class="developer-nav">
          <q-item
            v-for="item in workspaceNavigation"
            :key="item.label"
            clickable
            v-ripple
            :to="item.to"
            :disable="item.disabled"
            exact
            active-class="developer-nav-active"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section v-if="item.badge" side>
              <q-badge :label="item.badge" rounded />
            </q-item-section>
          </q-item>
        </q-list>

        <p class="nav-label">Ressources</p>
        <q-list class="developer-nav">
          <q-item
            v-for="item in resourceNavigation"
            :key="item.label"
            clickable
            :disable="item.disabled"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section v-if="item.external" side>
              <q-icon name="north_east" size="15px" />
            </q-item-section>
          </q-item>
        </q-list>

        <div class="developer-help">
          <q-icon name="support_agent" />
          <div>
            <strong>Besoin d’aide ?</strong>
            <p>Notre équipe accompagne la publication de votre application.</p>
            <button type="button">Contacter le support</button>
          </div>
        </div>

        <div class="drawer-user">
          <span class="status-dot" />
          <span>
            <strong>Espace développeur</strong>
            <small>Votre compte PWA Store</small>
          </span>
        </div>
      </div>
    </q-drawer>

    <q-page-container class="developer-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import NotificationBell from '@/components/NotificationBell.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import { useTheme } from '@/composables/useTheme'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)
const { isDark, toggleTheme } = useTheme()

const userInitial = computed(
  () => authStore.userName?.charAt(0).toUpperCase() || 'D'
)

const workspaceNavigation = [
  {
    label: 'Mon profil et mes quotas',
    icon: 'verified_user',
    to: '/developer/profile'
  },
  { label: 'Vue d’ensemble', icon: 'space_dashboard', to: '/developer' },
  { label: 'Mes applications', icon: 'apps', disabled: true },
  { label: 'Builds & versions', icon: 'inventory_2', disabled: true },
  { label: 'Statistiques', icon: 'insights', to: '/developer/stats' },
  { label: 'Avis et retours', icon: 'reviews', to: '/developer/reviews' },
  { label: 'Revenus', icon: 'account_balance_wallet', disabled: true }
]

const resourceNavigation = [
  { label: 'Documentation', icon: 'menu_book', disabled: true, external: true },
  { label: 'Clés API', icon: 'key', disabled: true },
  { label: 'Paramètres', icon: 'settings', disabled: true }
]

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style lang="scss">
.developer-layout {
  color: var(--text);
  background: var(--page);
}

.developer-header {
  left: 264px;
  color: var(--text);
  background: color-mix(in srgb, var(--surface-low) 82%, transparent);
  border-bottom: 1px solid var(--outline);
  box-shadow: none;
  backdrop-filter: blur(18px);
}

.developer-toolbar {
  min-height: 64px;
  padding: 0 20px;
  gap: 6px;
}

.toolbar-heading {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.toolbar-heading strong {
  font-size: 16px;
}

.toolbar-eyebrow {
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.store-button {
  margin-right: 10px;
  color: var(--muted);
  border: 1px solid var(--outline);
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
}

.developer-profile {
  margin-left: 4px;
  color: var(--text);
  border-radius: 10px;
}

.developer-profile .q-avatar {
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 800;
}

.developer-profile .profile-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0 8px;
  line-height: 1.25;
}

.developer-profile .profile-copy strong {
  font-size: 12px;
}
.developer-profile .profile-copy small {
  color: var(--muted);
  font-size: 10px;
  text-transform: capitalize;
}
.developer-menu {
  color: var(--text);
  background: var(--surface-low);
}

.developer-drawer {
  color: var(--text);
  background: var(--surface-low);
  border-right: 1px solid var(--outline) !important;
}

.drawer-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 14px 10px;
}

.developer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 10px 20px;
  color: var(--text);
  text-decoration: none;
}

.developer-logo {
  width: 40px;
  height: 40px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 11px;
  box-shadow: 0 8px 25px color-mix(in srgb, var(--primary) 28%, transparent);
}

.developer-logo .q-icon {
  font-size: 23px;
}
.developer-brand > span:last-child:not(.pwa-brand) {
  display: flex;
  flex-direction: column;
}
.developer-brand strong {
  font-size: 18px;
  letter-spacing: -0.4px;
}
.developer-brand small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.nav-label {
  margin: 0 13px 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.developer-nav {
  margin-bottom: 16px;
}
.developer-nav .q-item {
  min-height: 41px;
  margin: 2px 0;
  padding: 0 13px;
  color: var(--muted);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 650;
}
.developer-nav .q-item:not(.disabled):hover {
  color: var(--text);
  background: var(--surface-high);
}
.developer-nav .q-item__section--avatar {
  min-width: 37px;
}
.developer-nav .q-icon {
  font-size: 20px;
}
.developer-nav .q-item.disabled {
  opacity: 0.58 !important;
}
.developer-nav .developer-nav-active {
  color: var(--pwa-link);
  background: var(--primary-soft);
}
.developer-nav .q-badge {
  color: var(--pwa-link);
  background: var(--primary-soft);
  font-size: 8px;
}

.developer-help {
  display: flex;
  gap: 10px;
  margin: auto 4px 14px;
  padding: 11px;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.developer-help > .q-icon {
  color: var(--pwa-link);
  font-size: 21px;
}
.developer-help strong {
  font-size: 12px;
}
.developer-help p {
  margin: 3px 0 8px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}
.developer-help button {
  padding: 0;
  color: var(--pwa-link);
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 10px;
  font-weight: 800;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px 0;
  border-top: 1px solid var(--outline);
}
.status-dot {
  width: 8px;
  height: 8px;
  background: var(--q-positive);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(54, 198, 139, 0.12);
}
.drawer-user span:last-child {
  display: flex;
  flex-direction: column;
}
.drawer-user strong {
  font-size: 10px;
}
.drawer-user small {
  color: var(--muted);
  font-size: 9px;
}

.developer-page-container {
  min-height: 100vh;
  background: var(--page);
}

@media (max-width: 1023px) {
  .developer-header {
    left: 0;
  }
  .developer-toolbar {
    padding: 0 16px;
  }
}

@media (max-width: 599px) {
  .developer-toolbar {
    min-height: 58px;
    padding: 0 10px;
  }
  .toolbar-eyebrow {
    display: none;
  }
  .toolbar-heading strong {
    font-size: 14px;
  }
  .developer-profile {
    min-width: 40px;
    padding: 4px;
  }
}
</style>
