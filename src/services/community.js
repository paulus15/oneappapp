import { ui } from '@/i18n/text'
import { api } from '@/boot/axios'

export const communityApi = {
  reviews: (appId, params) => api.get(`/apps/${appId}/reviews`, { params }),
  saveReview: data => api.post('/reviews', data),
  deleteReview: id => api.delete(`/reviews/${id}`),
  reply: (id, body) => api.post(`/reviews/${id}/reply`, { body }),
  deleteReply: id => api.delete(`/reviews/${id}/reply`),
  myReviews: page => api.get('/account/reviews', { params: { page } }),
  report: data => api.post('/reports', data),
  myReports: page => api.get('/account/reports', { params: { page } }),
  recordView: id => api.post(`/apps/${id}/view`),
  preferences: () => api.get('/account/preferences'),
  savePreferences: data => api.put('/account/preferences', data),
  recent: () => api.get('/account/recent'),
  clearRecent: () => api.delete('/account/recent'),
  exportData: () => api.get('/account/export', { responseType: 'blob' })
}

export const REPORT_REASONS = {
  get malware() {
    return ui('Logiciel malveillant ou dangereux')
  },
  get fraud() {
    return ui('Arnaque ou fraude')
  },
  get illegal() {
    return ui('Contenu illégal')
  },
  get privacy() {
    return ui('Atteinte à la vie privée')
  },
  get offensive() {
    return ui('Contenu haineux ou offensant')
  },
  get spam() {
    return ui('Spam ou publicité')
  },
  get broken() {
    return ui('Application cassée ou trompeuse')
  },
  get impersonation() {
    return ui('Usurpation d’identité ou de marque')
  },
  get other() {
    return ui('Autre')
  }
}
