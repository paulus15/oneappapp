<template>
  <q-page class="workspace-page admin-dashboard">
    <header class="workspace-heading dashboard-heading">
      <div>
        <span class="eyebrow">{{ ui('Administration') }}</span>
        <h1>{{ ui('Tableau de bord') }}</h1>
        <p>
          {{
            ui(
              'Compteurs réels issus de la base. Rien n’est estimé : une donnée non mesurée n’apparaît pas.'
            )
          }}
        </p>
      </div>
      <div class="heading-actions">
        <small v-if="generatedAt" class="generated-at">{{
          ui('Mis à jour à {time}', { time: generatedAt })
        }}</small>
        <q-btn
          class="refresh-overview"
          outline
          no-caps
          color="primary"
          icon="refresh"
          :label="ui('Actualiser')"
          :loading="overviewLoading"
          @click="refresh"
        />
      </div>
    </header>
    <AdminNav />

    <EmptyState
      v-if="overviewError && !overview"
      class="overview-error q-mb-md"
      compact
      tone="error"
      icon="cloud_off"
      :title="ui('Le tableau de bord n’a pas pu être chargé.')"
      :text="overviewError"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="refresh"
      />
    </EmptyState>
    <q-banner
      v-else-if="overviewError"
      class="workspace-alert overview-stale q-mb-md"
      role="alert"
      >{{
        ui(
          'Actualisation impossible : les chiffres affichés datent de {time}.',
          {
            time: generatedAt || '—'
          }
        )
      }}</q-banner
    >

    <div
      v-if="overviewLoading && !overview"
      class="overview-skeletons"
      role="status"
    >
      <span class="sr-only">{{ ui('Chargement…') }}</span>
      <div class="todo-grid" aria-hidden="true">
        <q-skeleton v-for="n in 4" :key="n" type="rect" height="96px" />
      </div>
      <div class="status-grid" aria-hidden="true">
        <q-skeleton v-for="n in 3" :key="n" type="rect" height="180px" />
      </div>
    </div>

    <template v-if="overview">
      <section aria-labelledby="todo-title">
        <h2 id="todo-title" class="section-title">{{ ui('À traiter') }}</h2>
        <div v-if="cards.length" class="todo-grid">
          <component
            :is="card.to ? 'router-link' : 'div'"
            v-for="card in cards"
            :key="card.key"
            :to="card.to || undefined"
            class="todo-card workspace-card"
            :class="{ 'is-empty': card.count === 0 }"
            :data-todo="card.key"
          >
            <q-icon :name="card.icon" class="todo-icon" aria-hidden="true" />
            <strong v-if="card.count > 0" class="todo-count">{{
              formatCount(card.count)
            }}</strong>
            <strong v-else class="todo-none">{{ ui('Rien à traiter') }}</strong>
            <span class="todo-label">{{ card.label }}</span>
          </component>
        </div>
        <p v-else class="text-muted">
          {{
            ui('Aucune file de traitement ne correspond à vos autorisations.')
          }}
        </p>
      </section>

      <div class="status-grid">
        <section
          class="workspace-card tools-card"
          aria-labelledby="tools-title"
        >
          <h2 id="tools-title" class="card-title">
            {{ ui('Outils de l’écosystème') }}
          </h2>
          <ul class="tool-list">
            <li
              v-for="tool in tools"
              :key="tool.key"
              :data-tool="tool.key"
              :class="tool.on ? 'tool-on' : 'tool-off'"
            >
              <q-icon
                :name="tool.on ? 'check_circle' : 'radio_button_unchecked'"
                aria-hidden="true"
              />
              <span class="tool-label">{{ tool.label }}</span>
              <span class="tool-state">{{
                tool.on ? ui('Activé') : ui('Désactivé')
              }}</span>
            </li>
          </ul>
        </section>

        <section
          class="workspace-card assistant-card"
          aria-labelledby="assistant-title"
        >
          <h2 id="assistant-title" class="card-title">
            {{ ui('Assistant IA') }}
          </h2>
          <p class="assistant-state" :class="assistantState.tone">
            <q-icon :name="assistantState.icon" aria-hidden="true" />
            {{ assistantState.label }}
          </p>
          <p v-if="assistant.model" class="text-muted">
            {{ ui('Modèle') }} : {{ assistant.model }}
          </p>
          <dl v-if="assistant.requests_today != null" class="figures">
            <div>
              <dt>{{ ui('Questions aujourd’hui') }}</dt>
              <dd class="ai-requests">
                {{ formatCount(assistant.requests_today) }}
              </dd>
            </div>
            <div>
              <dt>{{ ui('Jetons ce mois-ci') }}</dt>
              <dd class="ai-tokens">
                {{ formatCount(assistant.tokens_month) }}
              </dd>
            </div>
            <div>
              <dt>{{ ui('Budget restant') }}</dt>
              <dd class="ai-budget">
                {{
                  assistant.budget_left == null
                    ? ui('Sans plafond')
                    : formatCount(assistant.budget_left)
                }}
              </dd>
            </div>
          </dl>
          <router-link v-if="canManageSettings" to="/admin/ai" class="card-link"
            >{{ ui('Régler l’assistant') }}
            <q-icon name="arrow_forward" aria-hidden="true"
          /></router-link>
        </section>

        <section
          v-if="overview.queue"
          class="workspace-card queue-card"
          :class="{ 'queue-warning': queue.stale || queue.hasFailures }"
          aria-labelledby="queue-title"
        >
          <h2 id="queue-title" class="card-title">
            {{ ui('File d’attente') }}
          </h2>
          <dl class="figures">
            <div>
              <dt>{{ ui('Tâches en attente') }}</dt>
              <dd class="queue-pending">{{ formatCount(queue.pending) }}</dd>
            </div>
            <div>
              <dt>{{ ui('Tâches en échec') }}</dt>
              <dd class="queue-failed">{{ formatCount(queue.failed) }}</dd>
            </div>
            <div>
              <dt>{{ ui('Plus ancienne en attente') }}</dt>
              <dd class="queue-oldest">
                {{
                  queue.oldest == null
                    ? '—'
                    : ui('{n} min', { n: formatCount(queue.oldest) })
                }}
              </dd>
            </div>
          </dl>
          <div v-if="queue.stale" class="queue-alert" role="alert">
            <q-icon name="warning" aria-hidden="true" />
            <div>
              <strong>{{
                ui('Des tâches attendent depuis plus de {n} minutes.', {
                  n: QUEUE_STALE_MINUTES
                })
              }}</strong>
              <p>
                {{
                  ui(
                    'Le worker de file d’attente ne semble pas tourner. Vérifiez le programme Supervisor qui lance :'
                  )
                }}
              </p>
              <code class="worker-command"
                >php artisan queue:work --queue=default,monitor,webhooks</code
              >
            </div>
          </div>
          <p v-else-if="queue.hasFailures" class="queue-hint">
            {{
              ui(
                'Des tâches ont échoué : consultez-les avec php artisan queue:failed.'
              )
            }}
          </p>
          <p v-else class="queue-ok">
            <q-icon name="check_circle" aria-hidden="true" />
            {{ ui('Aucun retard ni échec détecté dans la file d’attente.') }}
          </p>
        </section>
      </div>
    </template>

    <section v-if="stats" aria-labelledby="stats-title">
      <h2 id="stats-title" class="section-title">{{ ui('Vue d’ensemble') }}</h2>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Comptes') }}</h3>
          <p v-for="(total, status) in stats.users" :key="status">
            {{ userLabels[status] || status }} : {{ total }}
          </p>
          <p class="text-muted">
            {{ stats.users_last_30_days }}
            {{ ui('inscription(s) sur 30 jours') }}
          </p></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Profils développeurs') }}</h3>
          <p v-if="!Object.keys(stats.developer_profiles || {}).length">
            {{ ui('Aucun profil.') }}
          </p>
          <p v-for="(total, status) in stats.developer_profiles" :key="status">
            {{ profileLabels[status] || status }} : {{ total }}
          </p></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Applications') }}</h3>
          <p v-for="(total, status) in stats.applications" :key="status">
            {{ statusLabel(status) }} : {{ total }}
          </p>
          <p class="text-muted">
            {{ stats.publicly_visible }}
            {{ ui('visible(s) publiquement (éditeur vérifié)') }}
          </p>
          <p v-if="stats.queues?.versions_to_review" class="text-muted">
            {{ stats.queues.versions_to_review }}
            {{ ui('version(s) analysée(s) en attente de revue') }}
          </p></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Avis') }}</h3>
          <p>{{ stats.reviews }} {{ ui('avis publiés') }}</p></q-card
        >
      </div>
    </section>
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, onMounted, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAdminOverview } from '@/composables/useAdminOverview'
import { adminApi } from '@/services/admin'
import { useAuthStore } from '@/stores/auth'
import { statusLabel } from '@/utils/appStatus'
import {
  QUEUE_STALE_MINUTES,
  formatCount,
  overviewDate,
  queueHealth,
  todoCards,
  toolRows
} from '@/utils/adminOverview'

