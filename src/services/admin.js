import { ui } from '@/i18n/text'
import { api } from '@/boot/axios'

export const adminApi = {
  publishers: params => api.get('/admin/publishers', { params }),
  createPublisher: data => api.post('/admin/publishers', data),
  updatePublisher: (id, data) => api.put(`/admin/publishers/${id}`, data),
  publisherAccounts: (id, params) =>
    api.get(`/admin/publishers/${id}/accounts`, { params }),
  linkPublisherAccount: (id, userId) =>
    api.put(`/admin/publishers/${id}/accounts/${userId}`),
  unlinkPublisherAccount: (id, userId) =>
    api.delete(`/admin/publishers/${id}/accounts/${userId}`),
  publisherApplications: params =>
    api.get('/admin/publisher-applications', { params }),
  assignPublisher: (id, publisher_id) =>
    api.put(`/admin/apps/${id}/publisher`, { publisher_id }),
  submissionSettings: (id, sdk_check_required) =>
    api.put(`/admin/apps/${id}/submission-settings`, { sdk_check_required }),
  submissionReadiness: id => api.get(`/admin/apps/${id}/submission-readiness`),
  submitPublisherApplication: id => api.post(`/admin/apps/${id}/submit`),
  stats: () => api.get('/admin/stats'),
  // { data: { todo, tools, assistant, queue, generated_at } }; a null todo counter means
  // the admin lacks the permission to handle it.
  overview: () => api.get('/admin/overview'),
  // AI assistant (DeepSeek). The API key is write-only: GET only returns key_hint.
  aiSettings: () => api.get('/admin/ai/settings'),
  // Only the changed fields; api_key only when one was typed.
  updateAiSettings: payload => api.put('/admin/ai/settings', payload),
  // { api_key? } → { data: { ok, models, message } }; without a key, tests the stored one.
  testAi: apiKey =>
    api.post('/admin/ai/test', apiKey ? { api_key: apiKey } : {}),
  requests: params => api.get('/admin/publication-requests', { params }),
  request: id => api.get(`/admin/publication-requests/${id}`),
  startRequest: id => api.post(`/admin/publication-requests/${id}/start`),
  decideRequest: (id, data) =>
    api.post(`/admin/publication-requests/${id}/decide`, data),
  revealAccess: id =>
    api.post(`/admin/publication-requests/${id}/review-access`),
  noteRequest: (id, internal_note) =>
    api.put(`/admin/publication-requests/${id}/note`, { internal_note }),
  apps: params => api.get('/admin/apps', { params }),
  review: (id, data) => api.post(`/admin/apps/${id}/review`, data),
  archive: (id, reason) => api.delete(`/apps/${id}`, { data: { reason } }),
  catalog: (id, data) => api.put(`/apps/${id}`, data),
  users: params => api.get('/admin/users', { params }),
  user: id => api.get(`/admin/users/${id}`),
  userStatus: (id, data) => api.post(`/admin/users/${id}/status`, data),
  // Users cannot change these themselves: support corrects them on request.
  userCountry: (id, data) => api.put(`/admin/users/${id}/country`, data),
  userEmail: (id, data) => api.post(`/admin/users/${id}/email`, data),
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
  maintenance: data => api.put('/admin/maintenance', data),
  settings: () => api.get('/admin/settings'),
  updateSettings: data => api.put('/admin/settings', data),
  collections: () => api.get('/admin/collections'),
  createCollection: data => api.post('/admin/collections', data),
  updateCollection: (id, data) => api.put(`/admin/collections/${id}`, data),
  deleteCollection: id => api.delete(`/admin/collections/${id}`)
}

export const PERMISSION_LABELS = {
  get 'developers.review'() {
    return ui('Vérifier les développeurs')
  },
  get 'apps.moderate'() {
    return ui('Modérer les applications')
  },
  get 'reviews.moderate'() {
    return ui('Modérer les avis')
  },
  get 'reports.handle'() {
    return ui('Traiter les signalements')
  },
  get 'catalog.manage'() {
    return ui('Gérer le catalogue')
  },
  get 'users.manage'() {
    return ui('Gérer les utilisateurs')
  },
  get 'settings.manage'() {
    return ui('Gérer les paramètres et les permissions')
  },
  get 'audit.view'() {
    return ui('Consulter le journal et les statistiques')
  }
}
