import { api } from '@/boot/axios'

// PWA Growth API. Every developer endpoint answers 404 when the tool is off or the app
// is not owned. SVG assets need the session, so they are fetched as text through `api`.
const base = '/developer/growth'
const svg = { responseType: 'text', headers: { Accept: 'image/svg+xml' } }
export const growthApi = {
  // { data: [{ id, name, icon_url, category, public_url, promotable, reason }] }
  apps: () => api.get(`${base}/apps`),
  // Laravel paginator (15 per page) of campaigns.
  campaigns: ({ applicationId, archived = false, page = 1 } = {}) =>
    api.get(`${base}/campaigns`, {
      params: {
        ...(applicationId ? { application_id: applicationId } : {}),
        archived: archived ? 1 : 0,
        page
      }
    }),
  // { application_id, name, source, medium? } → 201 { data: campaign }
  create: payload => api.post(`${base}/campaigns`, payload),
  // { data: campaign & { daily, countries } }
  show: id => api.get(`${base}/campaigns/${id}`),
  // { name?, medium?, archived? } → { data: campaign }
  update: (id, payload) => api.patch(`${base}/campaigns/${id}`, payload),
  campaignQr: id => api.get(`${base}/campaigns/${id}/qr.svg`, svg),
  appQr: appId => api.get(`${base}/apps/${appId}/qr.svg`, svg),
  shareCard: appId => api.get(`${base}/apps/${appId}/share-card.svg`, svg),
  // Public badge, also usable as a plain <img src>.
  badge: (appId, params) => api.get(`/badges/${appId}.svg`, { ...svg, params })
}

// Public attribution: a visit through a campaign link. 404 when unknown or archived.
export const campaignApi = {
  visit: token => api.post(`/campaigns/${encodeURIComponent(token)}/visit`)
}
