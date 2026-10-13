import { ui } from '@/i18n/text'
import { identityIsValid } from '@/utils/identity'

// Server statuses of DeveloperProfile (DeveloperProfileController@review):
// draft → pending_verification → verified | rejected, and suspended at any time.
// Each tone maps to a Quasar brand colour; the icon and the label always go with it.
const PROFILE_STATUSES = {
  verified: {
    tone: 'positive',
    icon: 'verified',
    get label() {
      return ui('Profil vérifié')
    }
  },
  pending_verification: {
    tone: 'warning',
    icon: 'hourglass_top',
    get label() {
      return ui('Vérification en attente')
    }
  },
  rejected: {
    tone: 'negative',
    icon: 'gpp_bad',
    get label() {
      return ui('Corrections demandées')
    }
  },
  suspended: {
    tone: 'negative',
    icon: 'block',
    get label() {
      return ui('Publication suspendue')
    }
  },
  draft: {
    tone: 'neutral',
    icon: 'edit_note',
    get label() {
      return ui('Profil à compléter')
    }
  }
}

export function profileStatus(status) {
  return {
    status: PROFILE_STATUSES[status] ? status : 'draft',
    ...(PROFILE_STATUSES[status] || PROFILE_STATUSES.draft)
  }
}

const ITEM_STATES = {
  done: {
    tone: 'positive',
    icon: 'check_circle',
    get label() {
      return ui('Vérifié')
    }
  },
  pending: {
    tone: 'warning',
    icon: 'hourglass_top',
    get label() {
      return ui('En cours')
    }
  },
  failed: {
    tone: 'negative',
    icon: 'cancel',
    get label() {
      return ui('À corriger')
    }
  },
  todo: {
    tone: 'neutral',
    icon: 'radio_button_unchecked',
    get label() {
      return ui('À faire')
    }
  }
}

const REVIEW_STATE = {
  verified: 'done',
  pending_verification: 'pending',
  rejected: 'failed',
  suspended: 'failed'
}

// The four conditions the server checks before verifying a profile
// (completeness rules, verified e-mail, valid identity document, admin decision).
export function verificationChecklist(profile, user) {
  const item = (key, label, state, stateLabel) => ({
    key,
    label,
    state,
    tone: ITEM_STATES[state].tone,
    icon: ITEM_STATES[state].icon,
    stateLabel: stateLabel || ITEM_STATES[state].label
  })
  const expired = profile?.identity_document_type && !identityIsValid(profile)
  return [
    item(
      'email',
      ui('Adresse e-mail'),
      user?.email_verified_at ? 'done' : 'todo'
    ),
    item(
      'details',
      ui('Informations du profil'),
      Array.isArray(profile?.missing_fields) && !profile.missing_fields.length
        ? 'done'
        : 'todo'
    ),
    item(
      'identity',
      ui('Pièce d’identité'),
      identityIsValid(profile) ? 'done' : expired ? 'failed' : 'todo',
      expired ? ui('Expirée') : null
    ),
    item(
      'review',
      ui('Validation par l’équipe PWA Store'),
      REVIEW_STATE[profile?.status] || 'todo'
    )
  ]
}
