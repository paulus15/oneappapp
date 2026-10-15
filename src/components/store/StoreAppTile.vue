<template>
  <!-- Store-style tile: large icon, name, category and rating (only when reviews exist). -->
  <router-link :to="listingTo(card.to)" class="store-tile" :aria-label="label">
    <!-- The backdrop is the logo itself, enlarged and blurred: each tile takes its app's own colours. -->
    <span class="tile-icon" :class="{ 'has-logo': card.iconUrl }">
      <span v-if="card.iconUrl" class="tile-glow" aria-hidden="true"
        ><AppIcon :src="card.iconUrl" alt=""
      /></span>
      <span class="tile-logo">
        <AppIcon
          :src="card.iconUrl"
          :alt="''"
          :fallback-icon="card.icon || 'apps'"
        />
      </span>
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
import { useListingLink } from '@/composables/useListingSource'

const props = defineProps({ app: { type: Object, required: true } })
const card = computed(() => toCard(props.app))
const listingTo = useListingLink()
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
/* Frosted square: a soft neutral base, the blurred logo glowing behind, the real logo on top. */
.tile-icon {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 96px;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  margin-bottom: 6px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--pwa-primary) 10%, var(--surface)),
    color-mix(in srgb, var(--pwa-secondary) 8%, var(--surface))
  );
  border: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
  border-radius: 24%;
  box-shadow:
    0 8px 22px rgba(4, 18, 51, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.tile-glow {
  position: absolute;
  inset: -30%;
  z-index: 0;
  opacity: 0.55;
  filter: blur(18px) saturate(1.6);
  transform: scale(1.1);
  pointer-events: none;
}
.tile-glow :deep(.app-icon-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* A broken logo shows no fallback glyph in the glow, only the soft base. */
.tile-glow :deep(.app-icon-fallback) {
  display: none;
}
/* Glass sheen over the glow, so every colour stays gentle. */
.tile-icon.has-logo::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.35),
    rgba(255, 255, 255, 0.05) 55%
  );
  pointer-events: none;
}
.tile-logo {
  position: relative;
  z-index: 2;
  width: 62%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--pwa-primary);
  font-size: 30px;
  border-radius: 24%;
  box-shadow: 0 6px 14px rgba(4, 18, 51, 0.22);
  transition: transform 0.3s ease;
}
/* No logo: the category glyph in brand blue on a light tint, readable in both themes. */
.tile-logo :deep(.app-icon-fallback) {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--pwa-primary);
  background: color-mix(in srgb, var(--pwa-primary) 14%, var(--surface));
}
.tile-logo :deep(.app-icon-fallback .q-icon) {
  color: inherit;
  font-size: 30px;
}
.store-tile:hover .tile-icon {
  box-shadow:
    0 12px 28px rgba(4, 18, 51, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.store-tile:hover .tile-logo {
  transform: translateY(-2px) scale(1.04);
}
/* Dark theme: the sheen would grey the glow; keep it faint. */
.body--dark .tile-icon.has-logo::after,
.theme-dark .tile-icon.has-logo::after {
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.12),
    transparent 60%
  );
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
  .store-tile,
  .tile-icon,
  .tile-logo {
    transition: none;
  }
}
</style>
