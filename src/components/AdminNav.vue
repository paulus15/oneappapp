<template>
  <!-- Inside AdminLayout the sidebar already lists these pages: no second menu. -->
  <nav v-if="!inAdminLayout" class="admin-nav" :aria-label="ui('Administration')">
    <q-tabs
      dense
      no-caps
      inline-label
      outside-arrows
      mobile-arrows
      align="left"
      active-color="primary"
      indicator-color="primary"
    >
      <q-route-tab
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :icon="link.icon"
        :label="link.label"
        exact
      />
    </q-tabs>
  </nav>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ADMIN_LAYOUT_KEY } from '@/composables/useAdminOverview'
import { visibleAdminLinks } from '@/router/adminLinks'
import { usePlatform } from '@/composables/usePlatform'

const inAdminLayout = inject(ADMIN_LAYOUT_KEY, false)
const auth = useAuthStore()
const { tools } = usePlatform()
const links = computed(() =>
  visibleAdminLinks(auth.user?.admin_permissions, tools.value)
)
</script>
<style scoped>
.admin-nav {
  margin: 0 0 16px;
  border-bottom: 1px solid var(--outline);
}
</style>
