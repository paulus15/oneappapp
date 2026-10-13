import { describe, expect, it } from 'vitest'
import { profileStatus, verificationChecklist } from '@/utils/developerStatus'

const future = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)
const past = '2020-01-01'

describe('developer profile status', () => {
  it('gives every server status a colour, an icon and a label', () => {
    expect(profileStatus('verified')).toMatchObject({
      tone: 'positive',
      icon: 'verified',
      label: 'Profil vérifié'
    })
    expect(profileStatus('pending_verification')).toMatchObject({
      tone: 'warning',
      icon: 'hourglass_top'
    })
    expect(profileStatus('rejected')).toMatchObject({
      tone: 'negative',
      icon: 'gpp_bad'
    })
    expect(profileStatus('suspended')).toMatchObject({
      tone: 'negative',
      icon: 'block'
    })
    expect(profileStatus('draft')).toMatchObject({
      tone: 'neutral',
      icon: 'edit_note'
    })
  })

  it('treats an unknown status as not submitted', () => {
    expect(profileStatus(undefined)).toMatchObject({
      status: 'draft',
      tone: 'neutral'
    })
  })
})

describe('verification checklist', () => {
  const states = (profile, user) =>
    Object.fromEntries(
      verificationChecklist(profile, user).map(i => [i.key, i.state])
    )

  it('marks every item done for a verified profile', () => {
    expect(
      states(
        {
          status: 'verified',
          missing_fields: [],
          identity_document_type: 'passport',
          identity_document_expires_at: future
        },
        { email_verified_at: '2026-01-01' }
      )
    ).toEqual({
      email: 'done',
      details: 'done',
      identity: 'done',
      review: 'done'
    })
  })

  it('shows what is left on a draft and flags an expired identity document', () => {
    const items = verificationChecklist(
      {
        status: 'draft',
        missing_fields: ['legal_name'],
        identity_document_type: 'passport',
        identity_document_expires_at: past
      },
      { email_verified_at: null }
    )
    expect(Object.fromEntries(items.map(i => [i.key, i.state]))).toEqual({
      email: 'todo',
      details: 'todo',
      identity: 'failed',
      review: 'todo'
    })
    expect(items.find(i => i.key === 'identity')).toMatchObject({
      tone: 'negative',
      icon: 'cancel',
      stateLabel: 'Expirée',
      label: 'Pièce d’identité'
    })
  })

  it('follows the review decision', () => {
    expect(states({ status: 'pending_verification' }).review).toBe('pending')
    expect(states({ status: 'rejected' }).review).toBe('failed')
    expect(states({ status: 'suspended' }).review).toBe('failed')
  })
})
