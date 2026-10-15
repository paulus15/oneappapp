import { api } from '@/boot/axios'

// PWA Beta Testing API. Every endpoint answers 404 when the `beta` tool is off.
const dev = '/developer/beta'

// Developer side (owner of the application only).
export const betaDevApi = {
  // Applications of the developer, for the campaign form and the list filter.
  apps: () => api.get('/developer/apps'),
  // Laravel paginator (15 per page) of DevCampaign.
  campaigns: ({ applicationId, status, page = 1 } = {}) =>
    api.get(`${dev}/campaigns`, {
      params: {
        ...(applicationId ? { application_id: applicationId } : {}),
        ...(status ? { status } : {}),
        page
      }
    }),
  // Payload built by campaignPayload() → 201 { data: DevCampaignDetail }
  create: payload => api.post(`${dev}/campaigns`, payload),
  show: id => api.get(`${dev}/campaigns/${id}`),
  // → { data: DevCampaignDetail, meta: { requires_review } }
  update: (id, payload) => api.patch(`${dev}/campaigns/${id}`, payload),
  submit: id => api.post(`${dev}/campaigns/${id}/submit`),
  close: id => api.post(`${dev}/campaigns/${id}/close`),
  // Takes a pending campaign back to draft → { data: DevCampaignDetail }; 422 otherwise.
  withdraw: id => api.post(`${dev}/campaigns/${id}/withdraw`),
  // Laravel paginator (20 per page).
  participants: (id, { status, page = 1 } = {}) =>
    api.get(`${dev}/campaigns/${id}/participants`, {
      params: { ...(status ? { status } : {}), page }
    }),
  // { status: accepted | rejected | removed } — 422 when the campaign is full.
  decide: (participantId, status) =>
    api.patch(`${dev}/participants/${participantId}`, { status }),
  // Laravel paginator (20 per page).
  feedback: (id, { type, status, page = 1 } = {}) =>
    api.get(`${dev}/campaigns/${id}/feedback`, {
      params: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        page
      }
    }),
  feedbackDetail: id => api.get(`${dev}/feedback/${id}`),
  // { status?, reply? } → { data: detail }
  updateFeedback: (id, payload) => api.patch(`${dev}/feedback/${id}`, payload)
}

// Public catalogue and application (applying needs a session).
export const betaPublicApi = {
  // Laravel paginator (12 per page) of PublicCampaign.
  campaigns: (page = 1) => api.get('/beta/campaigns', { params: { page } }),
  show: id => api.get(`/beta/campaigns/${id}`),
  // { accept_terms: true, answers: { [questionId]: value }, share_name } →
  // 201 { data: MyParticipation }; 409 already applied; 422 closed, full or invalid.
  apply: (id, payload) => api.post(`/beta/campaigns/${id}/apply`, payload)
}

// Tester space ("Mes tests").
export const betaTesterApi = {
  // Laravel paginator (15 per page) of MyParticipation.
  participations: (page = 1) => api.get('/account/beta', { params: { page } }),
  withdraw: id => api.post(`/account/beta/${id}/withdraw`),
  feedback: (id, page = 1) =>
    api.get(`/account/beta/${id}/feedback`, { params: { page } }),
  // multipart/form-data: type, title, body, steps?, device?, attachments[] (≤ 3 images).
  sendFeedback: (id, form, onProgress) =>
    api.post(
      `/account/beta/${id}/feedback`,
      form,
      onProgress
        ? {
            onUploadProgress: event =>
              onProgress(
                event.total ? Math.round((event.loaded / event.total) * 100) : 0
              )
          }
        : undefined
    ),
  // Files are private: fetched with the session (tester or developer), never public.
  attachment: (feedbackId, attachmentId) =>
    api.get(`/beta/feedback/${feedbackId}/attachments/${attachmentId}`, {
      responseType: 'blob'
    })
}

// Back-office moderation.
export const betaAdminApi = {
  campaigns: ({ status = 'pending', page = 1 } = {}) =>
    api.get('/admin/beta/campaigns', { params: { status, page } }),
  // { decision: approve | reject, reason (required to reject) }
  review: (id, payload) =>
    api.post(`/admin/beta/campaigns/${id}/review`, payload)
}
