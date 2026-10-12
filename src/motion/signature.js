// PWA Store motion signature, shared by every GSAP sequence. CSS uses the same values as
// custom properties (--motion-settle, --motion-drop, --motion-fast/base/hero in app.scss).
export const DURATION = { fast: 0.16, base: 0.42, hero: 0.9 }
export const EASE = { settle: 'pwa.settle', drop: 'pwa.drop' }

export const prefersReducedMotion = () =>
  typeof window === 'undefined' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let loading = null
/** Loads GSAP on demand (kept off the critical path) and registers the signature curves. */
export function loadGsap() {
  loading ??= Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/CustomEase')
  ]).then(([{ gsap }, { ScrollTrigger }, { CustomEase }]) => {
    gsap.registerPlugin(ScrollTrigger, CustomEase)
    CustomEase.create(EASE.settle, 'M0,0 C0.16,1 0.3,1 1,1')
    CustomEase.create(EASE.drop, 'M0,0 C0.34,1.36 0.64,1 1,1')
    gsap.defaults({ ease: EASE.settle, duration: DURATION.base })
    return { gsap, ScrollTrigger }
  })
  return loading
}
