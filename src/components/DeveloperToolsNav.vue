<template>
  <nav class="developer-tools" :aria-label="ui('Outils du Labo PWA')">
    <router-link
      v-for="tool in availableTools"
      :key="tool.to"
      :to="tool.to"
      class="tool-card"
      :aria-current="route.path === tool.to ? 'page' : undefined"
    >
      <q-icon :name="tool.icon" size="24px" aria-hidden="true" />
      <span>
        <strong>{{ tool.title }}</strong>
        <small>{{ tool.description }}</small>
      </span>
      <q-icon name="arrow_forward" aria-hidden="true" />
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePlatform } from '@/composables/usePlatform'
import { ui } from '@/i18n/text'

const route = useRoute()
const { tools } = usePlatform()
// Add each tool here only once its real route and API are ready.
const availableTools = computed(() => [
  {
    title: ui('Diagnostic PWA'),
    description: ui('Analyser votre application et retrouver vos diagnostics.'),
    icon: 'science',
    to: '/developer/lab'
  },
  ...(tools.value.monitor
    ? [
        {
          title: ui('PWA Monitor'),
          description: ui(
            'Surveiller la disponibilité et suivre les incidents.'
          ),
          icon: 'monitor_heart',
          to: '/developer/monitor'
        }
      ]
    : []),
  ...(tools.value.growth
    ? [
        {
          title: ui('Promouvoir mon application'),
          description: ui(
            'Créer des liens de partage, des badges et un visuel.'
          ),
          icon: 'campaign',
          to: '/developer/growth'
        }
      ]
    : []),
  ...(tools.value.feedback_hub
    ? [
        {
          title: ui('Retours utilisateurs'),
          description: ui(
            'Trier et suivre les retours privés de vos utilisateurs.'
          ),
          icon: 'forum',
          to: '/developer/feedback'
        }
      ]
    : [])
])
</script>

<style scoped>
.developer-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: var(--text);
  text-decoration: none;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: var(--ui-radius-lg, 18px);
}
.tool-card > span {
  flex: 1;
  min-width: 0;
}
.tool-card strong,
.tool-card small {
  display: block;
}
.tool-card small {
  color: var(--muted);
  margin-top: 4px;
}
.tool-card > .q-icon {
  color: var(--pwa-primary);
}
.tool-card[aria-current='page'],
.tool-card:hover {
  border-color: var(--pwa-primary);
}
.tool-card:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 3px;
}
</style>
