<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Votre compte unique</span
      ><h1>Mon espace PWA Store</h1
      ><p
        >Votre profil, vos favoris et vos applications, au même endroit.</p
      ></header
    >
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template
    ></q-banner>
    <q-linear-progress
      v-if="loading"
      indeterminate
      color="primary"
      aria-label="Chargement du compte"
    />
    <template v-if="auth.user && !loading">
      <q-banner v-if="!auth.user.email_verified_at" class="workspace-alert">
        Vérifiez votre adresse e-mail pour soumettre votre profil développeur.
        <template #action
          ><q-btn
            flat
            no-caps
            label="Renvoyer le lien"
            :loading="sending"
            @click="resend"
        /></template>
      </q-banner>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h2>Mon profil</h2>
          <q-form class="workspace-form" @submit="save">
            <q-input
              v-model="form.name"
              label="Nom complet"
              autocomplete="name"
              outlined
              required
              maxlength="255"
            />
            <q-input
              v-model="form.email"
              label="Adresse e-mail"
              type="email"
              autocomplete="email"
              outlined
              required
            />
            <q-toggle v-model="form.two_factor_enabled" label="Double authentification par e-mail" />
            <q-btn
              type="submit"
              no-caps
              color="primary"
              label="Enregistrer"
              :loading="saving"
            />
          </q-form>
        </q-card>
        <q-card v-if="!q.screen.lt.md" flat bordered class="workspace-card developer-invite"
          ><q-icon name="code" size="32px" color="primary" /><h2
            >Vous développez des applications ?</h2
          ><p
            >Devenez développeur sur PWA Store. Activez gratuitement votre
            espace avec ce compte.</p
          ><q-btn
            color="primary"
            no-caps
            :label="
              auth.isDeveloper
                ? 'Mon espace développeur'
                : 'Devenir développeur'
            "
            :to="
              auth.isDeveloper ? '/developer/profile' : '/developer/activate'
            "
        /></q-card>
      </div>
      <section v-if="auth.isDeveloper && !q.screen.lt.md" class="workspace-section">
        <h2>Activité développeur</h2>
        <p>Statut : {{ auth.user.developer_profile?.status || 'À compléter' }}</p>
        <q-btn no-caps color="primary" to="/developer" label="Ouvrir le tableau de bord développeur" />
      </section>
      <section class="workspace-section"
        ><h2>Mes favoris</h2>
        <p v-if="!favorites.length" class="text-muted"
          >Vous n’avez pas encore de favoris.</p
        >
        <div class="workspace-grid"
          ><q-card
            v-for="item in favorites"
            :key="item.id"
            flat
            bordered
            class="workspace-card"
            ><h3>{{ item.name }}</h3
            ><p>{{ item.short_description || item.description }}</p
            ><div class="workspace-actions"
              ><q-btn
                flat
                no-caps
                label="Voir l’application"
                :to="`/apps/${item.id}`" /><q-btn
                flat
                no-caps
                label="Retirer"
                :loading="removing === item.id"
                @click="remove(item.id)" /></div></q-card
        ></div>
        <q-pagination
          v-if="lastPage > 1"
          v-model="page"
          :max="lastPage"
          @update:model-value="loadFavorites"
        />
      </section>
      <section class="workspace-section"
        ><h2>Ma bibliothèque</h2
        ><p v-if="!installations.length" class="text-muted"
          >Aucune installation enregistrée pour votre compte.</p
        >
        <q-list bordered separator class="rounded-borders"
          ><q-item v-for="item in installations" :key="item.id"
            ><q-item-section
              ><q-item-label>{{ item.application?.name }}</q-item-label
              ><q-item-label caption
                >{{ item.platform }} · {{ item.version?.version_number }} ·
                {{ item.status }}</q-item-label
              ></q-item-section
            ><q-item-section side
              ><q-btn
                flat
                no-caps
                label="Consulter"
                :to="`/apps/${item.application_id}`" /></q-item-section></q-item
        ></q-list>
      </section>
    </template>
  </q-page>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { accountApi, apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore(),
  q = useQuasar()
const form = reactive({ name: '', email: '', two_factor_enabled: false, two_factor_channel: 'email' })
const loading = ref(true),
  saving = ref(false),
  sending = ref(false),
  removing = ref(null),
  error = ref('')
const favorites = ref([]),
  installations = ref([]),
  page = ref(1),
  lastPage = ref(1)
async function loadFavorites() {
  try {
    const { data } = await accountApi.favorites(page.value)
    favorites.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    error.value = apiMessage(e)
  }
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    await auth.fetchUser()
    if (!auth.user) return
    Object.assign(form, { name: auth.user.name, email: auth.user.email, two_factor_enabled: !!auth.user.two_factor_enabled })
    await loadFavorites()
    installations.value = (await api.get('/library')).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function save() {
  saving.value = true
  try {
    const { data } = await accountApi.update(form)
    auth.setUser(data.user)
    q.notify({
      type: data.verification_sent === false ? 'warning' : 'positive',
      message:
        data.verification_sent === false
          ? 'Profil enregistré, mais le lien n’a pas pu être envoyé.'
          : 'Profil enregistré.'
    })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    saving.value = false
  }
}
async function resend() {
  sending.value = true
  try {
    const { data } = await accountApi.resend()
    q.notify({ type: 'positive', message: data.message })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    sending.value = false
  }
}
async function remove(id) {
  removing.value = id
  try {
    await accountApi.unfavorite(id)
    await loadFavorites()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    removing.value = null
  }
}
onMounted(load)
</script>
