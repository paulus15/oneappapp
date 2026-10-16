import { ui } from '@/i18n/text'

// AI assistant settings (GET/PUT /admin/ai/settings). The API key is write-only: the
// server only returns has_key and key_hint, and the typed key never leaves the page.
export const DAILY_QUOTA_MIN = 1
export const DAILY_QUOTA_MAX = 500

const blank = value =>
  value === '' || value === null || value === undefined ? null : value

export function aiForm(settings = {}) {
  return {
    model: settings.model ?? null,
    enabled: settings.enabled === true,
    daily_quota: settings.daily_quota ?? 50,
    monthly_token_budget: settings.monthly_token_budget ?? null
  }
}

const normalized = form => ({
  model: blank(form.model),
  enabled: form.enabled === true,
  daily_quota:
    blank(form.daily_quota) === null ? null : Number(form.daily_quota),
  monthly_token_budget:
    blank(form.monthly_token_budget) === null
      ? null
      : Number(form.monthly_token_budget)
})

// Only the changed fields, plus api_key when one was typed.
export function aiSettingsPayload(settings, form, apiKey = '') {
  const before = normalized(aiForm(settings))
  const after = normalized(form)
  const payload = {}
  for (const key of Object.keys(after))
    if (after[key] !== before[key]) payload[key] = after[key]
  const key = typeof apiKey === 'string' ? apiKey.trim() : ''
  if (key) payload.api_key = key
  return payload
}

export function dailyQuotaError(value) {
  const n = Number(value)
  return blank(value) !== null &&
    Number.isInteger(n) &&
    n >= DAILY_QUOTA_MIN &&
    n <= DAILY_QUOTA_MAX
    ? ''
    : ui('Entre {min} et {max} questions par jour.', {
        min: DAILY_QUOTA_MIN,
        max: DAILY_QUOTA_MAX
      })
}

export function budgetError(value) {
  if (blank(value) === null) return ''
  const n = Number(value)
  return Number.isInteger(n) && n >= 1000 && n <= 1000000000
    ? ''
    : ui(
        'Entre 1 000 et 1 000 000 000 jetons, ou vide pour ne pas fixer de plafond.'
      )
}

// Enabling needs a stored key and a chosen model (the API answers 422 otherwise).
export const canEnableAssistant = (settings, form) =>
  settings?.has_key === true &&
  modelOptions(settings).some(model => model.value === blank(form?.model))

export function keyHintText(hint) {
  if (!hint) return ''
  const text = String(hint)
  return text.startsWith('•') ? text : `••••${text}`
}

export const modelOptions = settings =>
  (Array.isArray(settings?.models) ? settings.models : []).map(model => ({
    value: model.id,
    label: model.label || model.id,
    description: model.description || ''
  }))
