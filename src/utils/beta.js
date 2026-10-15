import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { fileExtension, richTextLength } from '@/utils/suggestions'

// PWA Beta Testing: wording and client-side rules. The API stays the authority; these
// rules only give an immediate, clear message before sending.

export const BETA_LIMITS = Object.freeze({
  name: 80,
  description: 2000,
  objectives: 1000,
  eligibility: 1000,
  instructions: 5000,
  questions: 10,
  options: 10,
  label: 200,
  option: 100,
  answer: 1000,
  minParticipants: 1,
  maxParticipants: 1000,
  maxDays: 180,
  title: 120,
  body: 5000,
  steps: 2000,
  device: 120,
  reply: 2000,
  reason: 1000,
  files: 3,
  // Same as the server rule "max:2048" (kilobytes).
  fileBytes: 2048 * 1024
})
export const DEV_PAGE_SIZE = 15
export const PUBLIC_PAGE_SIZE = 12
export const TESTER_PAGE_SIZE = 15
export const LIST_PAGE_SIZE = 20

export const CAMPAIGN_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'closed'
]
export const PARTICIPANT_STATUSES = [
  'applied',
  'accepted',
  'rejected',
  'withdrawn',
  'removed'
]
export const FEEDBACK_TYPES = ['bug', 'suggestion', 'question', 'other']
export const FEEDBACK_STATUSES = ['new', 'acknowledged', 'fixed', 'wontfix']
export const QUESTION_TYPES = ['text', 'choice', 'rating']

const CAMPAIGN = {
  draft: 'Brouillon',
  pending: 'En validation',
  approved: 'Approuvée',
  rejected: 'Refusée',
  closed: 'Clôturée'
}
const CAMPAIGN_COLORS = {
  draft: 'grey-7',
  pending: 'orange-8',
  approved: 'positive',
  rejected: 'negative',
  closed: 'grey-7'
}
const PARTICIPANT = {
  applied: 'Candidature',
  accepted: 'Accepté',
  rejected: 'Refusé',
  withdrawn: 'Retiré',
  removed: 'Exclu'
}
const PARTICIPANT_COLORS = {
  applied: 'primary',
  accepted: 'positive',
  rejected: 'negative',
  withdrawn: 'grey-7',
  removed: 'negative'
}
const TYPE = {
  bug: 'Bug',
  suggestion: 'Suggestion',
  question: 'Question',
  other: 'Autre'
}
const FEEDBACK = {
  new: 'Nouveau',
  acknowledged: 'Pris en compte',
  fixed: 'Corrigé',
  wontfix: 'Ne sera pas corrigé'
}
const FEEDBACK_COLORS = {
  new: 'primary',
  acknowledged: 'orange-8',
  fixed: 'positive',
  wontfix: 'grey-7'
}
const QUESTION = {
  text: 'Texte libre',
  choice: 'Choix unique',
  rating: 'Note de 1 à 5'
}

const label = (map, value) => (map[value] ? ui(map[value]) : value || '—')
export const campaignStatusLabel = value => label(CAMPAIGN, value)
export const campaignStatusColor = value => CAMPAIGN_COLORS[value] || 'grey-7'
export const participantStatusLabel = value => label(PARTICIPANT, value)
export const participantStatusColor = value =>
  PARTICIPANT_COLORS[value] || 'grey-7'
export const feedbackTypeLabel = value => label(TYPE, value)
export const feedbackStatusLabel = value => label(FEEDBACK, value)
export const feedbackStatusColor = value => FEEDBACK_COLORS[value] || 'grey-7'
export const questionTypeLabel = value => label(QUESTION, value)

const options = (values, fn) =>
  values.map(value => ({ value, label: fn(value) }))
export const campaignStatusOptions = () =>
  options(CAMPAIGN_STATUSES, campaignStatusLabel)
export const participantStatusOptions = () =>
  options(PARTICIPANT_STATUSES, participantStatusLabel)
export const feedbackTypeOptions = () =>
  options(FEEDBACK_TYPES, feedbackTypeLabel)
export const feedbackStatusOptions = () =>
  options(FEEDBACK_STATUSES, feedbackStatusLabel)
export const questionTypeOptions = () =>
  options(QUESTION_TYPES, questionTypeLabel)

// Keyed plural messages ("1 place restante" / "3 places restantes").
export const betaPlural = (key, n) =>
  i18n.global.t(
    `beta.${key}`,
    { n: (Number(n) || 0).toLocaleString(currentLocale()) },
    Number(n) || 0
  )
export const spotsLabel = n => betaPlural('spots', Math.max(0, Number(n) || 0))