const auth = useAuthStore()
const {
  overview,
  loading: overviewLoading,
  error: overviewError,
  load: loadOverview
} = useAdminOverview()
const stats = ref(null)

const cards = computed(() => todoCards(overview.value?.todo))
const tools = computed(() => toolRows(overview.value?.tools))
const queue = computed(() => queueHealth(overview.value?.queue))
const assistant = computed(() => overview.value?.assistant || {})
const generatedAt = computed(() => overviewDate(overview.value?.generated_at))
const canManageSettings = computed(
  () => auth.user?.admin_permissions?.includes('settings.manage') === true
)
const assistantState = computed(() => {
  const a = assistant.value
  if (!a.configured)
    return {
      tone: 'state-off',
      icon: 'key_off',
      label: ui(
        'Non configuré : renseignez la clé API et choisissez un modèle DeepSeek.'
      )
    }
  if (!a.enabled)
    return {
      tone: 'state-paused',
      icon: 'pause_circle',
      label: ui('Configuré mais désactivé pour les développeurs.')
    }
  return {
    tone: 'state-on',
    icon: 'check_circle',
    label: ui('Activé pour les développeurs.')
  }
})

const userLabels = {
  get active() {
    return ui('Actifs')
  },
  get suspended() {
    return ui('Suspendus')
  },
  get deactivated() {
    return ui('Désactivés')
  }
}
const profileLabels = {
  get draft() {
    return ui('Brouillons')
  },
  get pending_verification() {
    return ui('En attente de vérification')
  },
  get verified() {
    return ui('Vérifiés')
  },
  get rejected() {
    return ui('À corriger')
  },
  get suspended() {
    return ui('Suspendus')
  }
}

