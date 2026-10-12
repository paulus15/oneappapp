<template>
  <!-- A signed-in account without a country only sees apps offered everywhere. -->
  <q-banner
    v-if="authStore.isAuthenticated && !authStore.user?.country_id"
    class="country-missing"
    role="status"
  >
    <template #avatar><q-icon name="public" color="primary" /></template>
    {{ t('geo.missing.text') }}
    <template #action>
      <q-btn
        flat
        no-caps
        color="primary"
        :label="t('geo.missing.action')"
        to="/account"
      />
    </template>
  </q-banner>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
</script>
<style scoped>
.country-missing {
  margin: 12px 16px 0;
  border-radius: 14px;
  background: rgba(7, 91, 255, 0.08);
}
</style>
