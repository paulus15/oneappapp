<template>
  <q-page class="auth-page">
    <q-card flat class="auth-card">
      <q-card-section class="card-header">
        <span class="auth-eyebrow">Rejoindre la communauté</span>
        <h1 class="auth-title">Créez votre espace OneInstall</h1>
        <p class="auth-subtitle"
          >Un compte unique pour explorer ou publier sur toutes les
          plateformes.</p
        >
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="name"
            label="Nom complet"
            filled
            color="primary"
            required
            :rules="[val => (val && val.length > 0) || 'Nom requis']"
            ><template #prepend><q-icon name="person_outline" /></template
          ></q-input>

          <q-input
            v-model="email"
            type="email"
            label="Adresse Email"
            filled
            color="primary"
            required
            :rules="[val => (val && val.length > 0) || 'Email requis']"
            ><template #prepend><q-icon name="alternate_email" /></template
          ></q-input>

          <div class="account-type-title">Type de Compte</div>
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-radio
                v-model="role"
                val="user"
                label="Utilisateur"
                color="primary"
                class="full-width radio-box"
              />
            </div>
            <div class="col-6">
              <q-radio
                v-model="role"
                val="developer"
                label="Développeur"
                color="primary"
                class="full-width radio-box"
              />
            </div>
          </div>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Mot de passe"
            filled
            color="primary"
            required
            :rules="[val => (val && val.length >= 8) || 'Minimum 8 caractères']"
            ><template #prepend><q-icon name="lock_outline" /></template
          ></q-input>

          <q-input
            v-model="passwordConfirmation"
            :type="showPassword ? 'text' : 'password'"
            label="Confirmer le mot de passe"
            filled
            color="primary"
            required
            :rules="[
              val =>
                val === password || 'Les mots de passe ne correspondent pas'
            ]"
          >
            <template #prepend><q-icon name="verified_user" /></template>
            <template #append
              ><q-btn
                flat
                round
                dense
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                aria-label="Afficher ou masquer les mots de passe"
                @click="showPassword = !showPassword"
            /></template>
          </q-input>

          <div v-if="error" class="form-error" role="alert">
            {{ error }}
          </div>

          <div class="q-mt-md">
            <q-btn
              label="Créer mon compte"
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
          Vous avez déjà un compte ?
          <router-link to="/login" class="login-link">
            Connectez-vous
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

const name = ref('')
const email = ref('')
const role = ref('user')
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
      role.value
    )
    if (success) {
      router.push('/')
    }
  } catch (err) {
    error.value = authStore.error || "Erreur lors de l'inscription"
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
  width: min(460px, 100%);
  background: transparent;
}
.card-header {
  padding: 0 12px 16px;
}
.auth-eyebrow {
  display: inline-flex;
  margin-bottom: 8px;
  color: var(--primary);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.auth-title {
  margin: 0;
  color: var(--text);
  font-size: clamp(25px, 3vw, 34px);
  font-weight: 850;
  line-height: 1.08;
  letter-spacing: -0.045em;
}
.auth-subtitle {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}
.account-type-title {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
}
.radio-box {
  min-height: 44px;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  padding: 7px 10px;
  border-radius: 11px;
  color: var(--text);
  font-size: 12px;
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
.form-error {
  padding: 10px 12px;
  color: #ff6978;
  background: rgba(239, 91, 103, 0.1);
  border: 1px solid rgba(239, 91, 103, 0.2);
  border-radius: 10px;
  font-size: 10px;
}
.auth-card :deep(.q-field__label),
.auth-card :deep(.q-field__native) {
  color: var(--text);
}
.auth-card :deep(.q-field__prepend),
.auth-card :deep(.q-field__append) {
  color: var(--muted);
}
.footer-text {
  color: var(--muted);
  font-size: 11px;
}
.login-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
.login-link:hover {
  text-decoration: underline;
}
</style>
