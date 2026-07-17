<template>
  <q-page class="flex flex-center auth-page">
    <q-card class="glass-panel auth-card">
      <q-card-section class="text-center card-header">
        <q-avatar size="52px" class="brand-avatar">
          <q-icon name="lock" />
        </q-avatar>
        <h1 class="auth-title">Connexion OneApp</h1>
        <p class="auth-subtitle">Accédez à votre runtime universel</p>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            label="Adresse Email"
            label-color="indigo-300"
            color="indigo-500"
            filled
            dark
            required
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Email requis']"
          />

          <q-input
            v-model="password"
            type="password"
            label="Mot de passe"
            label-color="indigo-300"
            color="indigo-500"
            filled
            dark
            required
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Mot de passe requis']"
          />

          <div
            v-if="error"
            class="text-red-400 text-center text-caption q-my-sm"
          >
            {{ error }}
          </div>

          <div class="q-mt-md">
            <q-btn
              label="Se connecter"
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
  background: var(--page);
  color: var(--text);
}
.auth-card {
  width: 360px;
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
.register-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
.register-link:hover {
  text-decoration: underline;
}
</style>
