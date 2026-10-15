<template>
  <q-page class="workspace-page beta-campaign">
    <router-link to="/beta" class="back-link">
      <q-icon name="arrow_back" aria-hidden="true" />
      {{ ui('Toutes les campagnes') }}
    </router-link>

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton height="120px" class="q-mb-md" />
      <q-skeleton height="220px" />
    </div>
    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      :title="ui('Campagne introuvable.')"
      :text="
        ui(
          'Cette campagne de test n’existe pas, n’est plus publiée ou est terminée.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        to="/beta"
        :label="ui('Voir les campagnes')"
      />
    </EmptyState>
    <EmptyState
      v-else-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger cette campagne.')"
      :text="error"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="load()"
      />
    </EmptyState>

    <template v-else-if="campaign">
      <header class="workspace-card campaign-head">
        <AppIcon
          :src="campaign.application?.icon_url"
          alt=""
          class="app-icon"
        />
        <div class="head-text">
          <router-link
            v-if="appIsPublic(campaign.application)"
            :to="`/apps/${campaign.application.id}`"
            class="eyebrow app-link"
            >{{ campaign.application.name }}</router-link
          >
          <span v-else class="eyebrow">{{ campaign.application?.name }}</span>
          <h1>{{ campaign.name }}</h1>
          <ul class="facts" role="list">
            <li>
              <q-icon name="event" aria-hidden="true" />
              {{ dateRange(campaign.starts_at, campaign.ends_at) }}
            </li>
            <li class="spots">
              <q-icon name="group" aria-hidden="true" />
              {{ spotsLabel(campaign.spots_left) }}
            </li>
            <li>
              <q-icon name="public" aria-hidden="true" />
              {{ countriesLabel(campaign.countries, countries) }}
            </li>
          </ul>
        </div>
      </header>

      <div class="campaign-layout">
        <div class="campaign-main">
          <section class="workspace-card section">
            <h2>{{ ui('À propos de ce test') }}</h2>
            <p class="plain">{{ campaign.description }}</p>
          </section>
          <section v-if="campaign.objectives" class="workspace-card section">
            <h2>{{ ui('Ce que le développeur attend de vous') }}</h2>
            <p class="plain">{{ campaign.objectives }}</p>
          </section>
          <section v-if="campaign.eligibility" class="workspace-card section">
            <h2>{{ ui('Qui peut participer') }}</h2>
            <p class="plain">{{ campaign.eligibility }}</p>
          </section>
        </div>

        <aside class="workspace-card cta" :aria-label="ui('Participation')">
          <template v-if="state === 'applied'">
            <q-icon name="hourglass_top" class="cta-icon" aria-hidden="true" />
            <strong>{{ ui('Candidature envoyée') }}</strong>
            <p>{{
              ui(
                'Le développeur examine les candidatures. Vous serez prévenu de sa réponse.'
              )
            }}</p>
            <q-btn
              flat
              no-caps
              color="primary"
              to="/account/beta"
              :label="ui('Mes tests')"
            />
          </template>
          <template v-else-if="state === 'accepted'">
            <q-icon name="verified" class="cta-icon ok" aria-hidden="true" />
            <strong>{{ ui('Vous êtes testeur') }}</strong>
            <p>{{
              ui(
                'L’accès à la version bêta et le formulaire de retour sont dans « Mes tests ».'
              )
            }}</p>
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="go-tests"
              to="/account/beta"
              :label="ui('Aller à Mes tests')"
            />
          </template>
          <template v-else-if="state === 'rejected'">
            <q-icon name="block" class="cta-icon ko" aria-hidden="true" />
            <strong>{{ ui('Candidature non retenue') }}</strong>
            <p>{{
              ui(
                'Le développeur n’a pas retenu votre candidature pour ce test.'
              )
            }}</p>
          </template>
          <template v-else-if="state === 'removed'">
            <q-icon name="block" class="cta-icon ko" aria-hidden="true" />
            <strong>{{ ui('Vous ne participez plus à ce test') }}</strong>
            <p>{{ ui('Le développeur a mis fin à votre participation.') }}</p>
          </template>
          <template v-else-if="state === 'closed'">
            <q-icon name="event_busy" class="cta-icon" aria-hidden="true" />
            <strong>{{ ui('Candidatures fermées') }}</strong>
            <p>{{
              ui('Cette campagne n’accepte plus de nouveaux testeurs.')
            }}</p>
          </template>
          <template v-else-if="state === 'full'">
            <q-icon name="group_off" class="cta-icon" aria-hidden="true" />
            <strong>{{ ui('Campagne complète') }}</strong>
            <p>{{ ui('Toutes les places ont été attribuées.') }}</p>
          </template>
          <template v-else>
            <strong>{{ ui('Envie de participer ?') }}</strong>
            <p v-if="upcoming" class="upcoming">
              <q-icon name="schedule" aria-hidden="true" />
              {{ opensOnLabel(campaign) }} ·
              {{ ui('Vous pouvez déjà candidater.') }}
            </p>
            <p v-if="state === 'reapply'">{{
              ui(
                'Vous vous étiez retiré de ce test : vous pouvez candidater de nouveau.'
              )
            }}</p>
            <p v-else>{{
              ui(
                'Répondez à quelques questions : le développeur choisit ses testeurs parmi les candidatures.'
              )
            }}</p>
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="how_to_reg"
              class="participate"
              :label="
                state === 'reapply'
                  ? ui('Candidater de nouveau')
                  : ui('Participer')
              "
              @click="participate"
            />
            <small v-if="!auth.isAuthenticated" class="text-muted">{{
              ui('Connexion requise : vous reviendrez ici ensuite.')
            }}</small>
          </template>
        </aside>
      </div>

      <BetaApplyDialog
        v-model="applyOpen"
        :campaign="campaign"
        @applied="onApplied"
        @refresh="load({ quiet: true })"
      />
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import BetaApplyDialog from '@/components/beta/BetaApplyDialog.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaPublicApi } from '@/services/beta'
import { useAuthStore } from '@/stores/auth'
import { activeCountries } from '@/utils/countries'
import {
  appIsPublic,
  countriesLabel,
  dateRange,
  opensOnLabel,
  participationState,
  spotsLabel,
  startsLater
} from '@/utils/beta'

const route = useRoute(),
  router = useRouter(),
  auth = useAuthStore()
const campaign = ref(null),
  loading = ref(true),
  notFound = ref(false),
  error = ref(''),
  applyOpen = ref(false),
  countries = ref([])
const state = computed(() => participationState(campaign.value))
const upcoming = computed(() => startsLater(campaign.value?.starts_at))

// A late answer for the previous campaign never fills this page.
let seq = 0
async function load({ quiet = false } = {}) {
  const current = ++seq
  if (!quiet) {
    loading.value = true
    campaign.value = null
  }
  notFound.value = false
  error.value = ''
  try {
    const { data } = await betaPublicApi.show(route.params.id)
    if (current !== seq) return
    campaign.value = data?.data || null
    if (!campaign.value) notFound.value = true
  } catch (e) {
    if (current !== seq) return
    if (e.response?.status === 404) notFound.value = true
    else if (!quiet) error.value = apiMessage(e)
  } finally {
    if (current === seq) loading.value = false
  }
}

function participate() {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  applyOpen.value = true
}

function onApplied(participation) {
  if (campaign.value && participation)
    campaign.value = {
      ...campaign.value,
      my_participation: { id: participation.id, status: participation.status }
    }
  void load({ quiet: true })
}

watch(
  () => route.params.id,
  id => {
    if (id) void load()
  }
)
onMounted(async () => {
  void load()
  try {
    countries.value = await activeCountries()
  } catch {
    // Codes are shown instead of names.
  }
})

defineExpose({ campaign, applyOpen, participate, state })
</script>
<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  color: var(--pwa-link);
  font-weight: 650;
  text-decoration: none;
}
.back-link:focus-visible,
.app-link:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.campaign-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--outline);
}
.app-icon {
  flex: none;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border-radius: 18px;
}
.head-text {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.app-link {
  text-decoration: none;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0;
  padding: 0;
  color: var(--muted);
  font-size: 14px;
  list-style: none;
}
.facts li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.spots {
  font-weight: 650;
}
.campaign-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
@media (min-width: 900px) {
  .campaign-layout {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
  .cta {
    position: sticky;
    top: 88px;
  }
}
.campaign-main {
  display: grid;
  gap: 14px;
}
.section {
  border: 1px solid var(--outline);
}
.plain {
  margin: 0;
  white-space: pre-line;
}
.cta {
  display: grid;
  gap: 10px;
  border: 1px solid var(--pwa-primary);
}
.cta p {
  margin: 0;
}
.cta-icon {
  font-size: 32px;
  color: var(--pwa-primary);
}
.cta-icon.ok {
  color: var(--q-positive);
}
.cta-icon.ko {
  color: var(--q-negative);
}
</style>
