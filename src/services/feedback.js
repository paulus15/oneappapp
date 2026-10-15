import { api } from '@/boot/axios'

// PWA Feedback Hub API. Every endpoint answers 404 when the `feedback_hub` tool is off or
// the application is not the developer's. Attachments keep the existing private download
// route (suggestionsApi.attachment).
const base = '/developer/feedback'
export const feedbackApi = {
  // Applications of the developer, for the application filter.
  apps: () => api.get('/developer/apps'),
  // { data: { period_days, received, pending, planned, in_progress, resolved, declined,
  //   avg_resolution_hours (null under 3 resolved), by_status, by_topic, by_priority } }.
  // Counts: feedback received in the period (duplicates included) by current status;
  // average: feedback resolved in the period. period: 30 | 90 | 365, 90 by default.
  summary: ({ applicationId, period = 90 } = {}) =>
    api.get(`${base}/summary`, {
      params: {
        ...(applicationId ? { application_id: applicationId } : {}),
        period
      }
    }),
  // Laravel paginator (20 per page); params built by feedbackListParams().
  list: params => api.get(`${base}/suggestions`, { params }),
  show: id => api.get(`${base}/suggestions/${id}`),
  // { status?, priority?, topic?, version?, reply?, duplicate_of_id? } → { data: detail }
  update: (id, payload) => api.patch(`${base}/suggestions/${id}`, payload),
  // { data: [{ id, title, status, score, duplicate_of_id }] }
  similar: id => api.get(`${base}/suggestions/${id}/similar`),
  // { ids (≤ 50), exactly one of status | priority | topic } →
  // { data: { updated, selected_updated } }: selected_updated counts the selected ids that
  // changed, updated also the duplicates that followed. 404 when one id is not available.
  bulk: payload => api.post(`${base}/bulk`, payload)
}
