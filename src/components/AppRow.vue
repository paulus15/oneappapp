<template>
  <section
    v-if="loading || apps.length"
    :id="id || undefined"
    class="app-row"
    :aria-labelledby="headingId"
    :aria-busy="loading && !apps.length ? 'true' : undefined"
  >
    <header class="row-heading">
      <div class="row-titles">
        <span v-if="kicker" class="row-kicker">{{ kicker }}</span>
        <h2 :id="headingId">{{ title }}</h2>
      </div>
      <router-link
        v-if="to && apps.length"
        :to="to"
        class="row-more"
        :aria-label="t('store.row.seeAllOf', { title })"
        >{{ t('store.row.seeAll') }} <q-icon name="arrow_forward"
      /></router-link>
    </header>

    <ScrollRow
      :item-width="featured ? FEATURED_WIDTH : COMPACT_WIDTH"
      :cascade="!showSkeleton"
      :watch-key="showSkeleton ? -1 : apps.length"
    >
      <template v-if="showSkeleton">
        <div v-for="n in featured ? 3 : 7" :key="n" class="row-skeleton">
          <q-skeleton
            :height="featured ? 'auto' : '128px'"
            :class="featured ? 'skeleton-cover' : 'skeleton-card'"
          />
          <template v-if="featured">
            <q-skeleton type="text" width="60%" />
            <q-skeleton type="text" width="40%" />
          </template>
        </div>
      </template>
      <template v-else-if="featured">
        <FeaturedCard
          v-for="(app, i) in apps"
          :key="app.id"
          :app="app"
          :priority="priority && i === 0"
          :style="{ '--i': i }"
        />
      </template>
      <template v-else>
        <AppCard
          v-for="(card, i) in cards"
          :key="card.id"
          :app="card"
          :style="{ '--i': i }"
        />
      </template>
    </ScrollRow>
  </section>
</template>
<script setup>
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/AppCard.vue'
import FeaturedCard from '@/components/FeaturedCard.vue'
import ScrollRow from '@/components/ScrollRow.vue'
import { toCard } from '@/utils/appCard'

// A titled horizontal row of applications. It hides itself when there is nothing to show:
// an empty row is noise, never a placeholder for invented content.
const props = defineProps({
  title: { type: String, required: true },
  kicker: { type: String, default: '' },
  to: { type: String, default: '' },
  id: { type: String, default: '' },
  apps: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  variant: {
    type: String,
    default: 'compact',
    validator: v => ['compact', 'featured'].includes(v)
  },
  // The first featured cover is the page's largest image: load it first.
  priority: { type: Boolean, default: false }
})
const COMPACT_WIDTH = 'clamp(136px, 34vw, 164px)'
const FEATURED_WIDTH = 'min(520px, 86vw)'
const { t } = useI18n()
const headingId = `row-${useId()}`
const featured = computed(() => props.variant === 'featured')
const showSkeleton = computed(() => props.loading && !props.apps.length)
const cards = computed(() => props.apps.map(toCard))
</script>
<style scoped>
.app-row {
  min-width: 0;
}
.row-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.row-titles {
  min-width: 0;
}
.row-kicker {
  display: block;
  color: var(--pwa-link);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.row-heading h2 {
  margin: 0;
  font-size: clamp(17px, 2vw, 20px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.row-more {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 2px;
  color: var(--pwa-link);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}
.row-more .q-icon {
  transition: transform var(--motion-fast) var(--motion-settle);
}
.row-more:hover .q-icon {
  transform: translateX(2px);
}
.row-skeleton {
  display: grid;
  gap: 6px;
}
.skeleton-card {
  border-radius: 15px;
}
.skeleton-cover {
  aspect-ratio: 16 / 9;
  border-radius: var(--ui-radius-lg);
}
@media (prefers-reduced-motion: reduce) {
  .row-more:hover .q-icon {
    transform: none;
  }
}
</style>
