<template>
  <div v-if="loading" class="app-grid" aria-busy="true">
    <q-skeleton v-for="n in 6" :key="n" height="128px" class="skeleton" />
  </div>
  <div v-else-if="apps.length" class="app-grid">
    <AppCard v-for="app in cards" :key="app.id" :app="app" />
  </div>
  <div v-else class="empty-state glass-panel">
    <q-icon :name="emptyIcon" />
    <p>{{ empty }}</p>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { toCard } from '@/utils/appCard'
const props = defineProps({
  apps: { type: Array, default: () => [] },
  loading: Boolean,
  empty: { type: String, default: 'Aucune application pour le moment.' },
  emptyIcon: { type: String, default: 'apps' }
})
const cards = computed(() => props.apps.map(toCard))
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
.empty-state {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 28px 16px;
  color: var(--muted);
  text-align: center;
}
.empty-state .q-icon {
  font-size: 32px;
}
.empty-state p {
  margin: 0;
}
</style>
