<template>
  <router-link :to="listingTo(app.to)" class="glass-panel app-card">
    <div class="app-icon" :style="{ background: app.color }">
      <AppIcon
        :src="app.iconUrl"
        :fallback-icon="app.icon"
        :alt="ui('Icône de {p0}', { p0: app.name })"
      />
    </div>
    <h3>{{ app.name }}</h3>
    <p>{{ app.publisher || ui(app.category) }}</p>
    <div class="card-meta">
      <span v-if="app.activations" class="rating">{{
        ui('{n} activations', { n: app.activations })
      }}</span>
      <span class="price">{{
        app.price > 0 ? priceLabel(app.price) : ui('Gratuit')
      }}</span>
      <span v-if="app.rating" class="rating"
        ><q-icon name="star" />{{ ratingLabel(app.rating) }}</span
      >
      <span v-else class="rating new">{{ ui('Nouveau') }}</span>
      <HostingBadge :source-type="app.sourceType" compact :focusable="false" />
    </div>
  </router-link>
</template>
<script setup>
import { ui } from '@/i18n/text'

import AppIcon from '@/components/AppIcon.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import { currentLocale } from '@/i18n'
import { useListingLink } from '@/composables/useListingSource'
defineProps({ app: { type: Object, required: true } })
const listingTo = useListingLink()
const priceLabel = value =>
  new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(value)
const ratingLabel = value =>
  new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 1 }).format(
    Number(value)
  )
</script>
<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 12px 10px 10px;
  border-radius: 15px;
  color: var(--text);
  text-decoration: none;
  transition:
    transform var(--motion-base) var(--motion-settle),
    background var(--motion-fast) var(--motion-settle),
    border-color var(--motion-fast) var(--motion-settle);
}
.app-card:hover,
.app-card:focus-visible {
  transform: translateY(-1px);
  background: var(--surface-high);
  border-color: color-mix(in srgb, var(--primary) 35%, transparent);
}
/* Press: the tile gives under the finger, like tapping an icon on a home screen. */
.app-card:active {
  transform: translateY(-1px) scale(0.97);
  transition-duration: var(--motion-fast);
}
.app-card:hover .app-icon,
.app-card:focus-visible .app-icon {
  transform: none;
  box-shadow: 0 12px 24px rgba(2, 5, 20, 0.24);
}
@media (prefers-reduced-motion: reduce) {
  .app-card,
  .app-card .app-icon {
    transition: none;
  }
  .app-card:hover,
  .app-card:focus-visible,
  .app-card:active,
  .app-card:hover .app-icon,
  .app-card:focus-visible .app-icon {
    transform: none;
  }
}
.app-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: 8px;
  color: var(--pwa-on-primary);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(2, 5, 20, 0.18);
  transition:
    transform var(--motion-base) var(--motion-drop),
    box-shadow var(--motion-base) var(--motion-settle);
}
h3 {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
p {
  max-width: 100%;
  margin: 2px 0 6px;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
}
.price {
  color: var(--pwa-link);
  font-weight: 700;
}
.rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--muted);
}
.rating .q-icon {
  color: var(--pwa-secondary);
  font-size: 12px;
}
.rating.new {
  font-size: 12px;
}
</style>
