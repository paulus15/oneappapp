<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Aide') }}</span
      ><h1>{{ ui('Contact') }}</h1
      ><p>{{
        ui(
          'Une question, un signalement ou une demande concernant vos données ? Écrivez-nous ; la réponse arrivera à l’adresse indiquée.'
        )
      }}</p></header
    >
    <q-card flat bordered class="workspace-card contact-card">
      <q-form v-if="!sent" class="workspace-form" @submit="send">
        <q-input
          v-model="form.name"
          outlined
          :label="ui('Votre nom')"
          autocomplete="name"
          maxlength="120"
          :rules="[v => !!v?.trim() || ui('Indiquez votre nom')]"
        />
        <q-input
          v-model="form.email"
          outlined
          type="email"
          :label="ui('Votre e-mail')"
          autocomplete="email"
          :rules="[v => /.+@.+\..+/.test(v || '') || ui('E-mail invalide')]"
        />
        <q-select
          v-model="form.subject"
          outlined
          :options="subjects"
          :label="ui('Sujet')"
        />
        <q-input
          v-model="form.message"
          outlined
          type="textarea"
          autogrow
          :label="ui('Message')"
          maxlength="5000"
          counter
          :rules="[
            v => (v || '').trim().length >= 10 || ui('Dix caractères minimum')
          ]"
        />
        <!-- Honeypot: hidden from people, filled by naive bots. -->
        <input
          v-model="form.website"
          class="honeypot"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
        />
        <q-banner v-if="error" class="workspace-alert" role="alert">{{
          ui(error)
        }}</q-banner>
        <q-btn
          type="submit"
          color="primary"
          no-caps
          unelevated
          :label="ui('Envoyer')"
          :loading="busy"
        />
      </q-form>
      <div v-else role="status">
        <h2>{{ ui('Message envoyé') }}</h2>
        <p>{{ sent }}</p>
        <q-btn flat no-caps :label="ui('Retour à l’accueil')" to="/" />
      </div>
    </q-card>
    <AppFooter />
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { reactive, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { catalogApi } from '@/services/catalog'
import { apiMessage } from '@/services/account'

const auth = useAuthStore()
const subjects = [
  ui('Question'),
  ui('Développeur'),
  ui('Signalement'),
  ui('Données personnelles'),
  ui('Autre')
]
const form = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  get subject() {
    return ui('Question')
  },
  message: '',
  website: ''
})
const busy = ref(false),
  error = ref(''),
  sent = ref('')

async function send() {
  busy.value = true
  error.value = ''
  try {
    const payload = { ...form }
    if (!payload.website) delete payload.website
    sent.value = (await catalogApi.contact(payload)).data.message
  } catch (e) {
    error.value =
      e.response?.status === 429
        ? ui('Trop de messages envoyés. Réessayez dans quelques minutes.')
        : apiMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<style scoped>
.contact-card {
  max-width: 640px;
}
.honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  opacity: 0;
}
</style>
