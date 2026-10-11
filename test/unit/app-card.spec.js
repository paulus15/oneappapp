import { describe, expect, it } from 'vitest'
import { toCard } from '@/utils/appCard'

describe('toCard', () => {
  it('never invents a rating for an app without reviews', () => {
    expect(toCard({ id: 1, name: 'A', reviews_count: 0 }).rating).toBeNull()
    expect(
      toCard({ id: 2, name: 'B', reviews_count: 3, average_rating: '4.333' })
        .rating
    ).toBe('4.3')
  })

  it('prefers the public publisher name and the category object', () => {
    const card = toCard({
      id: 3,
      name: 'C',
      category: { name: 'Santé', icon: 'favorite', color: '#f00' },
      developer: { developer_profile: { public_name: 'Studio' } }
    })
    expect(card).toMatchObject({
      to: '/apps/3',
      category: 'Santé',
      icon: 'favorite',
      publisher: 'Studio'
    })
  })
})
