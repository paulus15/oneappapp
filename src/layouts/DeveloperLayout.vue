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

        <div class="toolbar-heading">
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
        <q-btn flat round icon="notifications_none" aria-label="Notifications">
          <q-badge floating rounded color="deep-orange-5" />
        </q-btn>

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
          <span class="developer-logo"><q-icon name="terminal" /></span>
          <span>
            <strong>OneInstall</strong>
            <small>Developer Center</small>
          </span>
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
            <strong>Services opérationnels</strong>
            <small>API et builds disponibles</small>
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
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const leftDrawerOpen = ref(false)
const isDark = ref(true)

const userInitial = computed(
  () => authStore.userName?.charAt(0).toUpperCase() || 'D'
)

const workspaceNavigation = [
  { label: 'Vue d’ensemble', icon: 'space_dashboard', to: '/developer' },
  { label: 'Mes applications', icon: 'apps', disabled: true },
  { label: 'Builds & versions', icon: 'deployed_code', disabled: true },
  {
    label: 'Statistiques',
    icon: 'monitoring',
    disabled: true,
    badge: 'Bientôt'
  },
  { label: 'Revenus', icon: 'account_balance_wallet', disabled: true }
]

const resourceNavigation = [
  { label: 'Documentation', icon: 'menu_book', disabled: true, external: true },
  { label: 'Clés API', icon: 'key', disabled: true },
  { label: 'Paramètres', icon: 'settings', disabled: true }
]

onMounted(() => {
  const savedTheme = localStorage.getItem('oneinstall-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = savedTheme ? savedTheme === 'dark' : prefersDark
  $q.dark.set(isDark.value)
})

function toggleTheme() {
  isDark.value = !isDark.value
  $q.dark.set(isDark.value)
  localStorage.setItem('oneinstall-theme', isDark.value ? 'dark' : 'light')
}

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style lang="scss">
.developer-layout {
  --page: #f4f6fb;
  --surface-low: #ffffff;
  --surface: #f7f8fc;
  --surface-high: #eceff6;
  --surface-highest: #e1e5ef;
  --text: #172033;
  --muted: #667085;
  --outline: rgba(23, 32, 51, 0.11);
  --glass: rgba(255, 255, 255, 0.86);
  --primary: #5856d6;
  --primary-soft: #e8e7ff;
  color: var(--text);
  background: var(--page);
}

.developer-layout.theme-dark {
  --page: #0b1020;
  --surface-low: #11182a;
  --surface: #151d30;
  --surface-high: #1b253a;
  --surface-highest: #263149;
  --text: #edf1ff;
  --muted: #98a2b8;
  --outline: rgba(255, 255, 255, 0.09);
  --glass: rgba(17, 24, 42, 0.84);
  --primary: #a8a7ff;
  --primary-soft: #29295e;
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
  min-height: 72px;
  padding: 0 28px;
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
  color: #fff;
  background: linear-gradient(135deg, #7775ff, #6f35bd);
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
  padding: 22px 12px 18px;
}

.developer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 10px 30px;
  color: var(--text);
  text-decoration: none;
}

.developer-logo {
  width: 40px;
  height: 40px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #6f6cf4, #7131bd);
  border-radius: 11px;
  box-shadow: 0 8px 25px rgba(94, 80, 220, 0.28);
}

.developer-logo .q-icon {
  font-size: 23px;
}
.developer-brand > span:last-child {
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
  margin-bottom: 24px;
}
.developer-nav .q-item {
  min-height: 45px;
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
  color: var(--primary);
  background: var(--primary-soft);
}
.developer-nav .q-badge {
  color: var(--primary);
  background: var(--primary-soft);
  font-size: 8px;
}

.developer-help {
  display: flex;
  gap: 10px;
  margin: auto 4px 14px;
  padding: 14px;
  background: linear-gradient(145deg, var(--surface-high), var(--surface));
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.developer-help > .q-icon {
  color: var(--primary);
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
  color: var(--primary);
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
  background: #36c68b;
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
    min-height: 64px;
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
