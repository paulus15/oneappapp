export const identityLabels = {
  national_id: 'Carte nationale d’identité',
  passport: 'Passeport',
  residence_permit: 'Titre de séjour',
  driving_license: 'Permis de conduire'
}

export const identityOptions = Object.entries(identityLabels).map(
  ([value, label]) => ({ value, label })
)

// Mirrors DeveloperProfile::hasValidIdentity(): the document must expire after today.
export function identityIsValid(profile) {
  if (!profile?.identity_document_type || !profile.identity_document_expires_at)
    return false
  const today = new Date().toISOString().slice(0, 10)
  return profile.identity_document_expires_at.slice(0, 10) > today
}
