<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">Ravi de vous revoir</span>
        <h1 class="auth-title">Connectez-vous</h1>
        <p class="auth-subtitle"
          >Retrouvez votre espace et vos applications sur PWA Store.</p
        >
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="auth-form">
          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            label="Adresse e-mail"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Email requis']"
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>

          <q-input
            v-model="password"
            autocomplete="current-password"
            :type="showPassword ? 'text' : 'password'"
            label="Mot de passe"
            filled
            dense
            hide-bottom-space
            color="primary"
            required
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Mot de passe requis']"
          >
            <template #prepend><q-icon name="lock_outline" /></template>
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

          <div class="form-options">
            <q-checkbox
              v-model="rememberMe"
              dense
              label="Rester connecté"
              color="primary"
            />
            <router-link to="/forgot-password" class="text-action"
              >Mot de passe oublié ?</router-link
            >
          </div>

          <div v-if="error" class="form-error" role="alert">
            {{ error }}
          </div>

          <div class="auth-submit">
            <q-btn
              label="Continuer"
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
          Pas encore de compte ?
          <router-link to="/register" class="register-link">
            Inscrivez-vous
          </router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
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
    error.value = authStore.error || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>
