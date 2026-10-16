<template>
  <q-layout
    view="lHh Lpr lFf"
    class="admin-layout"
    :class="{ 'theme-dark': isDark }"
  >
    <a href="#admin-main" class="skip-link">{{
      ui('Aller au contenu principal')
    }}</a>
    <q-header class="admin-header">
      <q-toolbar class="admin-toolbar">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="lt-md admin-menu-toggle"
          :aria-label="ui('Ouvrir la navigation')"
          :aria-expanded="drawerOpen ? 'true' : 'false'"
          aria-controls="admin-drawer"
          @click="drawerOpen = !drawerOpen"
        />
        <router-link
          to="/"
          class="admin-brand-link"
          :aria-label="ui('PWA Store, accueil')"
          ><BrandLogo responsive
        /></router-link>
        <div class="toolbar-heading">
          <span class="toolbar-eyebrow gt-xs">{{ ui('Back-office') }}</span>
          <strong>{{ ui('Administration') }}</strong>
        </div>

        <q-space />

        <q-btn
          flat
          no-caps
          icon="storefront"
          :label="ui('Voir le Store')"
          to="/"
          class="store-button gt-xs"
        />
        <q-btn
          flat
          round
          :icon="isDark ? 'light_mode' : 'dark_mode'"
          :aria-label="
            isDark
              ? ui('Activer le thème clair')
              : ui('Activer le thème sombre')
          "
          @click="toggleTheme"
        />
        <LanguageSwitcher />
        <NotificationBell />

        <q-btn
          flat
          no-caps
          class="admin-profile"
          :aria-label="ui('Menu du compte')"
        >
          <q-avatar size="36px">{{ userInitial }}</q-avatar>
          <span class="profile-copy gt-sm">
            <strong>{{ authStore.userName }}</strong>
            <small>{{ ui('Administrateur') }}</small>
          </span>
          <q-icon name="expand_more" class="gt-sm" />
          <q-menu auto-close class="admin-menu">
            <q-list style="min-width: 200px">
              <q-item clickable to="/">
                <q-item-section avatar
                  ><q-icon name="storefront"
                /></q-item-section>
                <q-item-section>{{ ui('Retour au Store') }}</q-item-section>
              </q-item>
              <q-item clickable to="/account">
                <q-item-section avatar
                  ><q-icon name="manage_accounts"
                /></q-item-section>
                <q-item-section>{{ ui('Mon compte') }}</q-item-section>
              </q-item>
              <q-item clickable class="text-negative" @click="handleLogout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>{{ ui('Déconnexion') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      id="admin-drawer"
      v-model="drawerOpen"
      show-if-above
      :width="272"
      :breakpoint="1024"
      class="admin-drawer"
    >
      <nav class="drawer-shell" :aria-label="ui('Navigation de l’administration')">
        <section
          v-for="group in groups"
          :key="group.key"
          class="admin-group"
          :data-group="group.key"
        >
          <h2 :id="`admin-group-${group.key}`" class="nav-label">{{
            group.label
          }}</h2>
          <q-list
            class="admin-nav-list"
            :aria-labelledby="`admin-group-${group.key}`"
          >
            <q-item
              v-for="link in group.links"
              :key="link.to"
              v-ripple
              clickable
              :to="link.to"
              :exact="link.to === '/admin'"
              active-class="admin-nav-active"
              :data-to="link.to"
            >
              <q-item-section avatar
                ><q-icon :name="link.icon" aria-hidden="true"
              /></q-item-section>
              <q-item-section>{{ link.label }}</q-item-section>
              <q-item-section v-if="link.badge" side>
                <q-badge
                  class="admin-badge"
                  rounded
                  color="orange-8"
                  :label="link.badge"
                />
                <span class="sr-only">{{
                  ui('{n} à traiter', { n: link.badge })
                }}</span>
              </q-item-section>
            </q-item>
          </q-list>
        </section>

        <div class="drawer-user">
          <span class="status-dot" aria-hidden="true" />
          <span>
            <strong>{{ ui('Espace administrateur') }}</strong>
            <small>{{ authStore.userName }}</small>
          </span>
        </div>
      </nav>
    </q-drawer>

    <q-page-container id="admin-main" class="admin-page-container" tabindex="-1">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ui } from '@/i18n/text'

