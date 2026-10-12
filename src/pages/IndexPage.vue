<template>
  <q-page class="flex flex-center">
    <div class="column items-center">
      <img
        :alt="ui('Quasar logo')"
        src="~@/assets/quasar-logo-vertical.svg"
        style="width: 200px; height: 200px"
      />

      <q-btn
        class="q-mt-md"
        color="primary"
        to="/second"
        :label="ui('Go to Second Page')"
        no-caps
      />
    </div>
  </q-page>
</template>

<script setup>
import { ui } from '@/i18n/text'

//
</script>
