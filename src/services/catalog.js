import { api } from '@/boot/axios'

export const catalogApi = {
  entity: id => api.get(`/entities/${id}`),
  home: () => api.get('/home'),
  apps: params => api.get('/apps', { params }),
  rankings: params => api.get('/rankings', { params }),
  categories: () => api.get('/categories'),
  category: slug => api.get(`/categories/${slug}`),
  similar: id => api.get(`/apps/${id}/similar`),
  collection: slug => api.get(`/collections/${slug}`),
  publisher: id => api.get(`/publishers/${id}`),
  contact: data => api.post('/contact', data)
}
