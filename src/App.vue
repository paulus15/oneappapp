<template>
  <MaintenancePage v-if="blocked" />
  <ServiceErrorPage v-else-if="failed" :status="500" />
  <router-view v-else />
</template>
<script setup>
import { computed, onErrorCaptured, onMounted, watch } from 'vue'
import { ref } from 'vue'
import { api } from '@/boot/axios'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { maintenance } from '@/stores/maintenance'
import MaintenancePage from '@/pages/MaintenancePage.vue'
import ServiceErrorPage from '@/pages/ServiceErrorPage.vue'
const route = useRoute(),
  auth = useAuthStore(),
  failed = ref(false)
const blocked = computed(
  () =>
    maintenance.enabled &&
    !auth.isAdmin &&
    !['/login', '/forgot-password', '/verify-email', '/confirm-email'].includes(
      route.path
    )
)
onMounted(() => {
  api.get('/platform', { skipCountryDetection: true }).catch(() => {})
})
onErrorCaptured(() => {
  failed.value = true
  return false
})
watch(
  () => route.fullPath,
  () => {
    failed.value = false
  }
)
</script>
