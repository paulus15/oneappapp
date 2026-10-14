<template>
  <ServiceState
    :code="String(status)"
    :icon="content.icon"
    :title="ui(content.title)"
    :text="ui(content.text)"
  >
    <q-btn
      v-if="status !== 403"
      unelevated
      rounded
      no-caps
      color="primary"
      icon="refresh"
      :label="ui('Réessayer')"
      @click="retry"
    />
    <q-btn
      flat
      rounded
      no-caps
      to="/"
      icon="home"
      :label="ui('Retour à l’accueil')"
    />
  </ServiceState>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServiceState from '@/components/ServiceState.vue'
import { ui } from '@/i18n/text'
const route = useRoute(),
  router = useRouter()
const props = defineProps({ status: { type: Number, default: 500 } })
const content = computed(
  () =>
    ({
      403: {
        icon: 'lock',
        title: 'Accès non autorisé',
        text: 'Votre compte ne dispose pas des permissions nécessaires pour ouvrir cette page.'
      },
      503: {
        icon: 'cloud_off',
        title: 'Service temporairement indisponible',
        text: 'Le serveur ne répond pas pour le moment. Réessayez dans quelques instants.'
      },
      500: {
        icon: 'error_outline',
        title: 'Une erreur est survenue',
        text: 'Cette page n’a pas pu être affichée. Vous pouvez réessayer ou revenir à l’accueil.'
      }
    })[props.status] || {
      icon: 'wifi_off',
      title: 'Connexion interrompue',
      text: 'Vérifiez votre connexion Internet puis réessayez.'
    }
)
function retry() {
  const target = route.path.startsWith('/errors/')
    ? route.query.redirect
    : route.fullPath
  const path =
    typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//') &&
    !target.startsWith('/errors/')
      ? target
      : '/'
  if (path === route.fullPath) window.location.reload()
  else window.location.assign(router.resolve(path).href)
}
</script>
