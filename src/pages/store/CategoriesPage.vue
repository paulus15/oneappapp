<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ t('store.categories.eyebrow') }}</span
      ><h1>{{ t('store.categories.title') }}</h1
      ><p>{{ t('store.categories.lead') }}</p></header
    >
    <div v-if="error" class="categories-state glass-panel" role="alert">
      <q-icon name="cloud_off" />
      <p>{{ t('store.categories.error') }}</p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="t('common.retry')"
        @click="load"
      />
    </div>
    <div v-else-if="loading" class="category-grid" aria-busy="true">
      <q-skeleton v-for="n in 8" :key="n" height="68px" class="skeleton" />
    </div>
    <div v-else-if="categories.length" class="category-grid">
      <CategoryTile
        v-for="category in categories"
        :key="category.id"
        :category="category"
      />
    </div>
    <div v-else class="categories-state glass-panel">
      <q-icon name="category" />
      <p>{{ t('store.categories.empty') }}</p>
    </div>
    <AppFooter />
  </q-page>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppFooter from '@/components/AppFooter.vue'
import CategoryTile from '@/components/CategoryTile.vue'
import { catalogApi } from '@/services/catalog'

const { t } = useI18n()
const categories = ref([]),
  loading = ref(true),
  error = ref(false)
async function load() {
  loading.value = true
  error.value = false
  try {
    const { data } = await catalogApi.categories()
    categories.value = (Array.isArray(data) ? data : []).filter(c => c?.slug)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.skeleton {
  border-radius: var(--ui-radius-md);
}
.categories-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--muted);
  text-align: center;
}
.categories-state > .q-icon {
  font-size: 36px;
}
.categories-state p {
  margin: 0;
}
@media (max-width: 420px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
