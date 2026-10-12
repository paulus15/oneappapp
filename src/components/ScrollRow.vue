<template>
  <div class="scroll-row" :style="{ '--item-width': itemWidth }">
    <q-btn
      v-show="canPrev"
      round
      unelevated
      icon="chevron_left"
      class="scroll-nav scroll-prev"
      :aria-label="t('store.row.previous')"
      @click="go(-1)"
    />
    <div
      ref="track"
      class="scroll-track"
      :class="{ 'motion-cascade': cascade && cascadeOn, 'is-in': landed }"
      @scroll.passive="update"
    >
      <slot />
    </div>
    <q-btn
      v-show="canNext"
      round
      unelevated
      icon="chevron_right"
      class="scroll-nav scroll-next"
      :aria-label="t('store.row.next')"
      @click="go(1)"
    />
  </div>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCascade } from '@/composables/useCascade'
import { prefersReducedMotion } from '@/motion/signature'

// A horizontal, snapping list. Touch scrolls natively; mouse and keyboard users get
// previous / next buttons, shown only when there is somewhere to go.
const props = defineProps({
  itemWidth: { type: String, default: '150px' },
  // Children fill in with the shared cascade the first time the row is seen.
  cascade: { type: Boolean, default: false },
  // Re-measures when the content changes (e.g. data replacing skeletons).
  watchKey: { type: [String, Number], default: 0 }
})
const { t } = useI18n()
const track = ref(null)
const canPrev = ref(false),
  canNext = ref(false)
const { enabled: cascadeOn, landed } = useCascade(track)

function update() {
  const el = track.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  // In right-to-left layouts scrollLeft is negative; compare magnitudes.
  const position = Math.abs(el.scrollLeft)
  canPrev.value = position > 4
  canNext.value = max - position > 4
}

function go(direction) {
  const el = track.value
  if (!el) return
  el.scrollBy({
    left: direction * Math.max(el.clientWidth * 0.85, 120),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })
}

let resize
onMounted(() => {
  update()
  if (typeof ResizeObserver !== 'undefined' && track.value) {
    resize = new ResizeObserver(update)
    resize.observe(track.value)
  }
})
watch(
  () => props.watchKey,
  () => nextTick(update)
)
onBeforeUnmount(() => resize?.disconnect())
</script>
<style scoped>
.scroll-row {
  position: relative;
  min-width: 0;
}
.scroll-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--item-width);
  gap: 12px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  /* Room for the hover lift and the focus ring, which overflow would clip. */
  padding: 6px 0 12px;
  margin: -6px 0 -8px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-highest) transparent;
  -webkit-overflow-scrolling: touch;
}
.scroll-track::-webkit-scrollbar {
  height: 6px;
}
.scroll-track::-webkit-scrollbar-thumb {
  background: var(--surface-highest);
  border-radius: 4px;
}
.scroll-track > :deep(*) {
  min-width: 0;
  scroll-snap-align: start;
}
.scroll-nav {
  position: absolute;
  z-index: 2;
  top: 50%;
  width: 38px;
  height: 38px;
  min-height: 38px;
  color: var(--text);
  background: var(--surface-low);
  border: 1px solid var(--outline);
  box-shadow: var(--ui-shadow-md);
  transform: translateY(-50%);
}
.scroll-nav:not(.disabled):hover {
  transform: translateY(-50%);
  color: var(--pwa-link);
}
.scroll-prev {
  left: -10px;
}
.scroll-next {
  right: -10px;
}
/* Touch screens scroll with the finger; the buttons would only cover content. */
@media (hover: none) {
  .scroll-nav {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scroll-track {
    scroll-behavior: auto;
  }
}
</style>