// Calendar day "YYYY-MM-DD" at the start of a value, read as a local date: the day the
// developer picked never shifts with the visitor's time zone.
const DAY = /^(\d{4})-(\d{2})-(\d{2})/
function localDay(value) {
  const match = DAY.exec(String(value || ''))
  if (!match) return null
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  )
  return Number.isNaN(date.getTime()) ? null : date
}
function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? localDay(value) : date
}

/** Day only: the calendar day as stored. With time: the moment, in local time. */
export function betaDate(value, withTime = false) {
  const date = withTime ? toDate(value) : localDay(value) || toDate(value)
  if (!date) return ''
  return date.toLocaleDateString(currentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  })
}

// The test starts later (start day after today).
export function startsLater(value, now = new Date()) {
  const start = localDay(value)
  if (!start) return false
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return start > today
}
// The test is over (end day before today).
export function hasEnded(value, now = new Date()) {
  const end = localDay(value)
  if (!end) return false
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return end < today
}

// "12 oct. 2026 → 30 nov. 2026"; one side only when the other is missing.
export function dateRange(start, end) {
  const from = betaDate(start),
    to = betaDate(end)
  if (from && to) return ui('Du {from} au {to}', { from, to })
  if (from) return ui('À partir du {from}', { from })
  if (to) return ui('Jusqu’au {to}', { to })
  return ''
}

// "Tous les pays" for an empty list; names when known, codes otherwise.
export function countriesLabel(codes, countries = []) {
  if (!Array.isArray(codes) || !codes.length) return ui('Tous les pays')
  const english = currentLocale() === 'en'
  return codes
    .map(code => {
      const country = countries.find(
        item => String(item.code).toUpperCase() === String(code).toUpperCase()
      )
      return country
        ? (english && country.name_en) || country.name || code
        : code
    })
    .join(', ')
}

export function isHttpsUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' && !!url.hostname
  } catch {
    return false
  }
}

// The application page is linked only when it is public (listed with a category).
export const appIsPublic = app =>
  !!(app?.id && (app.public_url || app.category))

// Public "Participer" state from my_participation.
export function participationState(campaign) {
  const mine = campaign?.my_participation
  if (mine && mine.status !== 'withdrawn') return mine.status
  if (!campaign?.open) return 'closed'
  if (campaign.spots_left !== null && campaign.spots_left !== undefined)
    if (Number(campaign.spots_left) <= 0) return 'full'
  if (mine) return 'reapply'
  // Applications are open before the start: the test itself opens on starts_at.
  return startsLater(campaign.starts_at) ? 'upcoming' : 'open'
}
export const canApply = campaign =>
  ['open', 'upcoming', 'reapply'].includes(participationState(campaign))
export const opensOnLabel = campaign =>
  ui('Ouvre le {date}', { date: betaDate(campaign?.starts_at) })

/** Why an accepted tester has no access, from the campaign state. */
export function accessPausedReason(campaign, now = new Date()) {
  if (campaign?.status === 'pending')
    return ui(
      'Campagne en cours de revalidation : l’accès à la version bêta est suspendu jusqu’à la nouvelle validation.'
    )
  if (campaign?.status === 'rejected')
    return ui('Campagne suspendue par la modération.')
  if (campaign?.status === 'closed' || hasEnded(campaign?.ends_at, now))
    return ui(
      'Le test est terminé : la version bêta et l’envoi de retours ne sont plus disponibles.'
    )
  if (startsLater(campaign?.starts_at, now))
    return ui('Le test commence le {date}.', {
      date: betaDate(campaign.starts_at)
    })
  return ui(
    'L’accès à la version bêta est momentanément indisponible. Réessayez plus tard.'
  )
}

/** Short plain-text summary of sanitized rich text (no markup is ever rendered). */
export function richTextSummary(html, max = 220) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(
    `<!doctype html><body>${String(html).replace(/<(br|\/p|\/div|\/li)\b[^>]*>/gi, ' $&')}</body>`,
    'text/html'
  )
  doc.body
    .querySelectorAll('script, style, template, noscript')
    .forEach(node => node.remove())
  const text = (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

// ---------- Application answers ----------

const emptyAnswer = value =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && !value.trim())

/** Ids of the required questions without an answer. */
export function missingAnswers(questions = [], answers = {}) {
  return questions
    .filter(question => question.required && emptyAnswer(answers[question.id]))
    .map(question => question.id)
}

/** { [questionId]: value } with only the answered questions (ratings as numbers). */
export function answersPayload(questions = [], answers = {}) {
  const payload = {}
  for (const question of questions) {
    const value = answers[question.id]
    if (emptyAnswer(value)) continue
    if (question.type === 'rating') payload[question.id] = Number(value)
    else if (question.type === 'choice') payload[question.id] = String(value)
    else
      payload[question.id] = String(value).trim().slice(0, BETA_LIMITS.answer)
  }
  return payload
}

