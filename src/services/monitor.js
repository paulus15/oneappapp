import { api } from '@/boot/axios'

const base = '/developer/monitor/apps'
export const monitorApi = {
  apps: page => api.get(base, { params: { page } }),
  show: id => api.get(`${base}/${id}`),
  checks: (id, page) => api.get(`${base}/${id}/checks`, { params: { page } }),
  incidents: (id, page) => api.get(`${base}/${id}/incidents`, { params: { page } }),
  update: (id, data) => api.put(`${base}/${id}`, data),
  check: id => api.post(`${base}/${id}/checks`)
}
