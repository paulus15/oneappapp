<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Mon compte') }}</span
      ><h1>{{ ui('Notifications') }}</h1
      ><p
        >{{
          ui(
            'Les décisions, avis et alertes qui vous concernent. Choisissez ce que vous recevez par e-mail dans'
          )
        }}
        <router-link to="/account">{{
          ui('Préférences et données')
        }}</router-link
        >.</p
      ></header
    >
    <div class="workspace-actions q-mb-md">
      <q-btn
        outline
        no-caps
        color="primary"
        :label="ui('Tout marquer comme lu')"
        :disable="!store.unread"
        @click="markAll"
      />
    </div>
    <EmptyState
      v-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Notifications indisponibles')"
      :text="ui('Vérifiez votre connexion puis réessayez.')"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="reload"
      />
    </EmptyState>
    <div v-else-if="loading" class="q-gutter-y-sm" aria-busy="true">
      <q-skeleton
        v-for="n in 5"
        :key="n"
        height="64px"
        class="rounded-borders"
      />
    </div>
    <EmptyState
      v-else-if="!items.length"
      icon="notifications_none"
      :title="ui('Aucune notification.')"
      :text="
        ui(
          'Les décisions, réponses et alertes qui vous concernent apparaîtront ici.'
        )
      "
    />
    <q-list v-else bordered separator class="rounded-borders">
      <q-item
        v-for="n in items"
        :key="n.id"
        :clickable="!!n.path"
        :class="{ unread: !n.read_at }"
        @click="open(n)"
      >
        <q-item-section avatar>
          <q-icon
            :name="n.read_at ? 'notifications_none' : 'notifications_active'"
            :color="n.read_at ? 'grey-6' : 'primary'"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ n.title }}</q-item-label>
          <q-item-label caption>{{ n.body }}</q-item-label>
          <q-item-label caption>{{ timeAgo(n.created_at) }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <LoadMore
      auto
      v-if="!loading && !error"
      :has-more="hasMore"
      :loading="loadingMore"
      :error="moreError"
      :shown="items.length"
      :total="total"
      :page-size="20"
      @load="loadMore"
    />
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/boot/axios'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { useNotificationsStore } from '@/stores/notifications'
import { timeAgo } from '@/utils/timeAgo'

const store = useNotificationsStore(),
  router = useRouter()
const {
  items,
  total,
  hasMore,
  loading,
  loadingMore,
  error,
  moreError,
  reload,
  loadMore
} = useLoadMore(
  async page => (await api.get('/notifications', { params: { page } })).data
)
async function markAll() {
  await store.markRead()
  const now = new Date().toISOString()
  items.value.forEach(n => (n.read_at ||= now))
}
async function open(n) {
  if (!n.read_at) {
    await store.markRead([n.id])
    n.read_at = new Date().toISOString()
  }
  if (n.path) router.push(n.path)
}
onMounted(reload)
</script>
<style scoped>
.unread {
  background: color-mix(in srgb, var(--pwa-primary) 8%, transparent);
}
</style>