export function applyPayload(questions, answers, { acceptTerms, shareName }) {
  return {
    accept_terms: acceptTerms === true,
    answers: answersPayload(questions, answers),
    share_name: shareName === true
  }
}

// Readable answer value (developer side).
export function answerText(answer) {
  const value = answer?.value
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

// ---------- Campaign form (developer) ----------

let questionKey = 0
// New questions get a unique client id (q_<random>), kept by the API.
const questionId = () =>
  `q_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
export function newQuestion(type = 'text') {
  return {
    key: `k${++questionKey}`,
    id: questionId(),
    label: '',
    type,
    options: type === 'choice' ? ['', ''] : [],
    required: false
  }
}

const day = value => (value ? String(value).slice(0, 10) : '')

export function campaignForm(detail = null) {
  return {
    application_id: detail?.application?.id ?? detail?.application_id ?? null,
    name: detail?.name || '',
    description: detail?.description || '',
    objectives: detail?.objectives || '',
    eligibility: detail?.eligibility || '',
    instructions: detail?.instructions || '',
    beta_url: detail?.beta_url || '',
    countries: Array.isArray(detail?.countries) ? [...detail.countries] : [],
    max_participants: detail?.max_participants ?? 50,
    starts_at: day(detail?.starts_at),
    ends_at: day(detail?.ends_at),
    auto_accept: detail?.auto_accept === true,
    questions: (detail?.questions || []).map(question => ({
      ...newQuestion(question.type),
      id: question.id ?? null,
      label: question.label || '',
      options: Array.isArray(question.options) ? [...question.options] : [],
      required: question.required === true
    }))
  }
}

function questionPayload(question) {
  const payload = {
    label: String(question.label || '').trim(),
    type: question.type,
    required: question.required === true
  }
  if (question.id !== null && question.id !== undefined)
    payload.id = question.id
  if (question.type === 'choice')
    payload.options = (question.options || [])
      .map(option => String(option || '').trim())
      .filter(Boolean)
      .slice(0, BETA_LIMITS.options)
  return payload
}

// Dates go out as the start of the first day and the end of the last day.
const dayStart = value => (value ? `${value}T00:00:00` : null)
const dayEnd = value => (value ? `${value}T23:59:59` : null)

export function campaignPayload(form) {
  const text = value => String(value || '').trim()
  return {
    application_id: form.application_id,
    name: text(form.name),
    // Drafts may stay incomplete: empty fields are sent as null.
    description: text(form.description) || null,
    objectives: text(form.objectives) || null,
    eligibility: text(form.eligibility) || null,
    instructions: richTextLength(form.instructions) ? form.instructions : null,
    beta_url: text(form.beta_url) || null,
    countries: [...(form.countries || [])],
    max_participants: Number(form.max_participants),
    starts_at: dayStart(form.starts_at),
    ends_at: dayEnd(form.ends_at),
    auto_accept: form.auto_accept === true,
    questions: (form.questions || [])
      .slice(0, BETA_LIMITS.questions)
      .map(questionPayload)
  }
}

const daysBetween = (start, end) =>
  Math.round((localDay(end) - localDay(start)) / 86400000)

/**
 * { field: message } for what the API would refuse; empty when the form can be sent.
 * A draft only needs an application and a name (`complete: false`); submitting for review,
 * or editing a campaign already reviewed, needs every required field (`complete: true`).
 */
export function campaignProblems(form, { complete = true } = {}) {
  const problems = {}
  const text = value => String(value || '').trim()
  if (!form.application_id)
    problems.application_id = ui('Choisissez une application.')
  if (!text(form.name)) problems.name = ui('Indiquez un nom de campagne.')
  else if (text(form.name).length > BETA_LIMITS.name)
    problems.name = ui('{n} caractères au maximum.', { n: BETA_LIMITS.name })
  if (complete && !text(form.description))
    problems.description = ui('Décrivez ce que les testeurs vont essayer.')
  else if (text(form.description).length > BETA_LIMITS.description)
    problems.description = ui('{n} caractères au maximum.', {
      n: BETA_LIMITS.description
    })
  if (complete && !text(form.objectives))
    problems.objectives = ui('Indiquez ce que vous attendez des testeurs.')
  else if (text(form.objectives).length > BETA_LIMITS.objectives)
    problems.objectives = ui('{n} caractères au maximum.', {
      n: BETA_LIMITS.objectives
    })
  if (text(form.eligibility).length > BETA_LIMITS.eligibility)
    problems.eligibility = ui('{n} caractères au maximum.', {
      n: BETA_LIMITS.eligibility
    })
  if (richTextLength(form.instructions) > BETA_LIMITS.instructions)
    problems.instructions = ui('{n} caractères au maximum.', {
      n: BETA_LIMITS.instructions
    })
  if ((complete || text(form.beta_url)) && !isHttpsUrl(form.beta_url))
    problems.beta_url = ui(
      'Indiquez une adresse complète en https://, par exemple https://beta.exemple.com.'
    )
  const max = Number(form.max_participants)
  if (
    !Number.isInteger(max) ||
    max < BETA_LIMITS.minParticipants ||
    max > BETA_LIMITS.maxParticipants
  )
    problems.max_participants = ui('Entre {min} et {max} testeurs.', {
      min: BETA_LIMITS.minParticipants,
      max: BETA_LIMITS.maxParticipants
    })
  if (complete && !localDay(form.starts_at))
    problems.starts_at = ui('Choisissez une date de début.')
  if (complete && !localDay(form.ends_at))
    problems.ends_at = ui('Choisissez une date de fin.')
  else if (localDay(form.starts_at) && localDay(form.ends_at)) {
    // Last day 23:59:59 against first day 00:00:00: the end is after the start as long
    // as the last day is not before the first one.
    const days = daysBetween(form.starts_at, form.ends_at)
    if (days < 0) problems.ends_at = ui('La fin doit être après le début.')
    else if (days > BETA_LIMITS.maxDays)
      problems.ends_at = ui('{n} jours au maximum entre le début et la fin.', {
        n: BETA_LIMITS.maxDays
      })
  }
  const questions = form.questions || []
  if (questions.length > BETA_LIMITS.questions)
    problems.questions = ui('{n} questions au maximum.', {
      n: BETA_LIMITS.questions
    })
  questions.forEach((question, index) => {
    const name = ui('Question {n}', { n: index + 1 })
    const questionLabel = text(question.label)
    if (!questionLabel)
      problems[`question_${question.key}`] = ui(
        '{name} : indiquez l’intitulé.',
        {
          name
        }
      )
    else if (questionLabel.length > BETA_LIMITS.label)
      problems[`question_${question.key}`] = ui(
        '{name} : {n} caractères au maximum.',
        { name, n: BETA_LIMITS.label }
      )
    else if (question.type === 'choice') {
      const filled = (question.options || []).filter(option => text(option))
      const unique = new Set(
        filled.map(option => text(option).toLocaleLowerCase())
      )
      if (filled.some(option => text(option).length > BETA_LIMITS.option))
        problems[`question_${question.key}`] = ui(
          '{name} : {n} caractères au maximum par choix.',
          { name, n: BETA_LIMITS.option }
        )
      else if (unique.size !== filled.length)
        problems[`question_${question.key}`] = ui(
          '{name} : deux choix sont identiques.',
          { name }
        )
      else if (filled.length < 2)
        problems[`question_${question.key}`] = ui(
          '{name} : proposez au moins deux choix.',
          { name }
        )
      else if (filled.length > BETA_LIMITS.options)
        problems[`question_${question.key}`] = ui(
          '{name} : {n} choix au maximum.',
          { name, n: BETA_LIMITS.options }
        )
    }
  })
  return problems
}

// Fields reviewed by the PWA Store team: changing one sends an approved campaign back to
// review (and pauses the accepted testers' access). Dates, places and auto_accept do not.
export const REVIEWED_FIELDS = [
  'name',
  'description',
  'objectives',
  'eligibility',
  'countries',
  'questions',
  'beta_url',
  'instructions'
]

/** Reviewed fields whose value differs from the saved campaign. */
export function changedReviewedFields(detail, form) {
  if (!detail) return []
  const changes = campaignChanges(detail, form)
  return REVIEWED_FIELDS.filter(field => field in changes)
}

/** PATCH payload: only the fields that differ from the saved campaign. */
export function campaignChanges(detail, form) {
  const before = campaignPayload(campaignForm(detail)),
    after = campaignPayload(form)
  const changes = {}
  for (const [key, value] of Object.entries(after)) {
    if (key === 'application_id') continue
    const a = key === 'countries' ? [...before[key]].sort() : before[key]
    const b = key === 'countries' ? [...value].sort() : value
    if (JSON.stringify(a) !== JSON.stringify(b)) changes[key] = value
  }
  return changes
}

export const needsReapproval = (detail, form) =>
  detail?.status === 'approved' &&
  changedReviewedFields(detail, form).length > 0

// ---------- Tester feedback ----------

export const BETA_IMAGE_TYPES = Object.freeze({
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp'
})
export const BETA_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

function imageProblem(file) {
  const expected = BETA_IMAGE_TYPES[fileExtension(file?.name)]
  if (!expected || (file.type && file.type !== expected)) return 'type'
  if (!(file.size > 0)) return 'empty'
  if (file.size > BETA_LIMITS.fileBytes) return 'size'
  return null
}
const sameFile = (a, b) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/** Splits picked images into accepted and rejected (type, empty, size, duplicate, count). */
export function checkBetaImages(current = [], incoming = []) {
  const accepted = [],
    rejected = []
  for (const file of incoming) {
    const problem = imageProblem(file)
    if (problem) rejected.push({ file, reason: problem })
    else if ([...current, ...accepted].some(other => sameFile(other, file)))
      rejected.push({ file, reason: 'duplicate' })
    else if (current.length + accepted.length >= BETA_LIMITS.files)
      rejected.push({ file, reason: 'count' })
    else accepted.push(file)
  }
  return { accepted, rejected }
}

/** Short device line from a user agent, e.g. "Android 14 · Chrome 128". */
export function deviceSummary(userAgent = '') {
  const ua = String(userAgent || '')
  let system = ''
  let match
  if ((match = /Android ([\d.]+)/.exec(ua)))
    system = `Android ${match[1].split('.')[0]}`
  else if ((match = /(?:iPhone|iPad|iPod).*? OS (\d+)/.exec(ua)))
    system = `iOS ${match[1]}`
  else if ((match = /Windows NT ([\d.]+)/.exec(ua)))
    system = match[1] === '10.0' ? 'Windows 10/11' : `Windows NT ${match[1]}`
  else if (/Mac OS X/.test(ua)) system = 'macOS'
  else if (/CrOS/.test(ua)) system = 'ChromeOS'
  else if (/Linux/.test(ua)) system = 'Linux'
  let browser = ''
  if ((match = /Edg\/(\d+)/.exec(ua))) browser = `Edge ${match[1]}`
  else if ((match = /OPR\/(\d+)/.exec(ua))) browser = `Opera ${match[1]}`
  else if ((match = /SamsungBrowser\/(\d+)/.exec(ua)))
    browser = `Samsung Internet ${match[1]}`
  else if ((match = /Firefox\/(\d+)/.exec(ua))) browser = `Firefox ${match[1]}`
  else if ((match = /(?:Chrome|CriOS)\/(\d+)/.exec(ua)))
    browser = `Chrome ${match[1]}`
  else if ((match = /Version\/(\d+).*Safari/.exec(ua)))
    browser = `Safari ${match[1]}`
  return [system, browser]
    .filter(Boolean)
    .join(' · ')
    .slice(0, BETA_LIMITS.device)
}

/** Problems of the tester feedback form (files are checked when picked). */
export function feedbackProblems(form) {
  const problems = {}
  const title = String(form.title || '').trim()
  if (!FEEDBACK_TYPES.includes(form.type))
    problems.type = ui('Choisissez un type de retour.')
  if (title.length < 3) problems.title = ui('Indiquez un titre.')
  else if (title.length > BETA_LIMITS.title)
    problems.title = ui('{n} caractères au maximum.', { n: BETA_LIMITS.title })
  const length = richTextLength(form.body)
  if (length < 3) problems.body = ui('Décrivez votre retour en quelques mots.')
  else if (length > BETA_LIMITS.body)
    problems.body = ui('{n} caractères au maximum.', { n: BETA_LIMITS.body })
  if (String(form.steps || '').length > BETA_LIMITS.steps)
    problems.steps = ui('{n} caractères au maximum.', { n: BETA_LIMITS.steps })
  if (String(form.device || '').length > BETA_LIMITS.device)
    problems.device = ui('{n} caractères au maximum.', {
      n: BETA_LIMITS.device
    })
  return problems
}

export function feedbackFormData(form, files = []) {
  const data = new FormData()
  data.append('type', form.type)
  data.append('title', String(form.title || '').trim())
  data.append('body', form.body)
  const steps = String(form.steps || '').trim()
  if (steps) data.append('steps', steps)
  const device = String(form.device || '').trim()
  if (device) data.append('device', device)
  files
    .slice(0, BETA_LIMITS.files)
    .forEach(file => data.append('attachments[]', file))
  return data
}

// Attachments of a beta feedback in the shape SuggestionDetail expects.
export const attachmentView = attachments =>
  (attachments || []).map(file => ({
    ...file,
    is_image: file.is_image ?? String(file.mime || '').startsWith('image/')
  }))
