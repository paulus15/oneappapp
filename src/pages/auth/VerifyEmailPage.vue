<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">Confirmation par e-mail</span>
        <h1 class="auth-title">{{ title }}</h1>
        <p v-if="auth.pendingChallenge" class="auth-subtitle">Saisissez le code à six chiffres envoyé à {{ auth.pendingChallenge.destination }}. Il est valable dix minutes.</p>
      </q-card-section>
      <q-card-section v-if="auth.pendingChallenge">
        <q-banner v-if="auth.pendingChallenge.code_sent === false" class="workspace-alert">{{ auth.pendingChallenge.message }}</q-banner>
        <q-form class="auth-form" @submit="verify">
          <q-input v-model="code" label="Code de confirmation" inputmode="numeric" autocomplete="one-time-code" maxlength="6" outlined autofocus :rules="[v => /^\d{6}$/.test(v) || 'Saisissez les six chiffres du code']" />
          <div v-if="error" class="form-error" role="alert">{{ error }}</div>
          <q-btn type="submit" no-caps label="Confirmer le code" class="submit-btn" unelevated :loading="busy" />
          <q-btn flat no-caps :label="remaining ? `Renvoyer dans ${remaining} s` : 'Renvoyer le code'" :disable="busy || remaining > 0" @click="resend" />
        </q-form>
        <p v-if="notice" role="status" class="text-caption">{{ notice }}</p>
        <q-btn flat no-caps label="Recommencer" @click="restart" />
      </q-card-section>
      <q-card-section v-else>
        <p>Connectez-vous pour recevoir un nouveau code.</p>
        <q-btn to="/login" label="Se connecter" color="primary" no-caps />
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMessage } from '@/services/account'
const auth = useAuthStore(), router = useRouter(), route = useRoute()
const code = ref(''), error = ref(''), busy = ref(false), notice = ref(''), remaining = ref(auth.pendingChallenge?.retry_after || 0)
const timer = setInterval(() => { if (remaining.value > 0) remaining.value-- }, 1000)
onBeforeUnmount(() => clearInterval(timer))
const title = computed(() => ({ login: 'Confirmez la connexion', two_factor: 'Confirmez votre choix', authorize_email_change: 'Confirmez le changement', verify_email_change: 'Confirmez le nouvel e-mail' })[auth.pendingChallenge?.purpose] || 'Confirmez votre e-mail')
async function verify() {
  busy.value = true; error.value = ''
  try {
    const data = await auth.verifyOtp(code.value)
    code.value = ''
    if (data.requires_otp) { remaining.value = data.retry_after; notice.value = 'Un nouveau code confirme maintenant votre nouvelle adresse e-mail.'; return }
    const target = route.query.redirect
    router.replace(typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') ? target : '/account')
  } catch(e) { error.value = apiMessage(e) } finally { busy.value = false }
}
async function resend() {
  busy.value = true; error.value = ''
  try { const data = await auth.resendOtp(); remaining.value = data.retry_after; notice.value = data.message; code.value = '' }
  catch(e) { error.value = apiMessage(e); if (e.response?.status === 429) remaining.value = 60 }
  finally { busy.value = false }
}
function restart() { auth.setChallenge(null); router.replace(auth.isAuthenticated ? '/account' : '/login') }
</script>
