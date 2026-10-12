<template>
  <q-card flat bordered class="workspace-card">
    <h2>{{ ui('Sécurité du compte') }}</h2>
    <p>{{
      auth.user?.two_factor_enabled
        ? ui('La double authentification par e-mail est activée.')
        : ui('La connexion utilise actuellement votre mot de passe.')
    }}</p>
    <q-form class="workspace-form" @submit="saveTwoFactor">
      <q-checkbox
        v-model="enabled"
        :label="ui('Authentification à double facteurs')"
      />
      <q-option-group v-model="channel" :options="channels" />
      <q-input
        v-model="twoFactorPassword"
        :label="ui('Mot de passe actuel')"
        type="password"
        autocomplete="current-password"
        outlined
        required
      />
      <p class="text-caption">{{
        ui(
          'Un code envoyé à votre adresse actuelle confirmera toute activation ou désactivation. Les autres sessions seront déconnectées.'
        )
      }}</p>
      <q-btn
        type="submit"
        no-caps
        color="primary"
        :label="ui('Confirmer mon choix par e-mail')"
        :loading="busy === 'two-factor'"
        :disable="!auth.user?.email_verified_at"
      />
    </q-form>

    <q-separator class="q-my-lg" />
    <h3>{{ ui('Mot de passe') }}</h3>
    <q-form class="workspace-form" @submit="changePassword">
      <q-input
        v-model="passwordForm.current_password"
        :label="ui('Mot de passe actuel')"
        type="password"
        autocomplete="current-password"
        outlined
        required
      />
      <q-input
        v-model="passwordForm.password"
        :label="ui('Nouveau mot de passe')"
        type="password"
        autocomplete="new-password"
        outlined
        :rules="[v => (v && v.length >= 8) || ui('Huit caractères minimum')]"
      />
      <q-input
        v-model="passwordForm.password_confirmation"
        :label="ui('Confirmez le nouveau mot de passe')"
        type="password"
        autocomplete="new-password"
        outlined
        :rules="[
          v =>
            v === passwordForm.password ||
            ui('Les mots de passe ne correspondent pas')
        ]"
      />
      <q-btn
        type="submit"
        no-caps
        outline
        color="primary"
        :label="ui('Changer le mot de passe')"
        :loading="busy === 'password'"
      />
    </q-form>

    <q-separator class="q-my-lg" />
    <h3>{{ ui('Sessions actives') }}</h3>
    <q-list separator>
      <q-item v-for="session in sessions" :key="session.id">
        <q-item-section>
          <q-item-label lines="1">{{ session.name }}</q-item-label>
          <q-item-label caption
            >{{
              session.current
                ? ui('Cette session')
                : session.last_used_at
                  ? ui('Dernière activité le {p0}', {
                      p0: date(session.last_used_at)
                    })
                  : ui('Ouverte le {p0}', { p0: date(session.created_at) })
            }}
            ·
            {{
              session.expires_at
                ? ui('expire le {p0}', { p0: date(session.expires_at) })
                : ui('sans expiration')
            }}</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            no-caps
            color="negative"
            :label="session.current ? ui('Se déconnecter') : ui('Fermer')"
            :disable="!!busy"
            @click="revoke(session)"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-separator class="q-my-lg" />
    <h3>{{ ui('Désactiver le compte') }}</h3>
    <p class="text-caption">{{
      ui(
        'Votre compte sera fermé immédiatement. Ses données personnelles seront anonymisées après 30 jours ; vos avis resteront visibles sous un nom anonyme. Contactez le support pour le réactiver avant ce délai.'
      )
    }}</p>
    <q-btn
      no-caps
      outline
      color="negative"
      :label="ui('Désactiver mon compte')"
      :disable="!!busy || !auth.user?.email_verified_at"
      @click="deactivate"
    />

    <q-banner v-if="error" class="workspace-alert q-mt-md" role="alert">{{
      ui(error)
    }}</q-banner>
  </q-card>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { accountApi, apiMessage } from '@/services/account'
const auth = useAuthStore(),
  router = useRouter(),
  q = useQuasar()
const enabled = ref(!!auth.user?.two_factor_enabled),
  channel = ref('email'),
  twoFactorPassword = ref(''),
  busy = ref(''),
  error = ref(''),
  sessions = ref([])
const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: ''
})
const channels = [
  { label: 'E-mail', value: 'email' },
  {
    get label() {
      return ui('SMS — prochainement')
    },
    value: 'sms',
    disable: true
  },
  {
    get label() {
      return ui('WhatsApp — prochainement')
    },
    value: 'whatsapp',
    disable: true
  }
]
const date = value => new Date(value).toLocaleDateString(currentLocale())

async function run(name, action) {
  busy.value = name
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = ''
  }
}
async function loadSessions() {
  sessions.value = (await accountApi.sessions()).data
}
function saveTwoFactor() {
  return run('two-factor', async () => {
    const { data } = await accountApi.twoFactor({
      enabled: enabled.value,
      channel: channel.value,
      current_password: twoFactorPassword.value
    })
    twoFactorPassword.value = ''
    auth.setChallenge(data)
    router.push('/verify-email')
  })
}
function changePassword() {
  return run('password', async () => {
    const { data } = await accountApi.changePassword({ ...passwordForm })
    Object.assign(passwordForm, {
      current_password: '',
      password: '',
      password_confirmation: ''
    })
    q.notify({ type: 'positive', message: data.message })
    await loadSessions()
  })
}
function revoke(session) {
  return run('session', async () => {
    if (session.current) {
      await auth.logout()
      router.replace('/login')
      return
    }
    await accountApi.revokeSession(session.id)
    await loadSessions()
  })
}
function deactivate() {
  q.dialog({
    get title() {
      return ui('Désactiver votre compte ?')
    },
    get message() {
      return ui(
        'Saisissez votre mot de passe. Un code de confirmation vous sera envoyé par e-mail.'
      )
    },
    prompt: { model: '', type: 'password', isValid: v => v.length > 0 },
    cancel: true,
    persistent: true
  }).onOk(current_password =>
    run('deactivate', async () => {
      const { data } = await accountApi.deactivate({ current_password })
      auth.setChallenge(data)
      router.push('/verify-email')
    })
  )
}
onMounted(() => run('', loadSessions))
</script>
<style scoped>
h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px;
}
</style>
