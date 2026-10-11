import { api } from '@/boot/axios'

export const communityApi = {
  reviews: (appId, params) => api.get(`/apps/${appId}/reviews`, { params }),
  saveReview: data => api.post('/reviews', data),
  deleteReview: id => api.delete(`/reviews/${id}`),
  reply: (id, body) => api.post(`/reviews/${id}/reply`, { body }),
  deleteReply: id => api.delete(`/reviews/${id}/reply`),
  myReviews: page => api.get('/account/reviews', { params: { page } }),
  report: data => api.post('/reports', data),
  myReports: () => api.get('/account/reports'),
  recordView: id => api.post(`/apps/${id}/view`),
  preferences: () => api.get('/account/preferences'),
  savePreferences: data => api.put('/account/preferences', data),
  recent: () => api.get('/account/recent'),
  clearRecent: () => api.delete('/account/recent'),
  exportData: () => api.get('/account/export', { responseType: 'blob' })
}

export const REPORT_REASONS = {
  malware: 'Logiciel malveillant ou dangereux',
  fraud: 'Arnaque ou fraude',
  illegal: 'Contenu illégal',
  privacy: 'Atteinte à la vie privée',
  offensive: 'Contenu haineux ou offensant',
  spam: 'Spam ou publicité',
  broken: 'Application cassée ou trompeuse',
  impersonation: 'Usurpation d’identité ou de marque',
  other: 'Autre'
}
