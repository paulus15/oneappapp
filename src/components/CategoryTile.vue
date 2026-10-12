<template>
  <router-link
    :to="`/categories/${category.slug}`"
    class="category-tile"
    :style="{ '--tile-color': color }"
  >
    <span class="tile-icon"
      ><q-icon :name="category.icon || 'category'"
    /></span>
    <span class="tile-copy">
      <strong>{{ ui(category.name) }}</strong>
      <small v-if="count !== null">{{
        t('store.categories.count', { n: count }, count)
      }}</small>
    </span>
    <q-icon name="chevron_right" class="tile-arrow" />
  </router-link>
</template>
<script setup>
import { ui } from '@/i18n/text'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { safeColor } from '@/utils/cover'

const props = defineProps({ category: { type: Object, required: true } })
const { t } = useI18n()
const color = computed(
  () => safeColor(props.category.color) || 'var(--pwa-primary)'
)
const count = computed(() =>
  props.category.applications_count === undefined
    ? null
    : Number(props.category.applications_count) || 0
)
</script>
<style scoped>
.category-tile {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: var(--text);
  text-decoration: none;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: var(--ui-radius-md);
  transition:
    transform var(--motion-base) var(--motion-settle),
    border-color var(--motion-fast) var(--motion-settle),
    box-shadow var(--motion-base) var(--motion-settle);
}
.category-tile:hover,
.category-tile:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--tile-color) 45%, var(--outline));
  box-shadow: var(--ui-shadow-sm);
}
.tile-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--tile-color);
  background: color-mix(in srgb, var(--tile-color) 14%, transparent);
  border-radius: 12px;
  transition: transform var(--motion-base) var(--motion-drop);
}
.category-tile:hover .tile-icon {
  transform: scale(1.08);
}
.tile-icon .q-icon {
  font-size: 22px;
}
.tile-copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
}
.tile-copy strong {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tile-copy small {
  color: var(--muted);
  font-size: 12px;
}
.tile-arrow {
  color: var(--muted);
  font-size: 18px;
}
@media (prefers-reduced-motion: reduce) {
  .category-tile,
  .tile-icon {
    transition: none;
  }
  .category-tile:hover,
  .category-tile:focus-visible,
  .category-tile:hover .tile-icon {
    transform: none;
  }
}
</style>
