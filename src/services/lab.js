import { api } from '@/boot/axios'

// PWA Lab API. /lab/analyses is the historical Lab (always available); the
// /developer/lab endpoints belong to Lab Pro and answer 404 while `lab_pro` is off.
export const labApi = {
  // { url, application_id? } → 201 LabAnalysis. application_id is only sent when an
  // application is chosen, so the payload of the historical Lab stays { url }.
  analyze: ({ url, applicationId } = {}) =>
    api.post('/lab/analyses', {
      url,
      ...(applicationId ? { application_id: applicationId } : {})
    }),
  // Laravel paginator (20 per page) of { id, url, reachable, score, installable,
  // created_at, application_id, engine }.
  list: ({ url, applicationId, page = 1 } = {}) =>
    api.get('/lab/analyses', {
      params: {
        ...(url ? { url } : {}),
        ...(applicationId ? { application_id: applicationId } : {}),
        page
      }
    }),
  show: id => api.get(`/lab/analyses/${id}`),
  // { data: [{ id, name, url }] }: the developer's applications.
  apps: () => api.get('/developer/lab/apps'),
  // with: 'previous' or another analysis id. 404 when there is no previous analysis of
  // the address, 422 when one side is a legacy (non Pro) analysis.
  compare: (id, withValue = 'previous') =>
    api.get(`/developer/lab/analyses/${id}/compare`, {
      params: { with: withValue }
    })
}
