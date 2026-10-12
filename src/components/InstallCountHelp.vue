<template>
  <!-- Explains the two install counters: declared by users vs confirmed by the script. -->
  <span
    class="install-help"
    role="img"
    tabindex="0"
    :aria-label="t(`installHelp.${kind}`)"
    ><q-icon name="help_outline" size="16px" /><q-tooltip
      max-width="280px"
      class="text-body2"
      >{{ t(`installHelp.${kind}`) }}</q-tooltip
    ></span
  >
</template>
<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  // 'declared' (the user tapped the button on the listing) or 'confirmed' (script signal).
  kind: {
    type: String,
    default: 'declared',
    validator: value => ['declared', 'confirmed'].includes(value)
  }
})
const { t } = useI18n()
</script>
<style scoped>
.install-help {
  display: inline-flex;
  margin-inline-start: 4px;
  vertical-align: middle;
  color: var(--q-primary);
  cursor: help;
  border-radius: 50%;
}
.install-help:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
