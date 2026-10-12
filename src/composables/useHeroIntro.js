import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  DURATION,
  EASE,
  loadGsap,
  prefersReducedMotion
} from '@/motion/signature'

const PLAYED = 'pwa-hero-played'

function alreadyPlayed() {
  try {
    return sessionStorage.getItem(PLAYED) === '1'
  } catch {
    return true
  }
}

/**
 * The site's single orchestrated moment: platforms converge on the phone, the PWA icon is
 * "installed" into it, the promise rises line by line, then the actions arrive. Played once per
 * session; never with reduced motion. `intro` drives the hidden first-paint state so the hero
 * never flashes before the sequence, and a safety timer always reveals the content.
 */
export function useHeroIntro(root) {
  const intro = ref(!prefersReducedMotion() && !alreadyPlayed())
  let context
  let safety
  let disposed = false
  const el = () => root.value?.$el ?? root.value
  const reveal = () => {
    intro.value = false
    clearTimeout(safety)
  }

  onMounted(async () => {
    if (!intro.value) return
    safety = setTimeout(reveal, 2500)
    try {
      const { gsap } = await loadGsap()
      const hero = el()
      if (disposed || !hero) return reveal()
      context = gsap.context(() => {
        const q = gsap.utils.selector(hero)
        const scene = q('.device-scene')[0]
        const centre = scene?.getBoundingClientRect()
        // Each platform badge starts further out along its own axis from the phone.
        const away = (badge, axis) => {
          if (!centre) return 0
          const r = badge.getBoundingClientRect()
          const delta =
            axis === 'x'
              ? r.left + r.width / 2 - (centre.left + centre.width / 2)
              : r.top + r.height / 2 - (centre.top + centre.height / 2)
          return delta * 1.6
        }
        const tl = gsap.timeline({
          defaults: { ease: EASE.settle },
          onComplete() {
            try {
              sessionStorage.setItem(PLAYED, '1')
            } catch {
              // Private mode: the intro may simply play again next time.
            }
          }
        })
        tl.fromTo(
          q('.eyebrow'),
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: DURATION.base }
        )
          .fromTo(
            q('.line-inner'),
            // y is pinned to 0: GSAP would otherwise keep the first-paint CSS offset as y.
            { y: 0, yPercent: 110 },
            { y: 0, yPercent: 0, duration: DURATION.hero, stagger: 0.12 },
            0.08
          )
          .fromTo(
            q('.phone-wrap'),
            { y: 30, scale: 0.94, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, duration: DURATION.hero },
            0.1
          )
          .fromTo(
            q('.platform-badge'),
            {
              x: (i, b) => away(b, 'x'),
              y: (i, b) => away(b, 'y'),
              scale: 0.7,
              autoAlpha: 0
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              autoAlpha: 1,
              duration: DURATION.hero,
              stagger: 0.07
            },
            0.3
          )
          .fromTo(
            q('.hero-brand-icon'),
            { y: -40, scale: 0.55, autoAlpha: 0 },
            {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              duration: DURATION.base * 1.4,
              ease: EASE.drop
            },
            0.55
          )
          .fromTo(
            q('.install-ring'),
            { scale: 0.6, autoAlpha: 0.55 },
            { scale: 1.7, autoAlpha: 0, duration: DURATION.hero },
            0.82
          )
          .fromTo(
            q('.hero-copy > p'),
            { y: 10, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: DURATION.base },
            0.45
          )
          .fromTo(
            q('.hero-actions > *'),
            { y: 12, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: DURATION.base, stagger: 0.08 },
            0.62
          )
        // Inline "from" values now hold everything hidden: drop the first-paint class.
        reveal()
        tl.eventCallback('onInterrupt', reveal)
      }, hero)
    } catch {
      reveal()
    }
  })

  onBeforeUnmount(() => {
    disposed = true
    clearTimeout(safety)
    context?.revert()
  })

  return { intro }
}
