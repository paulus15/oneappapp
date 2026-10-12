<template>
  <span
    class="hosting-badge"
    :class="[`hosting-${kind}`, { 'hosting-compact': compact }]"
    :tabindex="focusable ? 0 : undefined"
    role="img"
    :aria-label="`${t(`hosting.${kind}.label`)}. ${t(`hosting.${kind}.help`)}`"
  >
    <q-icon :name="kind === 'build' ? 'verified' : 'link'" />
    <span v-if="!compact">{{ t(`hosting.${kind}.label`) }}</span>
    <q-tooltip
      class="hosting-tooltip"
      max-width="280px"
      anchor="bottom middle"
      self="top middle"
    >
      <strong>{{ t(`hosting.${kind}.label`) }}</strong>
      <p>{{ t(`hosting.${kind}.help`) }}</p>
    </q-tooltip>
  </span>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Tells visitors whether PWA Store serves the analysed build or the publisher hosts the app.
const props = defineProps({
  sourceType: { type: String, default: 'build' },
  compact: { type: Boolean, default: false },
  // Inside a link (cards), the badge must not be a second keyboard stop.
  focusable: { type: Boolean, default: true }
})
const { t } = useI18n()
const kind = computed(() => (props.sourceType === 'url' ? 'url' : 'build'))
</script>
<style scoped>
.hosting-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  cursor: help;
  white-space: nowrap;
}
.hosting-compact {
  padding: 2px;
}
.hosting-badge:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.hosting-build {
  color: #0a5c3a;
  background: rgba(22, 163, 74, 0.12);
}
.hosting-url {
  color: #8a4b00;
  background: rgba(255, 148, 22, 0.16);
}
body.body--dark .hosting-build {
  color: #7ee2ad;
}
body.body--dark .hosting-url {
  color: #ffc27a;
}
</style>
<style>
.hosting-tooltip {
  font-size: 13px;
  line-height: 1.4;
}
.hosting-tooltip p {
  margin: 4px 0 0;
}
</style>
