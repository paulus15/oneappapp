<template>
  <q-page class="workspace-page beta-catalog">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Tests bêta') }}</span
      ><h1>{{ ui('Devenir testeur') }}</h1
      ><p>{{
        ui(
          'Essayez des applications avant leur sortie et aidez leurs développeurs à les améliorer. Vos retours restent privés.'
        )
      }}</p
      ><div v-if="auth.isAuthenticated" class="workspace-actions">
        <q-btn
          flat
          no-caps
          color="primary"
          icon="fact_check"
          :label="ui('Mes tests')"
          to="/account/beta" /></div
    ></header>

    <div
      v-if="list.loading.value"
      class="campaign-grid"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton
        v-for="n in 6"
        :key="n"
        height="210px"
        class="card-skeleton"
      />
    </div>
    <EmptyState
      v-else-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Les campagnes n’ont pas pu être chargées.')"
      :text="errorText"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        class="retry"
        :label="ui('Réessayer')"
        @click="list.reload()"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length"
      icon="biotech"
      :title="ui('Aucune campagne de test ouverte pour le moment.')"
      :text="
        ui(
          'Revenez bientôt : les développeurs publient régulièrement de nouvelles versions à tester.'
        )
      "
    >
      <q-btn
        flat
        no-caps
        color="primary"
        to="/"
        :label="ui('Découvrir le Store')"
      />
    </EmptyState>
    <template v-else>
      <ul class="campaign-grid" role="list">
        <li v-for="campaign in items" :key="campaign.id" class="campaign-item">
          <router-link
            :to="`/beta/${campaign.id}`"
            class="workspace-card campaign-card"
          >
            <div class="card-head">
              <AppIcon
                :src="campaign.application?.icon_url"
                alt=""
                class="app-icon"
              />
              <div class="card-titles">
                <small class="app-name">{{ campaign.application?.name }}</small>
                <strong class="campaign-name">{{ campaign.name }}</strong>
              </div>
            </div>
            <p v-if="campaign.description" class="card-text">{{
              excerpt(campaign.description)
            }}</p>
            <ul class="facts" role="list">
              <li>
                <q-icon name="event" aria-hidden="true" />
                {{ dateRange(campaign.starts_at, campaign.ends_at) }}
              </li>
              <li class="spots" :class="{ full: isFull(campaign) }">
                <q-icon name="group" aria-hidden="true" />
                {{ spotsLabel(campaign.spots_left) }}
              </li>
              <li>
                <q-icon name="public" aria-hidden="true" />
                {{ countriesLabel(campaign.countries, countries) }}
              </li>
            </ul>
            <span
              v-if="
                !campaign.my_participation && startsLater(campaign.starts_at)
              "
              class="mine upcoming"
              >{{ opensOnLabel(campaign) }}</span
            >
            <span v-if="campaign.my_participation" class="mine">{{
              participantStatusLabel(campaign.my_participation.status)
            }}</span>
          </router-link>
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        :page-size="PUBLIC_PAGE_SIZE"
        @load="list.loadMore()"
      />
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaPublicApi } from '@/services/beta'
import { useAuthStore } from '@/stores/auth'
import { activeCountries } from '@/utils/countries'
import {
  PUBLIC_PAGE_SIZE,
  countriesLabel,
  dateRange,
  participantStatusLabel,
  opensOnLabel,
  spotsLabel,
  startsLater
} from '@/utils/beta'

const auth = useAuthStore()
const countries = ref([])
const list = useLoadMore(
  async page => (await betaPublicApi.campaigns(page)).data
)
const items = list.items
const errorText = computed(() =>
  list.last.value instanceof Error || list.last.value?.response
    ? apiMessage(list.last.value)
    : ''
)
const isFull = campaign => Number(campaign.spots_left) <= 0
const excerpt = text =>
  String(text).length > 160 ? `${String(text).slice(0, 157)}…` : String(text)

onMounted(async () => {
  void list.reload()
  try {
    countries.value = await activeCountries()
  } catch {
    // Codes are shown instead of names.
  }
})
</script>
<style scoped>
.campaign-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.card-skeleton {
  border-radius: 16px;
}
.campaign-item {
  display: flex;
}
.campaign-card {
  position: relative;
  display: grid;
  align-content: start;
  gap: 10px;
  width: 100%;
  color: var(--text);
  text-decoration: none;
  border: 1px solid var(--outline);
  transition: border-color 0.2s ease;
}
.campaign-card:hover {
  border-color: var(--pwa-primary);
}
.campaign-card:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 3px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.app-icon {
  flex: none;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 14px;
}
.card-titles {
  display: grid;
  min-width: 0;
}
.app-name {
  color: var(--muted);
}
.campaign-name {
  font-size: 16px;
}
.card-text {
  margin: 0;
  font-size: 14px;
}
.facts {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  color: var(--muted);
  font-size: 13px;
  list-style: none;
}
.facts li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.spots {
  color: var(--q-positive);
  font-weight: 650;
}
.spots.full {
  color: var(--q-negative);
}
.mine {
  justify-self: start;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 650;
  background: color-mix(in srgb, var(--q-primary) 14%, var(--surface));
  border-radius: 999px;
}
</style>
