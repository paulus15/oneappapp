<template>
  <!-- One look for every "nothing here" and error message: icon, title, text, actions. -->
  <div
    class="empty-state"
    :class="[`tone-${tone}`, { compact }]"
    :role="tone === 'error' ? 'alert' : undefined"
  >
    <span class="empty-icon" aria-hidden="true"><q-icon :name="icon" /></span>
    <h2 v-if="title" class="empty-title">{{ title }}</h2>
    <p v-if="text" class="empty-text">{{ text }}</p>
    <div v-if="$slots.default" class="empty-actions"><slot /></div>
  </div>
</template>
<script setup>
defineProps({
  icon: { type: String, default: 'inbox' },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
  // neutral | error | success
  tone: { type: String, default: 'neutral' },
  // Smaller padding inside cards and dialogs.
  compact: Boolean
})
</script>
<style scoped>
.empty-state {
  --empty-color: var(--pwa-primary);
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 36px 20px;
  text-align: center;
  background: var(--surface);
  border: 1px dashed color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: var(--ui-radius-lg, 18px);
}
.empty-state.compact {
  padding: 22px 14px;
}
.tone-error {
  --empty-color: var(--q-negative);
}
.tone-success {
  --empty-color: var(--q-positive);
}
.empty-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  color: var(--empty-color);
  font-size: 32px;
  background: color-mix(in srgb, var(--empty-color) 12%, var(--surface));
  border-radius: 50%;
}
.empty-title {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}
.empty-text {
  max-width: 420px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}
</style>
