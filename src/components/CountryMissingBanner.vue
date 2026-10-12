<template>
  <!-- A signed-in account without a country only sees apps offered everywhere. -->
  <div
    v-if="authStore.isAuthenticated && !authStore.user?.country_id && !hidden"
    class="country-missing"
    role="status"
  >
    <q-icon name="public" class="country-icon" />
    <span class="country-text">{{
      $q.screen.lt.sm ? t('geo.missing.short') : t('geo.missing.text')
    }}</span>
    <q-btn
      unelevated
      dense
      no-caps
      color="primary"
      class="country-action"
      :label="
        $q.screen.lt.sm ? t('geo.missing.actionShort') : t('geo.missing.action')
      "
      to="/account"
    />
    <q-btn
      flat
      round
      dense
      icon="close"
      size="sm"
      :aria-label="t('common.close')"
      @click="hide"
    />
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const KEY = 'pwa-country-banner-hidden'
const { t } = useI18n()
const authStore = useAuthStore()
const hidden = ref(read())

function read() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
// Hidden for this visit only: the question comes back next time.
function hide() {
  hidden.value = true
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // The banner simply stays hidden until the page reloads.
  }
}
</script>
<style scoped>
.country-missing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px clamp(12px, 2.5vw, 28px) 0;
  padding: 8px 8px 8px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--q-primary) 8%, var(--surface-low));
  border: 1px solid color-mix(in srgb, var(--q-primary) 18%, transparent);
  font-size: 13px;
  line-height: 1.4;
}
.country-icon {
  color: var(--q-primary);
  font-size: 20px;
  flex: 0 0 auto;
}
.country-text {
  flex: 1;
  min-width: 0;
}
.country-action {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 12px;
}
</style>
