<template>
  <!-- Visitors choose the country they browse from; on a first visit it is preselected from the connection. -->
  <span class="country-choice">
    <!-- Pill (home page): flag and country name. Visitors choose here; accounts change it in their space. -->
    <template v-if="pill">
      <router-link
        v-if="authStore.isAuthenticated"
        to="/account"
        class="country-pill"
        :title="ui('Pays de votre compte')"
      >
        <span class="pill-flag" aria-hidden="true">{{ pillFlag }}</span>
        <span>{{ pillName || ui('Choisir mon pays') }}</span>
      </router-link>
      <button
        v-else
        type="button"
        class="country-pill"
        :aria-label="t('geo.visitor.change')"
        @click="open = true"
      >
        <span v-if="pillFlag" class="pill-flag" aria-hidden="true">{{
          pillFlag
        }}</span>
        <q-icon v-else name="public" aria-hidden="true" />
        <span>{{ pillName || t('geo.visitor.change') }}</span>
        <q-icon name="expand_more" aria-hidden="true" />
      </button>
    </template>
    <button
      v-else-if="!authStore.isAuthenticated"
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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CountrySelect from '@/components/CountrySelect.vue'
import { useAuthStore } from '@/stores/auth'
import { ui } from '@/i18n/text'
import { activeCountries, countryName, flagEmoji } from '@/utils/countries'
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
const props = defineProps({ pill: Boolean })
const countries = ref([])
// The account's country for members, the chosen (or detected) one for visitors.
const pillCountry = computed(() =>
  countries.value.find(c =>
    authStore.isAuthenticated
      ? c.id === authStore.user?.country_id
      : c.code === code.value
  )
)
const pillFlag = computed(() =>
  flagEmoji(
    pillCountry.value?.code ||
      (authStore.isAuthenticated ? '' : code.value || '')
  )
)
const pillName = computed(() => countryName(pillCountry.value))

// Show the detected country once the first-visit detection answers.
onMounted(async () => {
  if (props.pill) activeCountries().then(list => (countries.value = list))
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
.country-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  max-width: 100%;
  padding: 0 14px;
  color: #0b1b3f;
  font: inherit;
  font-size: 13.5px;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(2, 10, 35, 0.18);
}
.country-pill span:not(.pill-flag) {
  overflow: hidden;
  text-overflow: ellipsis;
}
.pill-flag {
  font-size: 18px;
  line-height: 1;
}
.country-pill:focus-visible {
  outline: 3px solid #08c8f8;
  outline-offset: 2px;
}
</style>
