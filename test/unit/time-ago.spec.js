import { describe, expect, it } from 'vitest'
import { timeAgo } from '@/utils/timeAgo'

describe('timeAgo', () => {
  const now = new Date('2026-10-12T12:00:00Z').getTime()
  it('speaks French relative time', () => {
    expect(timeAgo('2026-10-12T11:59:40Z', now)).toBe('à l’instant')
    expect(timeAgo('2026-10-12T09:00:00Z', now)).toBe('il y a 3 heures')
    expect(timeAgo('2026-10-11T12:00:00Z', now)).toBe('hier')
  })
})
