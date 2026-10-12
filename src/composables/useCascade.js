import { onBeforeUnmount, ref, watch } from 'vue'
import { prefersReducedMotion } from '@/motion/signature'

/**
 * Children of `target` fill in, in reading order, the first time it scrolls into view
 * (`.motion-cascade` in app.scss, each child carrying `--i`). Never with reduced motion, and
 * never without IntersectionObserver: content is not conditioned by the animation.
 */
export function useCascade(target) {
  const landed = ref(false)
  const enabled =
    !prefersReducedMotion() && typeof IntersectionObserver !== 'undefined'
  let observer
  watch(target, value => {
    observer?.disconnect()
    const el = value?.$el ?? value
    if (!el || !enabled || landed.value) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        landed.value = true
        observer.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return { enabled, landed }
}
