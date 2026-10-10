<template>
  <img
    v-if="resolvedSource && !loadFailed"
    :src="resolvedSource"
    :alt="alt"
    class="app-icon-image"
    loading="lazy"
    decoding="async"
    referrerpolicy="no-referrer"
    @error="loadFailed = true"
  />
  <span v-else class="app-icon-fallback">
    <q-icon :name="fallbackIcon" />
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { resolveMediaUrl } from '@/utils/media'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  fallbackIcon: { type: String, default: 'apps' }
})

const resolvedSource = computed(() => resolveMediaUrl(props.src))
const loadFailed = ref(false)

watch(resolvedSource, () => {
  loadFailed.value = false
})
</script>

<style scoped>
.app-icon-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
}

.app-icon-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--pwa-on-primary);
  background: rgba(24, 24, 27, 0.2);
  border-radius: inherit;
}
</style>
