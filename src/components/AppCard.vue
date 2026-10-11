<template>
  <router-link :to="app.to" class="glass-panel app-card">
    <div class="app-icon" :style="{ background: app.color }">
      <AppIcon
        :src="app.iconUrl"
        :fallback-icon="app.icon"
        :alt="`Icône de ${app.name}`"
      />
    </div>
    <h3>{{ app.name }}</h3>
    <p>{{ app.publisher || app.category }}</p>
    <div class="card-meta">
      <span class="price">{{
        app.price > 0 ? `${app.price} FCFA` : 'Gratuit'
      }}</span>
      <span v-if="app.rating" class="rating"
        ><q-icon name="star" />{{ app.rating }}</span
      >
      <span v-else class="rating new">Nouveau</span>
    </div>
  </router-link>
</template>
<script setup>
import AppIcon from '@/components/AppIcon.vue'
defineProps({ app: { type: Object, required: true } })
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
    transform 0.25s var(--ui-ease),
    background 0.2s,
    border-color 0.2s;
}
.app-card:hover,
.app-card:focus-visible {
  transform: translateY(-5px);
  background: var(--surface-high);
  border-color: color-mix(in srgb, var(--primary) 35%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .app-card:hover,
  .app-card:focus-visible {
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
}
h3 {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
p {
  max-width: 100%;
  margin: 2px 0 6px;
  overflow: hidden;
  color: var(--muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
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
  font-size: 10px;
}
</style>
