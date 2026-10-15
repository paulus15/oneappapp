<template>
  <figure class="trend">
    <figcaption>
      <span class="title">{{ title }}</span>
      <strong class="total">{{
        summary ?? total.toLocaleString(currentLocale())
      }}</strong>
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
        :aria-label="
          ui('{p0} : {p1} sur la période', {
            p0: title,
            p1: summary ?? total
          })
        "
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
        v-if="active !== null && hasValue(points[active])"
        class="dot"
        :class="{ partial: points[active].partial }"
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
        :class="{ partial: points[active].partial }"
        role="status"
      >
        <span
          >{{ points[active].label || dayLabel(points[active].day)
          }}{{ points[active].partial ? ` ${ui('(partielle)')}` : '' }}</span
        >
        <strong>{{
          hasValue(points[active]) ? `${points[active].value}${unit}` : '—'
        }}</strong>
      </div>
      <span class="axis-max">{{ max }}{{ unit }}</span>
    </div>
    <div class="axis-x">
      <span>{{ points[0]?.label || dayLabel(points[0]?.day) }}</span>
      <span>{{ points.at(-1)?.label || dayLabel(points.at(-1)?.day) }}</span>
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
  // [{ day: 'YYYY-MM-DD', value, label?, partial? }]; a null value is drawn as a gap.
  // `label` replaces the day in the tooltip (e.g. a week), `partial` flags an incomplete bucket.
  points: { type: Array, required: true },
  // Replaces the sum when adding values makes no sense (averages, ratios).
  summary: { type: String, default: null },
  // Appended to tooltip and axis values, e.g. ' ms'.
  unit: { type: String, default: '' }
})
const W = 300,
  H = 90,
  PAD = 6
const plot = ref(null),
  active = ref(null)
const hasValue = point =>
  point?.value !== null &&
  point?.value !== undefined &&
  Number.isFinite(Number(point.value))
const total = computed(() =>
  props.points.reduce((s, p) => s + (hasValue(p) ? p.value : 0), 0)
)
const max = computed(() =>
  Math.max(1, ...props.points.filter(hasValue).map(p => p.value))
)
const ticks = computed(() => [max.value / 2, max.value])
const x = i =>
  props.points.length < 2 ? W / 2 : (i / (props.points.length - 1)) * W
const y = v => H - PAD - (v / max.value) * (H - PAD * 2)
// Consecutive measured points; missing days split the line instead of being joined.
const runs = computed(() => {
  const result = []
  let run = []
  props.points.forEach((p, i) => {
    if (hasValue(p)) run.push(i)
    else if (run.length) {
      result.push(run)
      run = []
    }
  })
  if (run.length) result.push(run)
  return result
})
const path = run =>
  run.length === 1
    ? // An isolated day stays visible as a short round-capped stroke.
      `M${x(run[0]) - 1},${y(props.points[run[0]].value)} L${x(run[0]) + 1},${y(props.points[run[0]].value)}`
    : run
        .map((i, n) => `${n ? 'L' : 'M'}${x(i)},${y(props.points[i].value)}`)
        .join(' ')
const line = computed(() => runs.value.map(path).join(' '))
const area = computed(() =>
  runs.value
    .filter(run => run.length > 1)
    .map(
      run => `${path(run)} L${x(run[run.length - 1])},${H} L${x(run[0])},${H} Z`
    )
    .join(' ')
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
.tooltip.partial strong,
.dot.partial {
  opacity: 0.6;
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
