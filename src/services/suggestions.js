import { ui } from '@/i18n/text'
import { api } from '@/boot/axios'

export const suggestionsApi = {
  // multipart/form-data: title, body (HTML from the editor) and files[].
  create: (appId, form) => api.post(`/apps/${appId}/suggestions`, form),
  // Feedback about PWA Store itself, read by the platform team only.
  sendFeedback: form => api.post('/feedback', form),
  platform: params => api.get('/admin/feedback', { params }),
  mine: page => api.get('/account/suggestions', { params: { page } }),
  received: params => api.get('/developer/suggestions', { params }),
  show: id => api.get(`/suggestions/${id}`),
  update: (id, data) => api.patch(`/suggestions/${id}`, data),
  remove: id => api.delete(`/suggestions/${id}`),
  // Files are private: fetched with the session, never through a public URL.
  attachment: (id, attachmentId) =>
    api.get(`/suggestions/${id}/attachments/${attachmentId}`, {
      responseType: 'blob'
    })
}

export const SUGGESTION_STATUS_LABELS = {
  get new() {
    return ui('Nouvelle')
  },
  get read() {
    return ui('Lue')
  },
  get planned() {
    return ui('Prévue')
  },
  get in_progress() {
    return ui('En cours')
  },
  get done() {
    return ui('Réalisée')
  },
  get declined() {
    return ui('Non retenue')
  }
}

export const FEEDBACK_CATEGORY_LABELS = {
  get idea() {
    return ui('Idée')
  },
  get bug() {
    return ui('Problème')
  },
  get other() {
    return ui('Autre')
  }
}

export const SUGGESTION_STATUS_COLORS = {
  new: 'primary',
  read: 'grey-7',
  planned: 'orange-8',
  in_progress: 'teal-7',
  done: 'positive',
  declined: 'negative'
}
