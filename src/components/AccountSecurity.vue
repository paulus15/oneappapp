<template>
  <q-card flat bordered class="workspace-card">
    <h2>Sécurité du compte</h2>
    <p>{{
      auth.user?.two_factor_enabled
        ? 'La double authentification par e-mail est activée.'
        : 'La connexion utilise actuellement votre mot de passe.'
    }}</p>
    <q-form class="workspace-form" @submit="save">
      <q-checkbox
        v-model="enabled"
        label="Authentification à double facteurs"
      />
      <q-option-group v-model="channel" :options="channels" />
      <q-input
        v-model="password"
        label="Mot de passe actuel"
        type="password"
        autocomplete="current-password"
        outlined
        required
      />
      <p class="text-caption"
        >Un code envoyé à votre adresse actuelle confirmera toute activation ou
        désactivation. Les autres sessions seront déconnectées.</p
      >
      <q-banner v-if="error" class="workspace-alert" role="alert">{{
        error
      }}</q-banner>
      <q-btn
        type="submit"
        no-caps
        color="primary"
        label="Confirmer mon choix par e-mail"
        :loading="busy"
        :disable="!auth.user?.email_verified_at"
      />
    </q-form>
  </q-card>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
const auth = useAuthStore(),
  router = useRouter()
const enabled = ref(!!auth.user?.two_factor_enabled),
  channel = ref('email'),
  password = ref(''),
  busy = ref(false),
  error = ref('')
const channels = [
  { label: 'E-mail', value: 'email' },
  { label: 'SMS — prochainement', value: 'sms', disable: true },
  { label: 'WhatsApp — prochainement', value: 'whatsapp', disable: true }
]
async function save() {
  busy.value = true
  error.value = ''
  try {
    const { data } = await api.post('/account/two-factor', {
      enabled: enabled.value,
      channel: channel.value,
      current_password: password.value
    })
    password.value = ''
    auth.setChallenge(data)
    router.push('/verify-email')
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
