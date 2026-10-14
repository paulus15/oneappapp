<template>
  <div v-if="loading" class="app-grid" aria-busy="true">
    <q-skeleton v-for="n in 6" :key="n" height="128px" class="skeleton" />
  </div>
  <div
    v-else-if="apps.length"
    ref="grid"
    class="app-grid"
    :class="{ 'motion-cascade': cascade, 'is-in': landed }"
  >
    <AppCard
      v-for="(app, i) in cards"
      :key="app.id"
      :app="app"
      :style="{ '--i': i }"
    />
  </div>
  <EmptyState
    v-else
    :icon="emptyIcon"
    :text="empty || t('store.empty.default')"
  />
</template>
<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/AppCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useCascade } from '@/composables/useCascade'
import { toCard } from '@/utils/appCard'
const props = defineProps({
  apps: { type: Array, default: () => [] },
  loading: Boolean,
  empty: { type: String, default: '' },
  emptyIcon: { type: String, default: 'apps' }
})
const { t } = useI18n()
const cards = computed(() => props.apps.map(toCard))

// Tiles fill in, in reading order, the first time the grid scrolls into view.
const grid = ref(null)
const { enabled: cascade, landed } = useCascade(grid)
</script>
<style scoped>
.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.skeleton {
  border-radius: 15px;
}
</style>
