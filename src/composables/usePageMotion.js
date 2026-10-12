import { onMounted, onBeforeUnmount } from 'vue'

// Everything remains visible if animation cannot load or reduced motion is enabled.
export function usePageMotion(root) {
  let observer
  let context
  let disposed = false
  // Accepts an element or a component (e.g. a q-page ref).
  const el = () => root.value?.$el ?? root.value
  onMounted(async () => {
    const hero = el()?.querySelector('.hero-panel')
    if (hero) {
      observer = new IntersectionObserver(([entry]) =>
        hero.classList.toggle('motion-paused', !entry.isIntersecting)
      )
      observer.observe(hero)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    try {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger')
      ])
      if (disposed || !el()) return
      gsap.registerPlugin(ScrollTrigger)
      context = gsap.context(() => {
        gsap.from('.hero-copy > *', {
          y: 22,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.09,
          ease: 'power2.out',
          clearProps: 'all'
        })
        el()
          .querySelectorAll('[data-reveal]')
          .forEach(section => {
            gsap.from(section, {
              y: 20,
              autoAlpha: 0,
              duration: 0.55,
              clearProps: 'all',
              scrollTrigger: { trigger: section, start: 'top 94%', once: true }
            })
          })
        if (
          window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches
        ) {
          gsap.to('.device-scene', {
            y: 35,
            ease: 'none',
            scrollTrigger: {
              trigger: '.hero-panel',
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8
            }
          })
        }
      }, el())
    } catch {
      // Progressive enhancement: navigation and content never depend on motion.
    }
  })
  onBeforeUnmount(() => {
    disposed = true
    observer?.disconnect()
    context?.revert()
  })
}
