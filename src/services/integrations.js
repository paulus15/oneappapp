import { api } from '@/boot/axios'

// PWA Store Integrations API (access tokens and webhooks). Every endpoint answers 404
// when the `integrations` tool is off. Plaintext tokens and webhook secrets only come
// back in the response that creates them (or rotates the secret): never stored here.
const base = '/developer/integrations'

export const integrationsApi = {
  // The developer's applications, for the scope selectors.
  apps: () => api.get('/developer/apps'),

  // { data: Token[] } — revoked tokens included, newest first.
  tokens: () => api.get(`${base}/tokens`),
  // Payload built by tokenPayload() → 201 { data: { …Token, token } };
  // 422 when 20 tokens are already active.
  createToken: payload => api.post(`${base}/tokens`, payload),
  // → 204 (revocation is immediate and final).
  revokeToken: id => api.delete(`${base}/tokens/${id}`),

  // { data: Webhook[] }
  webhooks: () => api.get(`${base}/webhooks`),
  // Payload built by webhookPayload() → 201 { data: { …Webhook, secret } };
  // 422 invalid or private address, or 10 webhooks already.
  createWebhook: payload => api.post(`${base}/webhooks`, payload),
  // { url?, events?, active? } → { data: Webhook }
  updateWebhook: (id, payload) => api.patch(`${base}/webhooks/${id}`, payload),
  // → { data: { secret } } (shown once)
  rotateSecret: id => api.post(`${base}/webhooks/${id}/rotate-secret`),
  deleteWebhook: id => api.delete(`${base}/webhooks/${id}`),
  // → 202: a test event is queued.
  ping: id => api.post(`${base}/webhooks/${id}/ping`),
  // Laravel paginator (20 per page).
  deliveries: (id, { status, page = 1 } = {}) =>
    api.get(`${base}/webhooks/${id}/deliveries`, {
      params: { ...(status ? { status } : {}), page }
    }),
  // → 202
  redeliver: (id, deliveryId) =>
    api.post(`${base}/webhooks/${id}/deliveries/${deliveryId}/redeliver`)
}
