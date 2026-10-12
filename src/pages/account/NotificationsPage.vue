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
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <q-list bordered separator class="rounded-borders">
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
      <q-item v-if="!loading && !items.length"
        ><q-item-section>{{
          ui('Aucune notification.')
        }}</q-item-section></q-item
      >
    </q-list>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      class="q-mt-md"
      @update:model-value="load"
    />
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { useNotificationsStore } from '@/stores/notifications'
import { timeAgo } from '@/utils/timeAgo'

const store = useNotificationsStore(),
  router = useRouter()
const items = ref([]),
  loading = ref(true),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/notifications', {
      params: { page: page.value }
    })
    items.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function markAll() {
  await store.markRead()
  await load()
}
async function open(n) {
  if (!n.read_at) await store.markRead([n.id])
  if (n.path) router.push(n.path)
  else await load()
}
onMounted(load)
</script>
<style scoped>
.unread {
  background: color-mix(in srgb, var(--pwa-primary) 8%, transparent);
}
</style>
