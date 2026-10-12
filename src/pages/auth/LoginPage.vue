<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">{{ ui('Ravi de vous revoir') }}</span>
        <h1 class="auth-title">{{ ui('Connectez-vous') }}</h1>
        <p class="auth-subtitle">{{
          ui('Retrouvez votre espace et vos applications sur PWA Store.')
        }}</p>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="auth-form">
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
            lazy-rules
            :rules="[val => (val && val.length > 0) || ui('Email requis')]"
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>

          <q-input
            v-model="password"
            autocomplete="current-password"
            :type="showPassword ? 'text' : 'password'"
            :label="ui('Mot de passe')"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            lazy-rules
            :rules="[
              val => (val && val.length > 0) || ui('Mot de passe requis')
            ]"
          >
            <template #prepend><q-icon name="lock" /></template>
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

          <div class="form-options">
            <q-checkbox
              v-model="rememberMe"
              dense
              :label="ui('Rester connecté')"
              color="primary"
            />
            <router-link to="/forgot-password" class="text-action">{{
              ui('Mot de passe oublié ?')
            }}</router-link>
          </div>

          <div v-if="error" class="form-error" role="alert">
            {{ ui(error) }}
          </div>

          <div class="auth-submit">
            <q-btn
              :label="ui('Continuer')"
              type="submit"
              unelevated
              no-caps
              class="full-width submit-btn"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="card-footer">
        <div class="footer-text">
          {{ ui('Pas encore de compte ?') }}
          <router-link to="/register" class="register-link">
            {{ ui('Inscrivez-vous') }}
          </router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ui } from '@/i18n/text'

import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const success = await authStore.login(
      email.value,
      password.value,
      rememberMe.value
    )
    if (success?.requires_otp) {
      router.push({
        path: '/verify-email',
        query: { redirect: route.query.redirect }
      })
      return
    }
    if (success) {
      const redirect = route.query.redirect
      router.push(
        typeof redirect === 'string' &&
          redirect.startsWith('/') &&
          !redirect.startsWith('//') &&
          !redirect.includes('\\')
          ? redirect
          : '/account'
      )
    }
  } catch (err) {
    error.value = authStore.error || ui('Erreur de connexion')
  } finally {
    loading.value = false
  }
}
</script>
