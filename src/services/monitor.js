import { api } from '@/boot/axios'

// PWA Monitor API. Every endpoint answers 404 when the tool is off or the app is not owned.
const base = '/developer/monitor/apps'
export const monitorApi = {
  // Laravel paginator of the developer's apps with their monitoring summary.
  apps: page => api.get(base, { params: { page } }),
  // { data: { app, monitor, settings, intervals, uptime, daily } }
  show: id => api.get(`${base}/${id}`),
  checks: (id, page) => api.get(`${base}/${id}/checks`, { params: { page } }),
  incidents: (id, page) =>
    api.get(`${base}/${id}/incidents`, { params: { page } }),
  // { enabled, interval_minutes, notify_email, notify_recovery } → { data: settings }
  saveSettings: (id, settings) => api.put(`${base}/${id}/settings`, settings),
  // 202 { message } once queued, 429 when a manual check ran less than 5 minutes ago.
  check: id => api.post(`${base}/${id}/check`)
}
