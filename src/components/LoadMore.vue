<template>
  <!-- "Voir plus" for server-side pages: becomes a loader while the next page arrives. -->
  <div ref="root" class="load-more" aria-live="polite">
    <template v-if="hasMore">
      <button
        type="button"
        class="load-more-btn"
        :class="{ 'is-loading': loading }"
        :disabled="loading"
        :aria-busy="loading"
        @click="$emit('load')"
      >
        <span v-if="loading" class="dots" aria-hidden="true"
          ><i /><i /><i
        /></span>
        <q-icon v-else name="expand_more" aria-hidden="true" />
        <span>{{ loading ? ui('Chargement…') : ui('Voir plus') }}</span>
      </button>
      <small v-if="total" class="load-more-count">{{
        ui('{shown} sur {total}', { shown, total })
      }}</small>
      <small v-if="error" class="load-more-error" role="alert">{{
        ui('La suite n’a pas pu être chargée. Réessayez.')
      }}</small>
    </template>
    <p v-else-if="shown > 0 && total > pageSize" class="load-more-end">
      <q-icon name="check_circle" aria-hidden="true" />
      {{ ui('Vous avez tout vu ({total}).', { total }) }}
    </p>
  </div>
</template>
<script setup>
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { ui } from '@/i18n/text'

const props = defineProps({
  hasMore: Boolean,
  loading: Boolean,
  error: Boolean,
  shown: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  // The "all seen" line only appears for lists longer than one page.
  pageSize: { type: Number, default: 0 },
  // Loads the next page by itself when the button scrolls into view.
  auto: Boolean
})
const emit = defineEmits(['load'])
const root = ref(null)
let observer

onMounted(() => {
  if (!props.auto || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    entries => {
      if (
        entries.some(e => e.isIntersecting) &&
        props.hasMore &&
        !props.loading &&
        !props.error
      )
        emit('load')
    },
    { rootMargin: '240px 0px' }
  )
  observer.observe(root.value)
})
watch(
  () => [props.loading, props.hasMore, props.auto],
  async () => {
    await nextTick()
    if (!observer || !root.value) return
    observer.unobserve(root.value)
    observer.observe(root.value)
  }
)
onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped>
.load-more {
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 18px 0 6px;
}
.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 22px;
  color: var(--pwa-primary);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: color-mix(in srgb, var(--pwa-primary) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--pwa-primary) 22%, transparent);
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(7, 91, 255, 0.1);
  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.load-more-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--pwa-primary) 14%, var(--surface));
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(7, 91, 255, 0.16);
}
.load-more-btn:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--pwa-primary) 45%, transparent);
  outline-offset: 2px;
}
.load-more-btn.is-loading {
  cursor: progress;
}
.load-more-btn .q-icon {
  font-size: 20px;
}
.dots {
  display: inline-flex;
  gap: 4px;
}
.dots i {
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
  animation: bounce 1s infinite ease-in-out;
}
.dots i:nth-child(2) {
  animation-delay: 0.15s;
}
.dots i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-4px);
  }
}
.load-more-count,
.load-more-end {
  color: var(--muted);
  font-size: 12.5px;
}
.load-more-end {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.load-more-end .q-icon {
  color: var(--q-positive);
}
.load-more-error {
  color: var(--q-negative);
  font-size: 12.5px;
}
@media (prefers-reduced-motion: reduce) {
  .dots i {
    animation: none;
    opacity: 0.7;
  }
  .load-more-btn {
    transition: none;
  }
}
</style>
