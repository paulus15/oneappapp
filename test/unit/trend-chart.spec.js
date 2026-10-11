import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, writeFileSync } from 'node:fs'
import TrendChart from '@/components/TrendChart.vue'

const points = Array.from({ length: 30 }, (_, i) => ({
  day: `2026-09-${String(i + 1).padStart(2, '0')}`,
  value: [0, 2, 5, 3, 8, 13, 9, 7, 12, 18][i % 10] + Math.floor(i / 3)
}))

describe('TrendChart', () => {
  it('draws one series, totals it and shows a tooltip on hover', async () => {
    const wrapper = mount(TrendChart, {
      props: { title: 'Vues de la fiche', points }
    })
    const total = points.reduce((s, p) => s + p.value, 0)
    expect(wrapper.find('.total').text()).toBe(total.toLocaleString('fr-FR'))
    expect(wrapper.findAll('path.line')).toHaveLength(1)
    expect(wrapper.find('svg').attributes('aria-label')).toContain(
      'Vues de la fiche'
    )
    const plot = wrapper.find('.plot')
    plot.element.getBoundingClientRect = () => ({ left: 0, width: 290 })
    await plot.trigger('pointermove', { clientX: 290 })
    expect(wrapper.find('.tooltip').text()).toContain(String(points[29].value))
    await plot.trigger('pointerleave')
    expect(wrapper.find('.tooltip').exists()).toBe(false)

    // Optional visual check: CHART_SNAPSHOT=<dir> writes a page to screenshot.
    if (process.env.CHART_SNAPSHOT) {
      await plot.trigger('pointermove', { clientX: 200 })
      const css = readFileSync('src/components/TrendChart.vue', 'utf8')
        .split('<style scoped>')[1]
        .split('</style>')[0]
      const card = theme => `<div class="card ${theme}">${wrapper.html()}</div>`
      writeFileSync(
        `${process.env.CHART_SNAPSHOT}/trend.html`,
        `<!doctype html><meta charset="utf-8"><style>
body{margin:0;display:flex;gap:16px;padding:16px;background:#f6f9ff;font-family:system-ui}
.card{width:300px;padding:14px;border-radius:14px}
.light{--pwa-chart-mark:#075bff;--pwa-chart-grid:#dde5f2;--pwa-surface:#fff;--muted:#64748b;--text:#08132d;--outline:#dde5f2;background:#fff}
.dark{--pwa-chart-mark:#4d8bff;--pwa-chart-grid:#2d4163;--pwa-surface:#142343;--muted:#aabbd7;--text:#f8faff;--outline:#2d4163;background:#142343}
${css}</style>${card('light')}${card('dark')}`
      )
    }
  })
})
