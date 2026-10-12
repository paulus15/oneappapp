import { DURATION, prefersReducedMotion } from '@/motion/signature'

// Same curve as --motion-settle, for numbers animated with requestAnimationFrame.
const settle = t => 1 - Math.pow(1 - t, 4)
const format = n => Math.round(n).toLocaleString('fr-FR')

function run(el, to) {
  cancelAnimationFrame(el.__countFrame)
  const from = el.__countFrom ?? 0
  el.__countFrom = to
  if (prefersReducedMotion() || from === to) {
    el.textContent = format(to)
    return
  }
  const start = performance.now()
  const length = DURATION.base * 2000
  const tick = now => {
    const t = Math.min(1, (now - start) / length)
    el.textContent = format(from + (to - from) * settle(t))
    if (t < 1) el.__countFrame = requestAnimationFrame(tick)
  }
  el.__countFrame = requestAnimationFrame(tick)
}

function schedule(el, value) {
  const to = Number(value)
  // Non-numeric values ("—", text) are shown as they are.
  if (value === null || value === '' || !Number.isFinite(to)) {
    el.textContent = value ?? ''
    return
  }
  if (el.__countSeen) return run(el, to)
  el.textContent = format(0)
  el.__countObserver?.disconnect()
  el.__countObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    el.__countSeen = true
    el.__countObserver.disconnect()
    run(el, to)
  })
  el.__countObserver.observe(el)
}

/** v-count-up="number": counts up to the value the first time it becomes visible. */
export const countUp = {
  mounted: (el, { value }) => schedule(el, value),
  updated: (el, { value, oldValue }) =>
    value !== oldValue && schedule(el, value),
  unmounted(el) {
    cancelAnimationFrame(el.__countFrame)
    el.__countObserver?.disconnect()
  }
}
