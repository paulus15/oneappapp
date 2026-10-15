<template>
  <dl class="growth-stats" :class="{ large }">
    <div>
      <dt>{{ ui('Visites') }}</dt>
      <dd>{{ growthCount(stats?.visits) }}</dd>
    </div>
    <div>
      <dt>{{ ui('Consultations') }}</dt>
      <dd>{{ growthCount(stats?.views) }}</dd>
    </div>
    <div>
      <dt>{{ ui('Ouvertures (Ouvrir ou installation)') }}</dt>
      <dd>{{ growthCount(stats?.opens) }}</dd>
    </div>
    <div>
      <dt class="conversion-term">
        {{ ui('Conversion') }}
        <button
          v-if="!large"
          type="button"
          class="hint-toggle"
          :aria-expanded="hintOpen"
          :aria-controls="hintId"
          :aria-label="ui('Comment lire la conversion')"
          @click="hintOpen = !hintOpen"
        >
          <q-icon name="info" aria-hidden="true" />
        </button>
      </dt>
      <dd>{{ conversionLabel(stats?.conversion) }}</dd>
      <small v-if="large || hintOpen" :id="hintId" class="hint">{{
        conversionHint(stats?.conversion)
      }}</small>
    </div>
  </dl>
</template>
<script setup>
import { ref, useId } from 'vue'
import { ui } from '@/i18n/text'
import { conversionHint, conversionLabel, growthCount } from '@/utils/growth'

defineProps({
  // { visits, views, opens, conversion }
  stats: { type: Object, default: null },
  // Bigger figures and the conversion explanation, for the detail page.
  large: Boolean
})
// On list rows the explanation opens on demand (keyboard, touch or mouse).
const hintOpen = ref(false)
const hintId = `conversion-hint-${useId()}`
</script>
<style scoped>
.growth-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 112px), 1fr));
  gap: 10px 14px;
  margin: 0;
}
.growth-stats > div {
  min-width: 0;
}
.growth-stats dt {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.growth-stats dd {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.large dd {
  font-size: 24px;
  font-weight: 750;
}
.conversion-term {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hint-toggle {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--pwa-link);
  font-size: 16px;
  background: none;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.hint-toggle:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 1px;
}
.hint {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}
</style>
