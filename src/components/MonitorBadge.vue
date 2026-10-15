<template>
  <!-- Colour, icon and text together: the state never relies on colour alone. -->
  <span class="monitor-badge" :class="`tone-${tone}`">
    <q-icon :name="icon" aria-hidden="true" />
    <span>{{ label }}</span>
  </span>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: 'help_outline' },
  // Quasar brand name: positive | warning | negative | grey-7
  color: { type: String, default: 'grey-7' }
})
const tone = computed(() =>
  ['positive', 'warning', 'negative'].includes(props.color)
    ? props.color
    : 'neutral'
)
</script>
<style scoped>
.monitor-badge {
  --badge-color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 3px 10px 3px 8px;
  color: var(--text);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.3;
  background: color-mix(in srgb, var(--badge-color) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--badge-color) 35%, transparent);
  border-radius: 999px;
}
.monitor-badge .q-icon {
  flex: none;
  color: var(--badge-color);
  font-size: 17px;
}
.tone-positive {
  --badge-color: var(--q-positive);
}
.tone-warning {
  --badge-color: var(--q-warning);
}
.tone-negative {
  --badge-color: var(--q-negative);
}
</style>
