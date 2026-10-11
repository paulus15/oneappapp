import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

let timer = null

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({ unread: 0, latest: [] }),
  actions: {
    async refreshCount() {
      try {
        this.unread = (await api.get('/notifications/unread-count')).data.unread
      } catch {
        // Offline or signed out: keep the last known count.
      }
    },
    async loadLatest() {
      this.latest = (await api.get('/notifications')).data.data.slice(0, 8)
    },
    async markRead(ids) {
      this.unread = (
        await api.post('/notifications/read', ids ? { ids } : {})
      ).data.unread
      const now = new Date().toISOString()
      this.latest = this.latest.map(n =>
        !ids || ids.includes(n.id) ? { ...n, read_at: n.read_at || now } : n
      )
    },
    // Polls once a minute while the tab is visible; no websocket server is required.
    start() {
      this.stop()
      this.refreshCount()
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') this.refreshCount()
      }, 60000)
    },
    stop() {
      clearInterval(timer)
      timer = null
      this.unread = 0
      this.latest = []
    }
  }
})
