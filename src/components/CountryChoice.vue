<template>
  <!-- Visitors choose the country they browse from; on a first visit it is preselected from the connection. -->
  <span class="country-choice">
    <button
      v-if="!authStore.isAuthenticated"
      class="icon-action country-action"
      type="button"
      :aria-label="
        code ? t('geo.visitor.current', { code }) : t('geo.visitor.change')
      "
      :title="t('geo.visitor.change')"
      @click="open = true"
    >
      <q-icon name="public" />
      <span>{{ code || t('geo.visitor.short') }}</span>
    </button>
    <q-dialog v-model="open" aria-labelledby="country-choice-title">
      <q-card class="country-card">
        <q-card-section>
          <h2 id="country-choice-title" class="country-title">{{
            t('geo.visitor.title')
          }}</h2>
          <p class="text-muted">{{ t('geo.visitor.help') }}</p>
          <CountrySelect
            v-model="selected"
            value-field="code"
            :label="t('geo.visitor.label')"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-if="code"
            flat
            no-caps
            :label="t('geo.visitor.clear')"
            @click="apply(null)"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('geo.visitor.confirm')"
            :disable="!selected"
            @click="apply(selected)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </span>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CountrySelect from '@/components/CountrySelect.vue'
import { useAuthStore } from '@/stores/auth'
import {
  setVisitorCountry,
  visitorCountry,
  visitorCountryReady
} from '@/utils/visitorCountry'

const { t } = useI18n()
const authStore = useAuthStore()
const code = ref(visitorCountry())
const selected = ref(code.value)
const open = ref(false)

// Show the detected country once the first-visit detection answers.
onMounted(async () => {
  const detected = await visitorCountryReady()
  if (detected && !code.value) {
    code.value = detected
    selected.value ||= detected
  }
})

function apply(value) {
  setVisitorCountry(value)
  // Every list depends on the country: reload so nothing from the previous choice remains.
  window.location.reload()
}
</script>
<style scoped>
.country-card {
  width: min(440px, 100vw);
}
.country-title {
  font-size: 20px;
  margin: 0 0 4px;
}
</style>
