<template>
  <q-btn
    flat
    no-caps
    dense
    icon="language"
    :label="active.short"
    :aria-label="t('language.change')"
    :title="t('language.change')"
  >
    <q-menu auto-close>
      <q-list style="min-width: 150px">
        <q-item
          v-for="l in LOCALES"
          :key="l.value"
          clickable
          :active="l.value === locale"
          role="menuitemradio"
          :aria-checked="l.value === locale"
          :lang="l.value"
          @click="setLocale(l.value)"
        >
          <q-item-section>{{ l.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALES, setLocale } from '@/i18n'

const { t, locale } = useI18n()
const active = computed(
  () => LOCALES.find(l => l.value === locale.value) || LOCALES[0]
)
</script>
