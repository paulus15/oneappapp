<template>
  <router-link :to="card.to" class="featured-card">
    <div class="featured-cover">
      <CoverImage
        :cover="card.cover"
        :priority="priority"
        :fallback-color="card.color"
        :icon="card.icon"
        :icon-url="card.iconUrl"
        sizes="(min-width: 1024px) 520px, 86vw"
      />
    </div>
    <div class="featured-body">
      <span class="featured-icon" :style="{ background: card.color }">
        <AppIcon
          :src="card.iconUrl"
          :fallback-icon="card.icon"
          :alt="t('store.card.iconAlt', { name: card.name })"
        />
      </span>
      <div class="featured-copy">
        <h3>{{ card.name }}</h3>
        <p class="featured-meta">
          <span v-if="card.category">{{ ui(card.category) }}</span>
          <span v-if="card.rating" class="featured-rating"
            ><q-icon name="star" />{{ card.rating }}</span
          >
          <HostingBadge
            :source-type="card.sourceType"
            compact
            :focusable="false"
          />
        </p>
        <p v-if="card.shortDescription" class="featured-desc">{{
          card.shortDescription
        }}</p>
      </div>
      <span class="featured-cta" aria-hidden="true">{{
        t('store.featured.cta')
      }}</span>
    </div>
  </router-link>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import CoverImage from '@/components/CoverImage.vue'
import HostingBadge from '@/components/HostingBadge.vue'
import { toCard } from '@/utils/appCard'
import { ui } from '@/i18n/text'

// "À la une": the whole card is one link; the CTA is a visual cue, not a second stop.
const props = defineProps({
  app: { type: Object, required: true },
  priority: { type: Boolean, default: false }
})
const { t } = useI18n()
const card = computed(() => toCard(props.app))
</script>
<style scoped>
.featured-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text);
  text-decoration: none;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: var(--ui-radius-lg);
  box-shadow: var(--ui-shadow-sm);
  transition:
    transform var(--motion-base) var(--motion-settle),
    box-shadow var(--motion-base) var(--motion-settle),
    border-color var(--motion-fast) var(--motion-settle);
}
.featured-cover {
  overflow: hidden;
}
.featured-cover :deep(img) {
  transition: transform var(--motion-hero) var(--motion-settle);
}
.featured-card:hover,
.featured-card:focus-visible {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--primary) 35%, var(--outline));
  box-shadow: var(--ui-shadow-md);
}
.featured-card:hover .featured-cover :deep(img) {
  transform: scale(1.03);
}
.featured-card:active {
  transform: translateY(-1px) scale(0.99);
}
.featured-body {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px 14px;
}
.featured-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  overflow: hidden;
  margin-top: -34px;
  color: var(--pwa-on-primary);
  border: 3px solid var(--surface-low);
  border-radius: 16px;
  box-shadow: 0 10px 22px rgba(2, 5, 20, 0.22);
  transition: transform var(--motion-base) var(--motion-drop);
}
.featured-card:hover .featured-icon {
  transform: translateY(-3px) scale(1.04);
}
.featured-copy {
  min-width: 0;
}
.featured-copy h3 {
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.featured-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.featured-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.featured-rating .q-icon {
  color: var(--pwa-accent);
  font-size: 13px;
}
.featured-desc {
  display: -webkit-box;
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.featured-cta {
  align-self: center;
  padding: 7px 14px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
  white-space: nowrap;
}
@media (max-width: 479px) {
  .featured-body {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .featured-cta {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .featured-card,
  .featured-icon,
  .featured-cover :deep(img) {
    transition: none;
  }
  .featured-card:hover,
  .featured-card:focus-visible,
  .featured-card:active,
  .featured-card:hover .featured-icon,
  .featured-card:hover .featured-cover :deep(img) {
    transform: none;
  }
}
</style>
