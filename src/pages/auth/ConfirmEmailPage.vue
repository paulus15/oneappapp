<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">{{ ui('Accès au compte') }}</span>
        <h1 class="auth-title">{{ ui('Confirmer votre nouvelle adresse') }}</h1>
        <p class="auth-subtitle">{{
          ui(
            'Le support PWA Store va remplacer l’adresse de votre compte par celle qui a reçu ce lien. Toutes vos sessions seront fermées.'
          )
        }}</p>
      </q-card-section>
      <q-card-section>
        <p v-if="!valid" class="form-error" role="alert">{{
          ui(
            'Ce lien est incomplet. Ouvrez-le directement depuis l’e-mail reçu.'
          )
        }}</p>
        <template v-else-if="done">
          <p role="status">{{ done }}</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="full-width"
            :label="ui('Se connecter')"
            to="/login"
          />
        </template>
        <template v-else>
          <div v-if="error" class="form-error" role="alert">{{ error }}</div>
          <!-- A button, not an automatic call: mail scanners that open links must not use it up. -->
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="full-width"
            :loading="busy"
            :label="ui('Confirmer cette adresse')"
            @click="confirm"
          />
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/boot/axios'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const challenge = String(route.query.challenge || '')
const token = String(route.query.token || '')
const valid = computed(() => !!challenge && token.length === 64)
const busy = ref(false),
  error = ref(''),
  done = ref('')

async function confirm() {
  busy.value = true
  error.value = ''
  try {
    const { data } = await api.post('/auth/email-change/confirm', {
      challenge,
      token
    })
    // Every session of the account was closed on the server.
    auth.clearSession()
    done.value = data.message
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
