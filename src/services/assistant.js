import { api } from '@/boot/axios'

export const assistantApi = {
  status: () => api.get('/developer/assistant/status'),
  history: (analysisId, page = 1) =>
    api.get('/developer/assistant/history', {
      params: { analysis_id: analysisId, page }
    }),
  ask: payload =>
    api.post('/developer/assistant/ask', payload, { timeout: 55000 })
}
