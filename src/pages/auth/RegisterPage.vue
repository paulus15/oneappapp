<template>
  <q-page class="flex flex-center auth-page">
    <q-card class="glass-panel auth-card">
      <q-card-section class="text-center card-header">
        <q-avatar size="52px" class="brand-avatar">
          <q-icon name="person_add" />
        </q-avatar>
        <h1 class="auth-title">Rejoindre OneApp</h1>
        <p class="auth-subtitle">Créez votre compte développeur ou utilisateur</p>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="name"
            label="Nom complet"
            label-color="indigo-300"
            color="indigo-500"
            filled
            dark
            required
            :rules="[val => (val && val.length > 0) || 'Nom requis']"
          />

          <q-input
            v-model="email"
            type="email"
            label="Adresse Email"
            label-color="indigo-300"
            color="indigo-500"
            filled
            dark
            required
            :rules="[val => (val && val.length > 0) || 'Email requis']"
          />

          <div class="account-type-title">Type de Compte</div>
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-radio
                v-model="role"
                val="user"
                label="Utilisateur"
                dark
                color="indigo"
                class="full-width radio-box"
              />
            </div>
            <div class="col-6">
              <q-radio
                v-model="role"
                val="developer"
                label="Développeur"
                dark
                color="indigo"
                class="full-width radio-box"
              />
            </div>
          </div>

          <q-input
            v-model="password"
            type="password"
            label="Mot de passe"
            label-color="indigo-300"
            color="indigo-500"
            filled
            dark
            required
            :rules="[val => (val && val.length >= 8) || 'Minimum 8 caractères']"
          />

          <q-input
            v-model="passwordConfirmation"
            type="password"
            label="Confirmer le mot de passe"
            label-color="indigo-300"
            color="indigo-500"
            filled
            dark
            required
            :rules="[
              val =>
                val === password || 'Les mots de passe ne correspondent pas'
            ]"
          />

          <div
            v-if="error"
            class="text-red-400 text-center text-caption q-my-sm"
          >
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
  background: var(--page);
  color: var(--text);
}
.auth-card {
  width: 380px;
  max-width: 90vw;
  padding: 12px;
  border-radius: 12px;
  background: var(--glass);
  border: 1px solid var(--outline);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 30px rgba(4, 9, 25, 0.08);
}
.brand-avatar {
  background: var(--surface-highest);
  color: var(--primary);
  margin-bottom: 12px;
}
.brand-avatar .q-icon {
  font-size: 24px;
}
.auth-title {
  margin: 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 800;
}
.auth-subtitle {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 11px;
}
.account-type-title {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
}
.radio-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--text);
  font-size: 12px;
}
.submit-btn {
  background: var(--text);
  color: var(--page);
  font-weight: 800;
  border-radius: 8px;
  min-height: 38px;
  font-size: 12px;
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
