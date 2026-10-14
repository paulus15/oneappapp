<template>
  <q-page class="workspace-page rankings-page">
    <header class="workspace-heading">
      <span class="eyebrow">{{ t('store.rankings.eyebrow') }}</span>
      <h1>{{ t('store.rankings.title') }}</h1>
      <p>{{ t('store.rankings.lead') }}</p>
    </header>

    <q-tabs
      :model-value="type"
      no-caps
      inline-label
      outside-arrows
      mobile-arrows
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="rank-tabs"
      @update:model-value="setType"
    >
      <q-tab
        v-for="tab in TABS"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        :label="t(`store.rankings.tabs.${tab.name}`)"
      />
    </q-tabs>
    <p class="rank-hint">{{ t(`store.rankings.hint.${type}`) }}</p>

    <ol v-if="loading" class="rank-list" aria-busy="true">
      <li v-for="n in 8" :key="n" class="rank-row rank-skeleton">
        <q-skeleton type="text" width="22px" />
        <q-skeleton width="52px" height="52px" class="skeleton-icon" />
        <div>
          <q-skeleton type="text" width="45%" />
          <q-skeleton type="text" width="30%" />
        </div>
      </li>
    </ol>

    <EmptyState
      v-else-if="error && !unavailable"
      tone="error"
      icon="cloud_off"
      :title="t('store.rankings.errorTitle')"
      :text="t('store.rankings.errorText')"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="t('common.retry')"
        @click="reload"
      />
    </EmptyState>

    <EmptyState
      v-else-if="!items.length"
      :icon="unavailable ? 'hourglass_empty' : 'leaderboard'"
      :title="
        unavailable
          ? t('store.rankings.soonTitle')
          : t('store.rankings.emptyTitle')
      "
      :text="
        unavailable
          ? t('store.rankings.soonText')
          : t(`store.rankings.empty.${type}`)
      "
    >
      <q-btn
        outline
        no-caps
        color="primary"
        :label="t('store.rankings.browse')"
        to="/applications"
      />
    </EmptyState>

    <ol
      v-else
      ref="listEl"
      :start="items[0]?.position || 1"
      class="rank-list"
      :class="{ 'motion-cascade': cascade, 'is-in': landed }"
    >
      <li v-for="(item, i) in items" :key="item.id" :style="{ '--i': i }">
        <router-link :to="item.to" class="rank-row">
          <span
            class="rank-number"
            :class="{ podium: item.position <= 3 }"
            aria-hidden="true"
            >{{ item.position }}</span
          >
          <span class="rank-icon" :style="{ background: item.color }">
            <AppIcon
              :src="item.iconUrl"
              :fallback-icon="item.icon"
              :alt="t('store.card.iconAlt', { name: item.name })"
            />
          </span>
          <span class="rank-copy">
            <strong>{{ item.name }}</strong>
            <small>{{
              [ui(item.category), item.publisher].filter(Boolean).join(' · ')
            }}</small>
          </span>
          <span class="rank-meta">
            <span v-if="item.rating" class="rank-rating"
              ><q-icon name="star" />{{ item.rating }}
              <small>{{
                t('store.rankings.reviews', { n: item.reviews }, item.reviews)
              }}</small></span
            >
            <HostingBadge
              :source-type="item.sourceType"
              compact
              :focusable="false"
            />
          </span>
        </router-link>
      </li>
    </ol>

    <LoadMore
      auto
      v-if="!loading && items.length"
      :has-more="hasMore"
      :loading="loadingMore"
      :error="moreError"
      :shown="items.length"
      :total="total"
      :page-size="24"
      @load="loadMore"
    />

    <AppFooter />
  </q-page>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppFooter from '@/components/AppFooter.vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import HostingBadge from '@/components/HostingBadge.vue'
import { useCascade } from '@/composables/useCascade'
import { catalogApi } from '@/services/catalog'
import { toCard } from '@/utils/appCard'
import { ui } from '@/i18n/text'

// Four rankings computed by the API on real data (installations, recent installations,
// publication date, ratings with enough reviews). The tab and page live in the URL.
const TABS = [
  { name: 'popular', icon: 'emoji_events' },
  { name: 'trending', icon: 'trending_up' },
  { name: 'new', icon: 'new_releases' },
  { name: 'top_rated', icon: 'star' }
]
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const type = computed(() =>
  TABS.some(tab => tab.name === route.query.type)
    ? String(route.query.type)
    : 'popular'
)
// Server-side pages of the ranking, shown as one list that grows with "Voir plus".
const {
  items: rows,
  total,
  hasMore,
  loading,
  loadingMore,
  error,
  moreError,
  last,
  reload,
  loadMore
} = useLoadMore(
  async page => (await catalogApi.rankings({ type: type.value, page })).data
)
// The endpoint is new: an API without it answers 404, which is not an outage.
const unavailable = computed(
  () => error.value && last.value?.response?.status === 404
)
const items = computed(() =>
  rows.value.map((app, i) => {
    const card = toCard(app)
    return { ...card, position: card.rank ?? i + 1 }
  })
)

const listEl = ref(null)
const { enabled: cascade, landed } = useCascade(listEl)

function setType(value) {
  router.replace({ query: { ...route.query, type: value, page: undefined } })
}

watch(type, reload, { immediate: true })
</script>
<style scoped>
.rank-tabs {
  border-bottom: 1px solid var(--outline);
}
.rank-hint {
  margin: 10px 0 14px;
  color: var(--muted);
  font-size: 13px;
}
.rank-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.rank-row {
  display: grid;
  grid-template-columns: 34px 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: var(--text);
  text-decoration: none;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: var(--ui-radius-md);
  transition:
    transform var(--motion-base) var(--motion-settle),
    border-color var(--motion-fast) var(--motion-settle),
    box-shadow var(--motion-base) var(--motion-settle);
}
a.rank-row:hover,
a.rank-row:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--primary) 35%, var(--outline));
  box-shadow: var(--ui-shadow-sm);
}
.rank-number {
  color: var(--muted);
  font-family: var(--pwa-font-display);
  font-size: 20px;
  font-weight: 800;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.rank-number.podium {
  color: var(--pwa-accent);
}
.rank-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--pwa-on-primary);
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(2, 5, 20, 0.16);
  transition: transform var(--motion-base) var(--motion-drop);
}
a.rank-row:hover .rank-icon {
  transform: translateY(-2px) scale(1.04);
}
.rank-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.rank-copy strong {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-copy small {
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rank-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.rank-rating .q-icon {
  color: var(--pwa-accent);
}
.rank-rating small {
  color: var(--muted);
  font-weight: 500;
}
.rank-skeleton {
  grid-template-columns: 34px 52px minmax(0, 1fr);
}
.skeleton-icon {
  border-radius: 14px;
}
@media (max-width: 599px) {
  .rank-row {
    grid-template-columns: 26px 44px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
  }
  .rank-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
  .rank-number {
    font-size: 17px;
  }
  .rank-meta {
    grid-column: 3;
    gap: 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rank-row,
  .rank-icon {
    transition: none;
  }
  a.rank-row:hover,
  a.rank-row:focus-visible,
  a.rank-row:hover .rank-icon {
    transform: none;
  }
}
</style>
