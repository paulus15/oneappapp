import { api } from '@/boot/axios'

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  requests: params => api.get('/admin/publication-requests', { params }),
  request: id => api.get(`/admin/publication-requests/${id}`),
  startRequest: id => api.post(`/admin/publication-requests/${id}/start`),
  decideRequest: (id, data) =>
    api.post(`/admin/publication-requests/${id}/decide`, data),
  noteRequest: (id, internal_note) =>
    api.put(`/admin/publication-requests/${id}/note`, { internal_note }),
  apps: params => api.get('/admin/apps', { params }),
  review: (id, data) => api.post(`/admin/apps/${id}/review`, data),
  archive: (id, reason) => api.delete(`/apps/${id}`, { data: { reason } }),
  catalog: (id, data) => api.put(`/apps/${id}`, data),
  users: params => api.get('/admin/users', { params }),
  user: id => api.get(`/admin/users/${id}`),
  userStatus: (id, data) => api.post(`/admin/users/${id}/status`, data),
  userPermissions: (id, data) =>
    api.put(`/admin/users/${id}/permissions`, data),
  auditLogs: params => api.get('/admin/audit-logs', { params }),
  categories: () => api.get('/categories', { params: { all: 1 } }),
  createCategory: data => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: id => api.delete(`/categories/${id}`),
  reports: params => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.post(`/admin/reports/${id}/resolve`, data),
  reviews: params => api.get('/admin/reviews', { params }),
  moderateReview: (id, data) => api.post(`/admin/reviews/${id}/moderate`, data),
  settings: () => api.get('/admin/settings'),
  updateSettings: data => api.put('/admin/settings', data),
  collections: () => api.get('/admin/collections'),
  createCollection: data => api.post('/admin/collections', data),
  updateCollection: (id, data) => api.put(`/admin/collections/${id}`, data),
  deleteCollection: id => api.delete(`/admin/collections/${id}`)
}

export const PERMISSION_LABELS = {
  'developers.review': 'Vérifier les développeurs',
  'apps.moderate': 'Modérer les applications',
  'reviews.moderate': 'Modérer les avis',
  'reports.handle': 'Traiter les signalements',
  'catalog.manage': 'Gérer le catalogue',
  'users.manage': 'Gérer les utilisateurs',
  'settings.manage': 'Gérer les paramètres et les permissions',
  'audit.view': 'Consulter le journal et les statistiques'
}
