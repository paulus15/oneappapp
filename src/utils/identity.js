import { ui } from '@/i18n/text'
export const identityLabels = {
  get national_id() {
    return ui('Carte nationale d’identité')
  },
  get passport() {
    return ui('Passeport')
  },
  get residence_permit() {
    return ui('Titre de séjour')
  },
  get driving_license() {
    return ui('Permis de conduire')
  }
}

export const identityOptions = Object.keys(identityLabels).map(value => ({
  value,
  get label() {
    return identityLabels[value]
  }
}))

// Mirrors DeveloperProfile::hasValidIdentity(): the document must expire after today.
export function identityIsValid(profile) {
  if (!profile?.identity_document_type || !profile.identity_document_expires_at)
    return false
  const today = new Date().toISOString().slice(0, 10)
  return profile.identity_document_expires_at.slice(0, 10) > today
}
