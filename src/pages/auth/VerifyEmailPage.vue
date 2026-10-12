<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">{{ ui('Confirmation par e-mail') }}</span>
        <h1 class="auth-title">{{ title }}</h1>
        <p v-if="auth.pendingChallenge" class="auth-subtitle"
          >{{ ui('Saisissez le code à six chiffres envoyé à') }}
          {{ auth.pendingChallenge.destination
          }}{{ ui('. Il est valable dix minutes.') }}</p
        >
      </q-card-section>
      <q-card-section v-if="auth.pendingChallenge">
        <q-banner
          v-if="auth.pendingChallenge.code_sent === false"
          class="workspace-alert"
          >{{ auth.pendingChallenge.message }}</q-banner
        >
        <q-form class="auth-form" @submit="verify">
          <q-input
            v-model="code"
            :label="ui('Code de confirmation')"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            outlined
            autofocus
            :rules="[
              v => /^\d{6}$/.test(v) || ui('Saisissez les six chiffres du code')
            ]"
          />
          <div v-if="error" class="form-error" role="alert">{{
            ui(error)
          }}</div>
          <q-btn
            type="submit"
            no-caps
            :label="ui('Confirmer le code')"
            class="submit-btn"
            unelevated
            :loading="busy"
          />
          <p v-if="confirmed" class="confirmed" role="status">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
            {{ ui('Code confirmé') }}
          </p>
          <q-btn
            flat
            no-caps
            :label="
              remaining
                ? ui('Renvoyer dans {p0} s', { p0: remaining })
                : ui('Renvoyer le code')
            "
            :disable="busy || remaining > 0"
            @click="resend"
          />
        </q-form>
        <p v-if="notice" role="status" class="text-caption">{{ notice }}</p>
        <q-btn flat no-caps :label="ui('Recommencer')" @click="restart" />
      </q-card-section>
      <q-card-section v-else>
        <p>{{ ui('Connectez-vous pour recevoir un nouveau code.') }}</p>
        <q-btn
          to="/login"
          :label="ui('Se connecter')"
          color="primary"
          no-caps
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMessage } from '@/services/account'
import { useQuasar } from 'quasar'
import { prefersReducedMotion } from '@/motion/signature'
const auth = useAuthStore(),
  router = useRouter(),
  route = useRoute(),
  q = useQuasar()
// A password reset needs the new password, collected on its own page.
if (auth.pendingChallenge?.purpose === 'password_reset')
  router.replace('/forgot-password')
const code = ref(''),
  error = ref(''),
  busy = ref(false),
  notice = ref(''),
  confirmed = ref(false),
  remaining = ref(auth.pendingChallenge?.retry_after || 0)
const timer = setInterval(() => {
  if (remaining.value > 0) remaining.value--
}, 1000)
onBeforeUnmount(() => clearInterval(timer))
const title = computed(
  () =>
    ({
      get login() {
        return ui('Confirmez la connexion')
      },
      get two_factor() {
        return ui('Confirmez votre choix')
      },
      get authorize_email_change() {
        return ui('Confirmez le changement')
      },
      get verify_email_change() {
        return ui('Confirmez le nouvel e-mail')
      },
      get deactivate_account() {
        return ui('Confirmez la désactivation')
      }
    })[auth.pendingChallenge?.purpose] || ui('Confirmez votre e-mail')
)
async function verify() {
  busy.value = true
  error.value = ''
  try {
    const data = await auth.verifyOtp(code.value)
    code.value = ''
    if (data.deactivated) {
      q.notify({ type: 'info', message: data.message })
      router.replace('/')
      return
    }
    if (data.requires_otp) {
      remaining.value = data.retry_after
      notice.value = ui(
        'Un nouveau code confirme maintenant votre nouvelle adresse e-mail.'
      )
      return
    }
    // A short confirmation stroke before leaving (skipped with reduced motion).
    confirmed.value = true
    if (!prefersReducedMotion()) await new Promise(r => setTimeout(r, 450))
    const target = route.query.redirect
    router.replace(
      typeof target === 'string' &&
        target.startsWith('/') &&
        !target.startsWith('//') &&
        !target.includes('\\')
        ? target
        : '/account'
    )
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function resend() {
  busy.value = true
  error.value = ''
  try {
    const data = await auth.resendOtp()
    remaining.value = data.retry_after
    notice.value = data.message
    code.value = ''
  } catch (e) {
    error.value = apiMessage(e)
    if (e.response?.status === 429) remaining.value = 60
  } finally {
    busy.value = false
  }
}
function restart() {
  auth.setChallenge(null)
  router.replace(auth.isAuthenticated ? '/account' : '/login')
}
</script>
<style scoped>
.confirmed {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--q-positive);
  font-weight: 700;
}
.confirmed svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.confirmed path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: pwa-draw var(--motion-base) var(--motion-settle) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .confirmed path {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
