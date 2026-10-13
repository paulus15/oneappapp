<template>
  <!-- Horizontally scrollable filter: "All" then the categories that hold visible apps. -->
  <div class="category-chips" role="tablist" :aria-label="ui('Catégories')">
    <button
      v-for="item in items"
      :key="item.slug || 'all'"
      type="button"
      role="tab"
      class="chip"
      :class="{ active: item.slug === modelValue }"
      :aria-selected="item.slug === modelValue"
      @click="$emit('update:modelValue', item.slug)"
    >
      {{ item.name }}
    </button>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { ui } from '@/i18n/text'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  // '' = all categories.
  modelValue: { type: String, default: '' }
})
defineEmits(['update:modelValue'])
const items = computed(() => [
  { slug: '', name: ui('Toutes') },
  // Category names are French source strings, translated like everywhere else.
  ...props.categories.map(c => ({ slug: c.slug, name: ui(c.name) }))
])
</script>
<style scoped>
.category-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  padding: 2px 0;
}
.category-chips::-webkit-scrollbar {
  display: none;
}
.chip {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 16px;
  scroll-snap-align: start;
  color: #dbe7ff;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.chip:hover {
  background: rgba(255, 255, 255, 0.18);
}
.chip.active {
  color: #fff;
  background: var(--pwa-primary);
  border-color: var(--pwa-primary);
}
.chip:focus-visible {
  outline: 3px solid #08c8f8;
  outline-offset: 2px;
}
</style>
