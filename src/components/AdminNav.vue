<template>
  <nav class="admin-nav" aria-label="Administration">
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
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminLinks } from '@/router/adminLinks'

const auth = useAuthStore()
const links = computed(() =>
  adminLinks.filter(
    link =>
      !link.permission ||
      auth.user?.admin_permissions?.includes(link.permission)
  )
)
</script>
<style scoped>
.admin-nav {
  margin: 0 0 16px;
  border-bottom: 1px solid var(--outline);
}
</style>
