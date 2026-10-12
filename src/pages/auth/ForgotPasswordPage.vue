<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">{{ ui('Accès au compte') }}</span>
        <h1 class="auth-title">{{
          step === 'email'
            ? ui('Mot de passe oublié')
            : ui('Nouveau mot de passe')
        }}</h1>
        <p class="auth-subtitle">{{
          step === 'email'
            ? ui(
                'Indiquez l’adresse de votre compte. Si elle est connue, vous recevrez un code à six chiffres.'
              )
            : ui(
                'Saisissez le code envoyé à {p0}, valable dix minutes, puis choisissez votre nouveau mot de passe.',
                { p0: auth.pendingChallenge?.destination || 'votre adresse' }
              )
        }}</p>
      </q-card-section>

      <q-card-section>
        <q-form v-if="step === 'email'" class="auth-form" @submit="requestCode">
          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            :label="ui('Adresse e-mail')"
            filled
            dense
            hide-bottom-space
            required
            autofocus
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>
          <div v-if="error" class="form-error" role="alert">{{
            ui(error)
          }}</div>
          <div class="auth-submit">
            <q-btn
              :label="ui('Recevoir un code')"
              type="submit"
              unelevated
              no-caps
              class="full-width submit-btn"
              :loading="busy"
            />
          </div>
        </q-form>

        <q-form v-else class="auth-form" @submit="reset">
          <q-input
            v-model="code"
            :label="ui('Code reçu par e-mail')"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            filled
            dense
            autofocus
            :rules="[
              v => /^\d{6}$/.test(v) || ui('Saisissez les six chiffres')
            ]"
          />
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :label="ui('Nouveau mot de passe')"
            filled
            dense
            :rules="[
              v => (v && v.length >= 8) || ui('Huit caractères minimum')
            ]"
          >
            <template #append>
              <q-btn
                flat
                round
                dense
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                :aria-label="
                  showPassword
                    ? ui('Masquer le mot de passe')
                    : ui('Afficher le mot de passe')
                "
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-input
            v-model="confirmation"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :label="ui('Confirmez le mot de passe')"
            filled
            dense
            :rules="[
              v =>
                v === password || ui('Les mots de passe ne correspondent pas')
            ]"
          />
          <div v-if="error" class="form-error" role="alert">{{
            ui(error)
          }}</div>
          <p v-if="notice" role="status" class="text-caption">{{ notice }}</p>
          <div class="auth-submit">
            <q-btn
              :label="ui('Changer mon mot de passe')"
              type="submit"
              unelevated
              no-caps
              class="full-width submit-btn"
              :loading="busy"
            />
          </div>
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
          <q-btn
            flat
            no-caps
            :label="ui('Changer d’adresse')"
            @click="restart"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="card-footer">
        <div class="footer-text">
          {{ ui('Vous vous en souvenez ?') }}
          <router-link to="/login" class="register-link">{{
            ui('Connectez-vous')
          }}</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ui } from '@/i18n/text'

import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { apiMessage } from '@/services/account'

const auth = useAuthStore(),
  router = useRouter(),
  q = useQuasar()
const step = ref(
  auth.pendingChallenge?.purpose === 'password_reset' ? 'code' : 'email'
)
const email = ref(''),
  code = ref(''),
  password = ref(''),
  confirmation = ref(''),
  showPassword = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  remaining = ref(0)
const timer = setInterval(() => {
  if (remaining.value > 0) remaining.value--
}, 1000)
onBeforeUnmount(() => clearInterval(timer))

async function run(action) {
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
function requestCode() {
  return run(async () => {
    const data = await auth.forgotPassword(email.value)
    remaining.value = data.retry_after
    step.value = 'code'
  })
}
function resend() {
  return run(async () => {
    const data = await auth.resendOtp()
    remaining.value = data.retry_after
    notice.value = data.message
  })
}
function reset() {
  return run(async () => {
    await auth.resetPassword(code.value, password.value, confirmation.value)
    q.notify({
      type: 'positive',
      get message() {
        return ui('Mot de passe modifié.')
      }
    })
    router.replace('/account')
  })
}
function restart() {
  auth.setChallenge(null)
  step.value = 'email'
  code.value = ''
  error.value = ''
}
</script>
