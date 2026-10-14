<template>
  <!-- Light veil over the page: the form stays visible behind the running checks. -->
  <transition name="veil">
    <div
      v-if="open"
      class="url-check-veil"
      role="dialog"
      aria-modal="true"
      aria-labelledby="url-check-title"
    >
      <div class="url-check-card">
        <h2 id="url-check-title">{{
          ui('Vérification du lien de votre PWA')
        }}</h2>
        <p class="url-check-url">{{ url }}</p>
        <ol class="url-check-steps" aria-live="polite">
          <li
            v-for="(step, i) in steps"
            :key="step.key"
            :class="`is-${step.status}`"
          >
            <span class="step-mark" aria-hidden="true">
              <q-spinner v-if="step.status === 'running'" size="18px" />
              <q-icon v-else :name="ICONS[step.status]" />
            </span>
            <span class="step-copy">
              <strong>{{ LABELS[step.key]() }}</strong>
              <small v-if="step.message">{{ step.message }}</small>
            </span>
            <span class="sr-only"
              >{{ STATUS_TEXT[step.status]() }} {{ i + 1 }}</span
            >
          </li>
        </ol>
        <div v-if="failed" class="url-check-actions">
          <p role="alert">{{
            ui('Le lien n’a pas été enregistré. Corrigez-le puis réessayez.')
          }}</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="ui('Corriger le lien')"
            @click="close(false)"
          />
        </div>
      </div>
    </div>
  </transition>
</template>
<script setup>
import { computed, ref } from 'vue'
import { api } from '@/boot/axios'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'

// Same keys as App\Services\UrlPreflight::STEPS, plus the draft saving done by the caller.
const LABELS = {
  format: () => ui('Vérification du format du lien (HTTPS)'),
  domain: () => ui('Vérification du domaine'),
  https: () => ui('Vérification du certificat HTTPS et de l’accès à la page'),
  manifest: () => ui('Recherche du manifeste PWA'),
  save: () => ui('Enregistrement du brouillon')
}
const ICONS = {
  pending: 'radio_button_unchecked',
  waiting: 'hourglass_empty',
  pass: 'check_circle',
  warn: 'error_outline',
  fail: 'cancel',
  skipped: 'remove_circle_outline'
}
const STATUS_TEXT = {
  pending: () => ui('en attente'),
  waiting: () => ui('résultat en attente'),
  running: () => ui('en cours'),
  pass: () => ui('réussie'),
  warn: () => ui('à revoir'),
  fail: () => ui('échouée'),
  skipped: () => ui('non effectuée')
}
const KEYS = ['format', 'domain', 'https', 'manifest', 'save']
const STEP_DELAY = 900,
  REVEAL_DELAY = 260

const open = ref(false),
  url = ref(''),
  steps = ref([])
const failed = computed(() => steps.value.some(s => s.status === 'fail'))
let resolveRun = null

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const step = key => steps.value.find(s => s.key === key)

function close(result) {
  open.value = false
  resolveRun?.(result)
  resolveRun = null
}

/**
 * Shows each check while the API runs them, then their real results one by one.
 * `save` runs only when no blocking step failed. Resolves true once saved, false otherwise.
 */
async function run(address, save) {
  url.value = address
  steps.value = KEYS.map(key => ({ key, status: 'pending', message: '' }))
  open.value = true
  const done = new Promise(resolve => (resolveRun = resolve))

  // The checks run on the server in this order: show them advancing meanwhile.
  let active = 0
  step('format').status = 'running'
  // Only the current step spins; the previous ones wait for their real result.
  const ticker = setInterval(() => {
    if (active < 3) {
      step(KEYS[active]).status = 'waiting'
      active++
      step(KEYS[active]).status = 'running'
    }
  }, STEP_DELAY)

  let report
  try {
    report = (await api.post('/apps/url-preflight', { url: address })).data
  } catch (e) {
    report = {
      ok: false,
      steps: [{ key: 'format', status: 'fail', message: apiMessage(e) }]
    }
  }
  clearInterval(ticker)

  for (const result of report.steps) {
    const target = step(result.key)
    target.status = result.status
    target.message = result.message
    await wait(REVEAL_DELAY)
  }
  // A step the server never reached is shown as not done.
  steps.value
    .filter(
      s =>
        s.key !== 'save' && ['pending', 'running', 'waiting'].includes(s.status)
    )
    .forEach(s => (s.status = 'skipped'))
  if (!report.ok) {
    step('save').status = 'skipped'
    return done
  }

  step('save').status = 'running'
  try {
    await save()
    step('save').status = 'pass'
    await wait(500)
    close(true)
  } catch (e) {
    step('save').status = 'fail'
    step('save').message = apiMessage(e)
  }
  return done
}

defineExpose({ run })
</script>
<style scoped>
.url-check-veil {
  position: fixed;
  inset: 0;
  z-index: 6000;
  display: grid;
  place-items: center;
  padding: 16px;
  /* Light veil, no blur: the page stays readable behind the checks. */
  background: rgba(7, 26, 61, 0.22);
}
.url-check-card {
  width: min(480px, 100%);
  padding: 22px 22px 18px;
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  border: 1px solid var(--outline);
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(4, 18, 51, 0.28);
}
h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 750;
}
.url-check-url {
  margin: 4px 0 14px;
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.url-check-steps {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.url-check-steps li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  opacity: 0.55;
  transition: opacity 0.25s ease;
}
.url-check-steps li:not(.is-pending) {
  opacity: 1;
}
.step-mark {
  flex: none;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 20px;
}
.is-running .step-mark {
  color: var(--pwa-primary);
}
.is-pass .step-mark {
  color: var(--q-positive);
}
.is-warn .step-mark {
  color: var(--q-warning);
}
.is-fail .step-mark {
  color: var(--q-negative);
}
.step-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.step-copy strong {
  font-size: 14px;
  font-weight: 650;
}
.step-copy small {
  color: var(--muted);
  font-size: 12.5px;
}
.is-fail .step-copy small {
  color: var(--q-negative);
}
.url-check-actions {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}
.url-check-actions p {
  margin: 0;
  font-size: 13px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.veil-enter-active,
.veil-leave-active {
  transition: opacity 0.2s ease;
}
.veil-enter-from,
.veil-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .veil-enter-active,
  .veil-leave-active,
  .url-check-steps li {
    transition: none;
  }
}
</style>
