import { describe, expect, it } from 'vitest'
import { adminDecisions, statusLabel } from '@/utils/appStatus'

describe('application status helpers', () => {
  it('labels every server status in French', () => {
    expect(statusLabel('changes_requested')).toBe('Correction demandée')
    expect(statusLabel('published')).toBe('Publiée')
  })

  it('offers only the decisions the server accepts from each state', () => {
    expect(adminDecisions('draft')).toEqual([])
    expect(adminDecisions('published').map(d => d.to)).toEqual(['suspended'])
    expect(adminDecisions('suspended')).toEqual([
      expect.objectContaining({ to: 'in_review', label: 'Réexaminer' })
    ])
    expect(
      adminDecisions('submitted').find(d => d.to === 'in_review').reason
    ).toBe(false)
  })
})
