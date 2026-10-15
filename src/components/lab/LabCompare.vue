<template>
  <section
    class="lab-compare workspace-card"
    aria-labelledby="lab-compare-title"
    :aria-busy="loading ? 'true' : 'false'"
  >
    <header class="compare-head">
      <h2 id="lab-compare-title" ref="heading" tabindex="-1">
        {{ ui('Comparaison') }}
      </h2>
      <q-btn
        flat
        round
        dense
        icon="close"
        class="close-compare"
        :aria-label="ui('Fermer la comparaison')"
        @click="$emit('close')"
      />
    </header>

    <div v-if="loading" class="compare-loading" role="status">
      <q-spinner size="22px" aria-hidden="true" />
      {{ ui('Comparaison en cours…') }}
    </div>
    <EmptyState
      v-else-if="error"
      compact
      :tone="errorStatus === 404 || errorStatus === 422 ? 'neutral' : 'error'"
      :icon="errorStatus === 422 ? 'compare_arrows' : 'history'"
      class="compare-error"
      :title="error"
    />
    <template v-else-if="data">
      <div class="compare-sides">
        <div class="side" data-side="base">
          <span>{{ ui('Avant') }}</span>
          <strong>{{ labDate(data.base?.created_at) }}</strong>
          <small v-if="data.base?.score != null">{{
            ui('Score technique (indicatif) : {n}/100', { n: data.base.score })
          }}</small>
        </div>
        <q-icon name="arrow_forward" size="22px" aria-hidden="true" />
        <div class="side" data-side="target">
          <span>{{ ui('Après') }}</span>
          <strong>{{ labDate(data.target?.created_at) }}</strong>
          <small v-if="data.target?.score != null">{{
            ui('Score technique (indicatif) : {n}/100', {
              n: data.target.score
            })
          }}</small>
        </div>
      </div>

      <div class="compare-groups">
        <section
          v-for="group in groups"
          :key="group.key"
          class="compare-group"
          :class="`group-${group.key}`"
          :data-group="group.key"
        >
          <h3>
            <q-icon :name="group.icon" aria-hidden="true" />
            {{ group.title }}
            <span class="group-count">({{ group.items.length }})</span>
          </h3>
          <p v-if="group.hint" class="group-hint">{{ group.hint }}</p>
          <ul v-if="group.items.length">
            <li v-for="item in group.items" :key="item.id">
              <span class="item-label">{{ item.label }}</span>
              <span v-if="group.key === 'changed'" class="item-change">
                {{ statusLabel(item.from) }} → {{ statusLabel(item.to) }}
              </span>
              <span v-else-if="item.severity" class="item-meta">
                {{ severityLabel(item.severity) }} ·
                {{ categoryLabel(item.category_key, item.category) }}
              </span>
            </li>
          </ul>
          <p v-else class="text-muted">{{ ui('Aucun') }}</p>
        </section>
      </div>

      <section v-if="deltas.length" class="compare-metrics">
        <h3>{{ ui('Évolution des mesures') }}</h3>
        <ul class="delta-list">
          <li
            v-for="delta in deltas"
            :key="delta.key"
            class="delta"
            :class="`tone-${delta.tone}`"
            :data-metric="delta.key"
          >
            <span class="delta-label">{{ delta.label }}</span>
            <span class="delta-values">{{ delta.from }} → {{ delta.to }}</span>
            <span class="delta-trend">
              <span aria-hidden="true">{{ delta.arrow }}</span>
              {{ delta.text }}
            </span>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { ui } from '@/i18n/text'
import {
  categoryLabel,
  labDate,
  metricDeltas,
  severityLabel,
  statusLabel
} from '@/utils/lab'

const props = defineProps({
  loading: Boolean,
  // Message already worded for the user (404, 422 or server message).
  error: { type: String, default: '' },
  errorStatus: { type: Number, default: 0 },
  // { base, target, fixed, new, persisting, changed, metrics }
  data: { type: Object, default: null }
})
defineEmits(['close'])

const list = value => (Array.isArray(value) ? value : [])
const groups = computed(() => [
  {
    key: 'fixed',
    title: ui('Corrigés'),
    icon: 'task_alt',
    items: list(props.data?.fixed)
  },
  {
    key: 'new',
    title: ui('Nouveaux'),
    icon: 'new_releases',
    items: list(props.data?.new)
  },
  {
    key: 'persisting',
    title: ui('Persistants'),
    icon: 'pending',
    items: list(props.data?.persisting)
  },
  {
    key: 'changed',
    title: ui('Modifiés'),
    icon: 'swap_horiz',
    // A persisting check whose status moved (warn ↔ fail) is listed in both groups.
    hint: ui(
      'Statut changé ; un point peut aussi figurer parmi les persistants.'
    ),
    items: list(props.data?.changed)
  },
  {
    key: 'removed',
    title: ui('Disparus (non revérifiés)'),
    icon: 'help_outline',
    hint: ui(
      'Signalés dans l’analyse précédente mais absents de la nouvelle : ils n’ont pas été revérifiés, ce n’est pas une correction confirmée.'
    ),
    items: list(props.data?.removed)
  }
])
// Move the focus (and the view) to the comparison as soon as it opens.
const heading = ref(null)
onMounted(async () => {
  await nextTick()
  heading.value?.focus?.({ preventScroll: true })
  heading.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
})

const deltas = computed(() => metricDeltas(props.data?.metrics))
</script>

<style scoped>
.lab-compare {
  margin-bottom: 18px;
}
.compare-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.compare-head h2,
.lab-compare h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}
.lab-compare h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 15px;
}
.compare-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--muted);
}
.compare-sides {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 12px 0 16px;
}
.side {
  display: grid;
  gap: 2px;
}
.side span,
.side small {
  color: var(--muted);
  font-size: 12.5px;
}
.compare-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}
.compare-group {
  padding: 12px;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 12px;
}
.group-fixed h3 .q-icon {
  color: var(--q-positive);
}
.group-new h3 .q-icon {
  color: var(--q-negative);
}
.compare-head h2:focus {
  outline: none;
}
.compare-head h2:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.group-hint {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 12.5px;
}
.group-count {
  color: var(--muted);
  font-weight: 600;
}
.compare-group ul,
.delta-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.compare-group li {
  display: grid;
  gap: 2px;
  padding: 6px 0;
  border-top: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
}
.item-label {
  font-weight: 650;
  overflow-wrap: anywhere;
}
.item-change,
.item-meta {
  color: var(--muted);
  font-size: 12.5px;
}
.compare-metrics {
  margin-top: 16px;
}
.delta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
  padding: 8px 0;
  border-top: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
}
@media (min-width: 700px) {
  .delta {
    grid-template-columns: 2fr 2fr 1.4fr;
    align-items: center;
  }
}
.delta-label {
  font-weight: 650;
}
.delta-trend {
  font-weight: 700;
}
.tone-good .delta-trend {
  color: var(--q-positive);
}
.tone-bad .delta-trend {
  color: var(--q-negative);
}
.tone-neutral .delta-trend {
  color: var(--muted);
}
</style>
