<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">{{ ui('Rejoindre la communauté') }}</span>
        <h1 class="auth-title">{{ ui('Créez votre compte') }}</h1>
        <p class="auth-subtitle">{{
          ui(
            'Un compte unique pour explorer ou publier sur toutes les plateformes.'
          )
        }}</p>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="auth-form">
          <q-input
            v-model="name"
            autocomplete="name"
            :label="ui('Nom complet')"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            :rules="[val => (val && val.length > 0) || ui('Nom requis')]"
            ><template #prepend><q-icon name="person_outline" /></template
          ></q-input>

          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            :label="ui('Adresse e-mail')"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            :rules="[val => (val && val.length > 0) || ui('Email requis')]"
            ><template #prepend><q-icon name="alternate_email" /></template
          ></q-input>

          <q-input
            v-model="password"
            autocomplete="new-password"
            :type="showPassword ? 'text' : 'password'"
            :label="ui('Mot de passe')"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            :rules="[
              val => (val && val.length >= 8) || ui('Minimum 8 caractères')
            ]"
            ><template #prepend><q-icon name="lock" /></template
          ></q-input>

          <q-input
            v-model="passwordConfirmation"
            autocomplete="new-password"
            :type="showPassword ? 'text' : 'password'"
            :label="ui('Confirmer le mot de passe')"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            :rules="[
              val =>
                val === password || ui('Les mots de passe ne correspondent pas')
            ]"
          >
            <template #prepend><q-icon name="verified_user" /></template>
            <template #append
              ><q-btn
                flat
                round
                dense
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                :aria-label="ui('Afficher ou masquer les mots de passe')"
                @click="showPassword = !showPassword"
            /></template>
          </q-input>

          <CountrySelect v-model="countryId" required />
          <q-checkbox
            v-model="twoFactorEnabled"
            :label="ui('Authentification à double facteurs par e-mail')"
          />
          <p class="text-caption">{{
            ui(
              'Un code envoyé par e-mail confirmera votre inscription. Si vous activez la double authentification, un code sera également demandé à chaque connexion.'
            )
          }}</p>
          <div v-if="error" class="form-error" role="alert">
            {{ ui(error) }}
          </div>

          <div class="auth-submit">
            <q-btn
              :label="ui('Créer mon compte')"
              type="submit"
              unelevated
              no-caps
              class="full-width submit-btn"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none card-footer">
        <div class="footer-text">
          {{ ui('Vous avez déjà un compte ?') }}
          <router-link to="/login" class="login-link">
            {{ ui('Connectez-vous') }}
          </router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ui } from '@/i18n/text'

import { ref } from 'vue'
import CountrySelect from '@/components/CountrySelect.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const countryId = ref(null)
const twoFactorEnabled = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const success = await authStore.register(
      name.value,
      email.value,
      password.value,
      passwordConfirmation.value,
      countryId.value,
      twoFactorEnabled.value
    )
    if (success) {
      router.push({
        path: '/verify-email',
        query: { redirect: route.query.redirect }
      })
    }
  } catch (err) {
    error.value = authStore.error || ui("Erreur lors de l'inscription")
  } finally {
    loading.value = false
  }
}
</script>
