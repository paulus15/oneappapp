<template>
  <ServiceState
    code="503"
    icon="handyman"
    :title="ui('Nous préparons la suite.')"
    :text="
      maintenance.message ||
      ui(
        'PWA Store est en maintenance. Merci de revenir dans quelques instants.'
      )
    "
  >
    <p v-if="untilLabel" class="maintenance-note"
      >{{ ui('Retour estimé :') }} {{ untilLabel }}</p
    >
    <p v-if="error" class="maintenance-note" role="alert">{{ error }}</p>
    <q-btn
      unelevated
      rounded
      no-caps
      color="primary"
      icon="refresh"
      :loading="busy"
      :label="ui('Vérifier la disponibilité')"
      @click="check"
    />
    <q-btn
      flat
      rounded
      no-caps
      to="/login"
      :label="ui('Accès administrateur')"
    />
  </ServiceState>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { maintenance, setMaintenance } from '@/stores/maintenance'
import { ui } from '@/i18n/text'
import { currentLocale } from '@/i18n'
import ServiceState from '@/components/ServiceState.vue'
const busy = ref(false),
  error = ref('')
const untilLabel = computed(() => {
  const date = new Date(maintenance.until)
  return maintenance.until && Number.isFinite(date.getTime())
    ? date.toLocaleString(currentLocale())
    : ''
})
async function check() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const { data } = await api.get('/platform', { skipCountryDetection: true })
    setMaintenance(data.maintenance)
  } catch {
    error.value = ui(
      'Impossible de joindre le serveur. Réessayez dans quelques instants.'
    )
  } finally {
    busy.value = false
  }
}
let timer
onMounted(() => {
  timer = setInterval(() => {
    if (!document.hidden) check()
  }, 60000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
<style scoped>
.maintenance-note {
  flex-basis: 100%;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
</style>
