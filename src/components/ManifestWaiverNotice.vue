<template>
  <!-- Waived by an administrator: the URL check accepts a missing manifest. -->
  <li
    v-if="
      application.source_type === 'url' &&
      application.manifest_required === false
    "
    class="gap"
    data-test="manifest-waived"
  >
    <q-icon name="info" color="grey-7" />
    <span>{{
      ui(
        'Manifeste PWA facultatif pour cette application (décision de l’administration).'
      )
    }}</span>
  </li>
</template>
<script setup>
import { ui } from '@/i18n/text'
defineProps({ application: { type: Object, required: true } })
</script>
