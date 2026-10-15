import { api } from '@/boot/axios'

// PWA Analytics Pro API. Both reports answer 404 when the tool is off or the application
// is not the developer's, and 422 for an invalid period (see utils/analytics rangeError).
const base = '/developer/analytics'
export const analyticsApi = {
  // The developer's applications, for the selector.
  apps: () => api.get('/developer/apps'),
  // { data: { range, kpis, series, sources, countries, referrers, campaigns, top_apps, data_since } }
  overview: params => api.get(`${base}/overview`, { params }),
  // CSV file of one dataset (series | sources | countries | apps), through the session.
  exportCsv: (params, dataset) =>
    api.get(`${base}/export.csv`, {
      params: { ...params, dataset },
      responseType: 'blob',
      headers: { Accept: 'text/csv' }
    })
}
