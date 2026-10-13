<template>
  <!-- Store-style tile: large icon, name, category and rating (only when reviews exist). -->
  <router-link :to="card.to" class="store-tile" :aria-label="label">
    <span class="tile-icon" :style="{ '--tile-color': card.color }">
      <AppIcon
        :src="card.iconUrl"
        :alt="''"
        :fallback-icon="card.icon || 'apps'"
      />
    </span>
    <strong class="tile-name">{{ card.name }}</strong>
    <small v-if="card.category" class="tile-category">{{
      card.category
    }}</small>
    <small v-if="card.rating" class="tile-rating"
      ><q-icon name="star" aria-hidden="true" />{{ card.rating }}</small
    >
  </router-link>
</template>
<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { ui } from '@/i18n/text'
import { toCard } from '@/utils/appCard'

const props = defineProps({ app: { type: Object, required: true } })
const card = computed(() => toCard(props.app))
const label = computed(() =>
  [
    card.value.name,
    card.value.category,
    card.value.rating
      ? ui('Note {rating} sur 5', { rating: card.value.rating })
      : ''
  ]
    .filter(Boolean)
    .join(', ')
)
</script>
<style scoped>
.store-tile {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 6px;
  color: var(--text);
  text-decoration: none;
  border-radius: 16px;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}
.store-tile:hover {
  background: color-mix(in srgb, var(--primary) 6%, transparent);
}
.store-tile:active {
  transform: scale(0.97);
}
.store-tile:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--pwa-primary) 45%, transparent);
  outline-offset: 2px;
}
.tile-icon {
  width: 100%;
  aspect-ratio: 1;
  max-width: 96px;
  display: grid;
  place-items: center;
  overflow: hidden;
  margin-bottom: 6px;
  color: #fff;
  font-size: 34px;
  background: var(--tile-color, var(--pwa-primary));
  border-radius: 22%;
  box-shadow: 0 6px 16px rgba(4, 18, 51, 0.16);
}
.tile-icon :deep(.app-icon-fallback) {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}
.tile-name,
.tile-category {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tile-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}
.tile-category {
  color: var(--muted);
  font-size: 11.5px;
}
.tile-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
}
.tile-rating .q-icon {
  color: #ffb020;
  font-size: 14px;
}
@media (prefers-reduced-motion: reduce) {
  .store-tile {
    transition: none;
  }
}
</style>
