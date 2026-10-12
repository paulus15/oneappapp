<template>
  <figure class="trend">
    <figcaption>
      <span class="title">{{ title }}</span>
      <strong class="total">{{ total.toLocaleString(currentLocale()) }}</strong>
    </figcaption>
    <div
      ref="plot"
      class="plot"
      @pointermove="hover"
      @pointerleave="active = null"
    >
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="ui('{p0} : {p1} sur la période', { p0: title, p1: total })"
      >
        <line
          v-for="t in ticks"
          :key="t"
          :x1="0"
          :x2="W"
          :y1="y(t)"
          :y2="y(t)"
          class="grid"
        />
        <path :d="area" class="area" />
        <path :d="line" class="line" vector-effect="non-scaling-stroke" />
        <line
          v-if="active !== null"
          :x1="x(active)"
          :x2="x(active)"
          y1="0"
          :y2="H"
          class="crosshair"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <span
        v-if="active !== null"
        class="dot"
        :style="{
          left: `${(x(active) / W) * 100}%`,
          top: `${(y(points[active].value) / H) * 100}%`
        }"
      />
      <div
        v-if="active !== null"
        class="tooltip"
        :style="{
          left: `${Math.min(Math.max((x(active) / W) * 100, 12), 88)}%`
        }"
        role="status"
      >
        <span>{{ dayLabel(points[active].day) }}</span>
        <strong>{{ points[active].value }}</strong>
      </div>
      <span class="axis-max">{{ max }}</span>
    </div>
    <div class="axis-x">
      <span>{{ dayLabel(points[0]?.day) }}</span>
      <span>{{ dayLabel(points[points.length - 1]?.day) }}</span>
    </div>
  </figure>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, ref } from 'vue'

// Single-series trend: one hue, no legend (the title names the series).
const props = defineProps({
  title: { type: String, required: true },
  points: { type: Array, required: true } // [{ day: 'YYYY-MM-DD', value }]
})
const W = 300,
  H = 90,
  PAD = 6
const plot = ref(null),
  active = ref(null)
const total = computed(() => props.points.reduce((s, p) => s + p.value, 0))
const max = computed(() => Math.max(1, ...props.points.map(p => p.value)))
const ticks = computed(() => [max.value / 2, max.value])
const x = i =>
  props.points.length < 2 ? W / 2 : (i / (props.points.length - 1)) * W
const y = v => H - PAD - (v / max.value) * (H - PAD * 2)
const line = computed(() =>
  props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
)
const area = computed(() =>
  props.points.length
    ? `${line.value} L${x(props.points.length - 1)},${H} L${x(0)},${H} Z`
    : ''
)
const dayLabel = day =>
  day
    ? new Date(`${day}T00:00:00`).toLocaleDateString(currentLocale(), {
        day: 'numeric',
        month: 'short'
      })
    : ''
function hover(event) {
  const rect = plot.value.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  active.value = Math.round(
    Math.min(Math.max(ratio, 0), 1) * (props.points.length - 1)
  )
}
</script>
<style scoped>
.trend {
  margin: 0;
  min-width: 0;
}
figcaption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.title {
  color: var(--muted);
  font-size: 13px;
}
.total {
  color: var(--text);
  font-size: 22px;
  font-weight: 750;
}
.plot {
  position: relative;
  height: 110px;
  touch-action: pan-y;
  cursor: crosshair;
}
svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.grid {
  stroke: var(--pwa-chart-grid);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.line {
  fill: none;
  stroke: var(--pwa-chart-mark);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.area {
  fill: var(--pwa-chart-mark);
  opacity: 0.1;
}
.crosshair {
  stroke: var(--muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.dot {
  position: absolute;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  background: var(--pwa-chart-mark);
  box-shadow: 0 0 0 2px var(--pwa-surface);
  pointer-events: none;
}
.tooltip {
  position: absolute;
  top: 2px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--pwa-surface);
  border: 1px solid var(--outline);
  box-shadow: var(--ui-shadow-sm);
  color: var(--text);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}
.tooltip span {
  color: var(--muted);
}
.axis-max {
  position: absolute;
  top: -2px;
  left: 0;
  color: var(--muted);
  font-size: 10px;
}
.axis-x {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 11px;
  margin-top: 2px;
}
</style>
