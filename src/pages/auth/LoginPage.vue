<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">Ravi de vous revoir</span>
        <h1 class="auth-title">Connectez-vous à votre espace</h1>
        <p class="auth-subtitle"
          >Retrouvez vos applications, vos préférences et votre activité.</p
        >
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            label="Adresse e-mail"
            filled
            color="primary"
            required
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Email requis']"
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Mot de passe"
            filled
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
            <button type="button" class="text-action"
              >Mot de passe oublié ?</button
            >
          </div>

          <div v-if="error" class="form-error" role="alert">
            {{ error }}
          </div>

          <div class="q-mt-md">
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

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
    const success = await authStore.login(email.value, password.value)
    if (success) {
      router.push('/')
    }
  } catch (err) {
    error.value = authStore.error || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth-page {
  width: 100%;
  min-height: 0 !important;
  display: grid;
  place-items: center;
  color: var(--text);
}
.auth-card {
  width: min(430px, 100%);
  background: transparent;
}
.card-header {
  padding: 0 12px 18px;
}
.auth-eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.auth-title {
  max-width: 390px;
  margin: 0;
  color: var(--text);
  font-size: clamp(27px, 3vw, 36px);
  font-weight: 850;
  line-height: 1.08;
  letter-spacing: -0.045em;
}
.auth-subtitle {
  max-width: 390px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}
.auth-card :deep(.q-field__label),
.auth-card :deep(.q-field__native) {
  color: var(--text);
}
.auth-card :deep(.q-field__prepend),
.auth-card :deep(.q-field__append) {
  color: var(--muted);
}
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  color: var(--muted);
  font-size: 10px;
}
.text-action {
  padding: 4px 0;
  color: var(--primary);
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 10px;
  font-weight: 750;
}
.form-error {
  padding: 10px 12px;
  color: #ff6978;
  background: rgba(239, 91, 103, 0.1);
  border: 1px solid rgba(239, 91, 103, 0.2);
  border-radius: 10px;
  font-size: 10px;
  text-align: left;
}
.submit-btn {
  min-height: 44px;
  color: #fff;
  background: var(--primary);
  font-weight: 800;
  border-radius: 12px;
  box-shadow: 0 12px 26px color-mix(in srgb, var(--primary) 24%, transparent);
  font-size: 13px;
}
.card-footer {
  padding-top: 12px;
  text-align: center;
}
.footer-text {
  color: var(--muted);
  font-size: 10px;
}
.register-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
.register-link:hover {
  text-decoration: underline;
}
</style>
