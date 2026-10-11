import { api } from '@/boot/axios'
export const accountApi = {
  me: () => api.get('/auth/me'),
  update: data => api.put('/account', data),
  resend: () => api.post('/auth/email/resend'),
  favorites: (page = 1) => api.get('/favorites', { params: { page } }),
  favorite: id => api.put(`/favorites/${id}`),
  unfavorite: id => api.delete(`/favorites/${id}`),
  profile: () => api.get('/developer/profile'),
  activate: type => api.post('/developer/activate', { type }),
  saveProfile: data => api.put('/developer/profile', data),
  submitProfile: () => api.post('/developer/profile/submit'),
  quotas: () => api.get('/developer/quotas'),
  developers: (page = 1) => api.get('/admin/developers', { params: { page } }),
  reviewDeveloper: (id, data) =>
    api.post(`/admin/developers/${id}/review`, data),
  source: (id, data) => api.put(`/apps/${id}/source`, data),
  checkUrl: id => api.post(`/apps/${id}/check-url`),
  submitApp: id => api.post(`/apps/${id}/submit`),
  reviewApp: (id, data) => api.post(`/admin/apps/${id}/review`, data),
  reviewVersion: (id, data) => api.post(`/admin/versions/${id}/review`, data),
  deploy: id => api.post(`/versions/${id}/extract`),
  analytics: id => api.get(`/analytics/summary/${id}`)
}
export function apiMessage(error) {
  const errors = error.response?.data?.errors
  return errors
    ? Object.values(errors).flat().join(' ')
    : error.response?.data?.message || 'Le service est indisponible. Réessayez.'
}
