<template>
  <!-- Visitors choose the country they browse from; it is never guessed. -->
  <span class="country-choice">
    <button
      v-if="!authStore.isAuthenticated"
      class="icon-action country-action"
      type="button"
      :aria-label="t('geo.visitor.change')"
      :title="t('geo.visitor.change')"
      @click="open = true"
    >
      <q-icon name="public" />
      <span>{{ code || t('geo.visitor.short') }}</span>
    </button>
    <q-dialog v-model="open">
      <q-card class="country-card">
        <q-card-section>
          <h2 class="country-title">{{ t('geo.visitor.title') }}</h2>
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CountrySelect from '@/components/CountrySelect.vue'
import { useAuthStore } from '@/stores/auth'
import { setVisitorCountry, visitorCountry } from '@/utils/visitorCountry'

const { t } = useI18n()
const authStore = useAuthStore()
const code = ref(visitorCountry())
const selected = ref(code.value)
const open = ref(false)

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
