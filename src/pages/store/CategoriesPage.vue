<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Catalogue</span><h1>Catégories</h1
      ><p>Parcourez les applications publiées par thème.</p></header
    >
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <div v-if="loading" class="category-grid">
      <q-skeleton v-for="n in 8" :key="n" height="88px" class="skeleton" />
    </div>
    <div v-else class="category-grid">
      <router-link
        v-for="category in categories"
        :key="category.id"
        :to="`/categories/${category.slug}`"
        class="glass-panel category-card"
      >
        <q-icon
          :name="category.icon || 'category'"
          :style="{ color: category.color || 'var(--pwa-primary)' }"
        />
        <div>
          <strong>{{ category.name }}</strong>
          <small
            >{{ category.applications_count }} application{{
              category.applications_count > 1 ? 's' : ''
            }}</small
          >
        </div>
      </router-link>
    </div>
    <AppFooter />
  </q-page>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import { catalogApi } from '@/services/catalog'
import { apiMessage } from '@/services/account'

const categories = ref([]),
  loading = ref(true),
  error = ref('')
onMounted(async () => {
  try {
    categories.value = (await catalogApi.categories()).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
})
</script>
<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.category-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  color: var(--text);
  text-decoration: none;
  transition: border-color 0.2s ease;
}
.category-card:hover,
.category-card:focus-visible {
  border-color: var(--pwa-primary);
}
.category-card .q-icon {
  font-size: 28px;
}
.category-card div {
  display: flex;
  flex-direction: column;
}
.category-card small {
  color: var(--muted);
}
.skeleton {
  border-radius: 16px;
}
</style>
