<template>
  <q-btn
    v-if="auth.isAuthenticated"
    flat
    round
    icon="notifications_none"
    :class="{ 'motion-ring': ringing }"
    :aria-label="`Notifications${store.unread ? ui(', {p0} non lues', { p0: store.unread }) : ''}`"
    @click="open"
  >
    <q-badge v-if="store.unread" color="negative" floating rounded>{{
      store.unread > 99 ? '99+' : store.unread
    }}</q-badge>
    <q-menu v-model="menu" anchor="bottom right" self="top right">
      <q-list class="notif-menu" separator>
        <q-item-label header class="row items-center justify-between">
          <span>{{ ui('Notifications') }}</span>
          <q-btn
            v-if="store.unread"
            flat
            dense
            no-caps
            size="sm"
            :label="ui('Tout marquer comme lu')"
            @click.stop="store.markRead()"
          />
        </q-item-label>
        <q-item
          v-for="n in store.latest"
          :key="n.id"
          clickable
          :class="{ unread: !n.read_at }"
          @click="go(n)"
        >
          <q-item-section>
            <q-item-label>{{ n.title }}</q-item-label>
            <q-item-label caption lines="2">{{ n.body }}</q-item-label>
            <q-item-label caption>{{ ago(n.created_at) }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="!store.latest.length">
          <q-item-section class="text-muted">{{
            ui('Aucune notification.')
          }}</q-item-section>
        </q-item>
        <q-item clickable to="/notifications">
          <q-item-section class="text-primary">{{
            ui('Tout voir')
          }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { timeAgo } from '@/utils/timeAgo'

const auth = useAuthStore(),
  store = useNotificationsStore(),
  router = useRouter()
const menu = ref(false),
  ringing = ref(false)
// The bell answers a new notification with one small swing, never a loop.
watch(
  () => store.unread,
  (now, before) => {
    if (now <= (before ?? 0)) return
    ringing.value = true
    setTimeout(() => (ringing.value = false), 720)
  }
)
const ago = timeAgo

async function open() {
  await store.loadLatest()
}
async function go(n) {
  if (!n.read_at) await store.markRead([n.id])
  menu.value = false
  if (n.path) router.push(n.path)
}
watch(
  () => auth.isAuthenticated,
  signedIn => (signedIn ? store.start() : store.stop()),
  { immediate: true }
)
onBeforeUnmount(() => store.stop())
</script>
<style scoped>
.notif-menu {
  width: min(360px, 92vw);
  max-height: 70vh;
}
.unread {
  background: color-mix(in srgb, var(--pwa-primary) 8%, transparent);
}
</style>