import { computed, onMounted, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import {
  ADMIN_LAYOUT_KEY,
  useAdminOverview
} from '@/composables/useAdminOverview'
import { usePlatform } from '@/composables/usePlatform'
import { useTheme } from '@/composables/useTheme'
import { groupedAdminLinks } from '@/router/adminLinks'
import { useAuthStore } from '@/stores/auth'
import { todoBadge } from '@/utils/adminOverview'

provide(ADMIN_LAYOUT_KEY, true)

const router = useRouter()
const authStore = useAuthStore()
const { tools } = usePlatform()
const { isDark, toggleTheme } = useTheme()
const { overview, loading, load } = useAdminOverview()
const drawerOpen = ref(false)

const userInitial = computed(
  () => authStore.userName?.charAt(0).toUpperCase() || 'A'
)

const groups = computed(() =>
  groupedAdminLinks(authStore.user?.admin_permissions, tools.value).map(
    group => ({
      ...group,
      links: group.links.map(link => ({
        to: link.to,
        label: link.label,
        icon: link.icon,
        badge: todoBadge(overview.value?.todo, link.todo)
      }))
    })
  )
)

// The badges work without the overview: a failure only hides them. The dashboard
// (mounted first, as a child) may already be loading it.
onMounted(() => {
  if (!overview.value && !loading.value) load()
})

async function handleLogout() {
  if (await authStore.logout()) router.push('/')
}
</script>

<style lang="scss">
.admin-layout {
  color: var(--text);
  background: var(--page);
}
.admin-layout .skip-link {
  position: absolute;
  top: -48px;
  left: 12px;
  z-index: 3000;
  padding: 8px 14px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 8px;
  font-weight: 700;
}
.admin-layout .skip-link:focus {
  top: 10px;
}
.admin-header {
  left: 272px;
  color: var(--text);
  background: color-mix(in srgb, var(--surface-low) 82%, transparent);
  border-bottom: 1px solid var(--outline);
  box-shadow: none;
  backdrop-filter: blur(18px);
}
.admin-toolbar {
  min-height: 64px;
  padding: 0 20px;
  gap: 6px;
}
.admin-brand-link {
  display: inline-flex;
  color: var(--text);
}
.admin-toolbar .toolbar-heading {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  line-height: 1.2;
}
.admin-toolbar .toolbar-heading strong {
  font-size: 16px;
}
.admin-toolbar .toolbar-eyebrow {
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.admin-toolbar .store-button {
  margin-right: 10px;
  color: var(--muted);
  border: 1px solid var(--outline);
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
}
.admin-profile {
  margin-left: 4px;
  color: var(--text);
  border-radius: 10px;
}
.admin-profile .q-avatar {
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 800;
}
.admin-profile .profile-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0 8px;
  line-height: 1.25;
}
.admin-profile .profile-copy strong {
  font-size: 12px;
}
.admin-profile .profile-copy small {
  color: var(--muted);
  font-size: 10px;
}
.admin-menu {
  color: var(--text);
  background: var(--surface-low);
}
.admin-drawer {
  color: var(--text);
  background: var(--surface-low);
  border-right: 1px solid var(--outline) !important;
}
.admin-drawer .drawer-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 18px 10px 14px;
}
.admin-group {
  margin-bottom: 14px;
}
.admin-group .nav-label {
  margin: 0 13px 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  line-height: 1.4;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.admin-nav-list .q-item {
  min-height: 40px;
  margin: 2px 0;
  padding: 0 13px;
  color: var(--muted);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 650;
}
.admin-nav-list .q-item:hover {
  color: var(--text);
  background: var(--surface-high);
}
.admin-nav-list .q-item:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: -3px;
}
.admin-nav-list .q-item__section--avatar {
  min-width: 37px;
}
.admin-nav-list .q-icon {
  font-size: 20px;
}
.admin-nav-list .admin-nav-active {
  color: var(--pwa-link);
  background: var(--primary-soft);
}
.admin-badge {
  font-size: 10px;
  font-weight: 800;
}
.admin-drawer .drawer-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px 10px 0;
  border-top: 1px solid var(--outline);
}
.admin-drawer .status-dot {
  width: 8px;
  height: 8px;
  background: var(--q-warning);
  border-radius: 50%;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--q-warning) 18%, transparent);
}
.admin-drawer .drawer-user span:last-child {
  display: flex;
  flex-direction: column;
}
.admin-drawer .drawer-user strong {
  font-size: 11px;
}
.admin-drawer .drawer-user small {
  color: var(--muted);
  font-size: 10px;
}
.admin-page-container {
  min-height: 100vh;
  background: var(--page);
}
.admin-page-container:focus {
  outline: none;
}
.admin-layout .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@media (max-width: 1023px) {
  .admin-header {
    left: 0;
  }
  .admin-toolbar {
    padding: 0 16px;
  }
}
@media (max-width: 599px) {
  .admin-toolbar {
    min-height: 58px;
    padding: 0 10px;
  }
  .admin-toolbar .toolbar-heading strong {
    font-size: 14px;
  }
  .admin-profile {
    min-width: 40px;
    padding: 4px;
  }
}
</style>
