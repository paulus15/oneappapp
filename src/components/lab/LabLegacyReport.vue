<template>
  <div class="summary">
    <div class="workspace-card score">
      <span>{{ ui('Score technique') }}</span>
      <strong>{{ report.score ?? '—' }}<small>/100</small></strong>
      <q-linear-progress
        :value="(report.score || 0) / 100"
        color="primary"
        rounded
        size="8px"
      />
    </div>
    <div class="workspace-card install">
      <q-icon
        :name="report.installable ? 'install_mobile' : 'block'"
        :color="report.installable ? 'positive' : 'negative'"
        size="28px"
      />
      <div>
        <strong>{{
          report.installable
            ? ui('Installation possible')
            : ui('Installation non réunie')
        }}</strong>
        <p>{{ installText }}</p>
      </div>
    </div>
  </div>
  <p class="text-caption text-muted">{{ report.limits }}</p>

  <section v-for="group in groups" :key="group.name" class="workspace-section">
    <h2>{{ group.name }}</h2>
    <q-list bordered separator class="rounded-borders">
      <q-item v-for="check in group.checks" :key="check.id">
        <q-item-section avatar>
          <q-icon
            :name="icons[check.status]?.icon || icons.info.icon"
            :color="icons[check.status]?.color || icons.info.color"
            :aria-label="icons[check.status]?.label || icons.info.label"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label
            >{{ check.label }}
            <span class="sr-only"
              >— {{ icons[check.status]?.label || icons.info.label }}</span
            ></q-item-label
          >
          <q-item-label caption>{{ check.detail }}</q-item-label>
          <q-item-label v-if="check.recommendation" class="advice"
            >→ {{ check.recommendation }}</q-item-label
          >
        </q-item-section>
      </q-item>
    </q-list>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { ui } from '@/i18n/text'

// Historical Lab view (fragment, no wrapper: the markup stays the one of the former page).
// Also safe for a pro-1 report (Lab Pro switched off): unknown statuses fall back to
// "information" and installability may be an object.
const props = defineProps({ analysis: { type: Object, required: true } })
const report = computed(() => props.analysis.report || {})
// Pro reports keep the former sentence in installability_note.
const installText = computed(() =>
  typeof report.value.installability === 'string'
    ? report.value.installability
    : (report.value.installability_note ?? '')
)
const icons = {
  pass: { icon: 'check_circle', color: 'positive', label: 'conforme' },
  warn: {
    icon: 'error_outline',
    color: 'warning',
    get label() {
      return ui('à améliorer')
    }
  },
  fail: {
    icon: 'cancel',
    color: 'negative',
    get label() {
      return ui('en échec')
    }
  },
  info: { icon: 'info', color: 'grey-7', label: 'information' }
}
const order = [
  'Accès',
  'Installation',
  'Métadonnées',
  'Responsive',
  'Accessibilité',
  'Performance'
]
const groups = computed(() => {
  const checks = Array.isArray(report.value.checks) ? report.value.checks : []
  return order
    .map(name => ({
      name: ui(name),
      checks: checks.filter(c => c.category === name || c.category === ui(name))
    }))
    .filter(g => g.checks.length)
})
</script>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(240px, 2fr);
  gap: 12px;
  margin-bottom: 8px;
}
@media (max-width: 600px) {
  .summary {
    grid-template-columns: 1fr;
  }
}
.score {
  display: grid;
  gap: 6px;
}
.score span {
  color: var(--muted);
}
.score strong {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
}
.score small {
  font-size: 16px;
  color: var(--muted);
}
.install {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.install p {
  margin: 4px 0 0;
  color: var(--muted);
}
h2 {
  font-size: 17px;
  font-weight: 750;
  margin: 18px 0 8px;
}
.advice {
  color: var(--pwa-link);
  font-size: 13px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
