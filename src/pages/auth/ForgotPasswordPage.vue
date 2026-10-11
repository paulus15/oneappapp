<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">Accès au compte</span>
        <h1 class="auth-title">{{
          step === 'email' ? 'Mot de passe oublié' : 'Nouveau mot de passe'
        }}</h1>
        <p class="auth-subtitle">{{
          step === 'email'
            ? 'Indiquez l’adresse de votre compte. Si elle est connue, vous recevrez un code à six chiffres.'
            : `Saisissez le code envoyé à ${auth.pendingChallenge?.destination || 'votre adresse'}, valable dix minutes, puis choisissez votre nouveau mot de passe.`
        }}</p>
      </q-card-section>

      <q-card-section>
        <q-form v-if="step === 'email'" class="auth-form" @submit="requestCode">
          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            label="Adresse e-mail"
            filled
            dense
            hide-bottom-space
            required
            autofocus
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>
          <div v-if="error" class="form-error" role="alert">{{ error }}</div>
          <div class="auth-submit">
            <q-btn
              label="Recevoir un code"
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
            label="Code reçu par e-mail"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            filled
            dense
            autofocus
            :rules="[v => /^\d{6}$/.test(v) || 'Saisissez les six chiffres']"
          />
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            label="Nouveau mot de passe"
            filled
            dense
            :rules="[v => (v && v.length >= 8) || 'Huit caractères minimum']"
          >
            <template #append>
              <q-btn
                flat
                round
                dense
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                :aria-label="
                  showPassword
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                "
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-input
            v-model="confirmation"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            label="Confirmez le mot de passe"
            filled
            dense
            :rules="[
              v => v === password || 'Les mots de passe ne correspondent pas'
            ]"
          />
          <div v-if="error" class="form-error" role="alert">{{ error }}</div>
          <p v-if="notice" role="status" class="text-caption">{{ notice }}</p>
          <div class="auth-submit">
            <q-btn
              label="Changer mon mot de passe"
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
              remaining ? `Renvoyer dans ${remaining} s` : 'Renvoyer le code'
            "
            :disable="busy || remaining > 0"
            @click="resend"
          />
          <q-btn flat no-caps label="Changer d’adresse" @click="restart" />
        </q-form>
      </q-card-section>

      <q-card-section class="card-footer">
        <div class="footer-text">
          Vous vous en souvenez ?
          <router-link to="/login" class="register-link"
            >Connectez-vous</router-link
          >
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
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
    q.notify({ type: 'positive', message: 'Mot de passe modifié.' })
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