let statsSeq = 0
async function loadStats() {
  const seq = ++statsSeq
  try {
    const { data } = await adminApi.stats()
    if (seq === statsSeq) stats.value = data
  } catch {
    // The overview above stays usable without the detailed counters.
  }
}
function refresh() {
  loadOverview()
  loadStats()
}
// The layout loads the overview for its badges; the dashboard always shows fresh data.
onMounted(refresh)
</script>
<style scoped>
.dashboard-heading {
  display: flex;
  flex-wrap: wrap;
  /* align-items: flex-end; */
  justify-content: space-between;
  gap: 12px;
}
.heading-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.generated-at {
  color: var(--muted);
}
.section-title {
  font-size: 18px;
  font-weight: 750;
  margin: 20px 0 12px;
}
.todo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr));
  gap: 12px;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 12px;
  margin-top: 20px;
}
.overview-skeletons .status-grid,
.overview-skeletons .todo-grid {
  margin-top: 12px;
}
.todo-card {
  display: grid;
  gap: 4px;
  align-content: start;
  color: var(--text);
  text-decoration: none;
  transition: border-color 0.2s ease;
}
a.todo-card:hover,
a.todo-card:focus-visible {
  border-color: var(--pwa-primary);
}
a.todo-card:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.todo-icon {
  color: var(--pwa-primary);
  font-size: 22px;
}
.todo-count {
  font-size: 30px;
  line-height: 1.1;
}
.todo-none {
  font-size: 16px;
  color: var(--q-positive);
}
.is-empty .todo-icon {
  color: var(--muted);
}
.todo-label {
  color: var(--muted);
  font-size: 13px;
}
.card-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 750;
}
.tool-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tool-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.tool-label {
  flex: 1;
}
.tool-state {
  font-size: 12px;
  font-weight: 700;
}
.tool-on .q-icon,
.tool-on .tool-state {
  color: var(--q-positive);
}
.tool-off {
  color: var(--muted);
}
.assistant-state {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-weight: 650;
}
.state-on .q-icon {
  color: var(--q-positive);
}
.state-paused .q-icon {
  color: var(--q-warning);
}
.state-off .q-icon {
  color: var(--muted);
}
.figures {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin: 0;
}
.figures dt {
  color: var(--muted);
  font-size: 12px;
}
.figures dd {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 750;
}
.card-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  color: var(--pwa-link);
  font-weight: 700;
  text-decoration: none;
}
.queue-warning {
  border-color: var(--q-warning);
}
.queue-alert {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--q-warning) 14%, var(--surface));
  border-radius: 10px;
}
.queue-alert > .q-icon {
  margin-top: 2px;
  color: var(--q-warning);
}
.queue-alert p {
  margin: 4px 0;
  font-size: 13px;
}
.worker-command {
  display: block;
  padding: 6px 8px;
  font-size: 12px;
  overflow-wrap: anywhere;
  background: color-mix(in srgb, var(--text) 7%, var(--surface));
  border-radius: 6px;
}
.queue-hint,
.queue-ok {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.queue-ok .q-icon {
  color: var(--q-positive);
}
h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
