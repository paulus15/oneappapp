<template>
  <div
    class="cover-image"
    :style="{ aspectRatio: ratio, '--cover-tint': tint, background: base }"
  >
    <picture v-if="picture && !failed">
      <source
        v-for="source in picture.sources"
        :key="source.format"
        :type="source.type"
        :srcset="source.srcset"
        :sizes="sizes"
      />
      <img
        :src="picture.fallback.src"
        :srcset="picture.fallback.srcset"
        :sizes="sizes"
        :width="picture.width"
        :height="picture.height"
        :alt="alt"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        decoding="async"
        @error="failed = true"
      />
    </picture>
    <div v-else class="cover-fallback">
      <span class="cover-fallback-icon">
        <AppIcon :src="iconUrl" :fallback-icon="icon" :alt="alt" />
      </span>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { coverSources } from '@/utils/cover'

// 16:9 application cover. The box is sized before the image arrives (aspect ratio and the
// dominant colour as background), so nothing moves when it loads. Without a cover, a
// gradient in the category colour carries the app icon.
const props = defineProps({
  cover: { type: Object, default: null },
  alt: { type: String, default: '' },
  sizes: { type: String, default: '100vw' },
  // The first visible cover (LCP): fetched eagerly and early.
  priority: { type: Boolean, default: false },
  fallbackColor: { type: String, default: 'var(--pwa-primary)' },
  icon: { type: String, default: 'widgets' },
  iconUrl: { type: String, default: '' },
  ratio: { type: String, default: '16 / 9' }
})
const picture = computed(() => coverSources(props.cover))
const failed = ref(false)
watch(picture, () => (failed.value = false))
const tint = computed(() => props.fallbackColor || 'var(--pwa-primary)')
const base = computed(() =>
  picture.value && !failed.value && picture.value.color
    ? picture.value.color
    : ''
)
</script>
<style scoped>
.cover-image {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: color-mix(in srgb, var(--cover-tint) 70%, var(--pwa-dark));
}
picture,
img {
  display: block;
  width: 100%;
  height: 100%;
}
img {
  object-fit: cover;
}
.cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(
      circle at 78% 18%,
      color-mix(in srgb, var(--pwa-secondary) 38%, transparent),
      transparent 55%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--cover-tint) 88%, var(--pwa-dark)),
      color-mix(in srgb, var(--cover-tint) 55%, var(--pwa-dark))
    );
}
.cover-fallback-icon {
  width: clamp(56px, 22%, 96px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--pwa-on-primary);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 22%;
  box-shadow: 0 18px 40px rgba(2, 5, 20, 0.28);
}
.cover-fallback-icon :deep(.q-icon) {
  font-size: clamp(26px, 4vw, 44px);
}
</style>
