<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{
        developerView ? 'Votre activité développeur' : 'Votre compte unique'
      }}</span
      ><h1>{{
        developerView ? 'Tableau de bord développeur' : 'Mon espace PWA Store'
      }}</h1
      ><p>{{
        developerView
          ? 'Vos publications, leur suivi et les ressources de votre compte.'
          : 'Vos applications, vos favoris et vos réglages personnels.'
      }}</p></header
    >
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template
    ></q-banner>
    <q-linear-progress
      v-if="loading"
      indeterminate
      aria-label="Chargement du compte"
    />
    <template v-if="auth.user && !loading">
      <q-banner v-if="!auth.user.email_verified_at" class="workspace-alert"
        >Confirmez votre adresse e-mail.<template #action
          ><q-btn
            flat
            no-caps
            label="Recevoir un code"
            :loading="sending"
            @click="resend" /></template
      ></q-banner>
      <q-tabs
        v-model="tab"
        dense
        align="left"
        active-color="primary"
        class="account-tabs"
        no-caps
      >
        <q-tab
          name="activity"
          :label="developerView ? 'Vue d’ensemble' : 'Mes applications'"
        />
        <q-tab
          v-if="developerView"
          name="library"
          label="Mes applications personnelles"
        />
        <q-tab name="favorites" label="Favoris" />
        <q-tab name="profile" label="Profil et sécurité" />
      </q-tabs>
      <div class="q-mt-lg">
        <DeveloperOverview v-if="tab === 'activity' && developerView" />
        <PersonalLibrary v-else-if="tab === 'activity' || tab === 'library'" />
        <section v-else-if="tab === 'favorites'">
          <p v-if="!favorites.length && !error"
            >Vous n’avez pas encore de favoris.</p
          >
          <div class="workspace-grid"
            ><q-card
              v-for="item in favorites"
              :key="item.id"
              flat
              bordered
              class="workspace-card"
              ><h2>{{ item.name }}</h2
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
        <div v-else-if="tab === 'profile'" class="workspace-grid">
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
              <CountrySelect
                v-model="form.country_id"
                label="Pays de résidence déclaré"
              />
              <q-input
                v-model="form.email"
                label="Adresse e-mail"
                type="email"
                autocomplete="email"
                outlined
                required
              />
              <template v-if="form.email !== auth.user.email"
                ><q-input
                  v-model="form.current_password"
                  label="Mot de passe actuel"
                  type="password"
                  autocomplete="current-password"
                  outlined
                  required
                /><p class="text-caption"
                  >Votre adresse actuelle restera valide jusqu’à confirmation de
                  la nouvelle. Si la double authentification est activée, un
                  premier code sera demandé sur l’ancienne adresse.</p
                ></template
              >
              <q-btn
                type="submit"
                no-caps
                color="primary"
                label="Enregistrer"
                :loading="saving"
              />
            </q-form>
          </q-card>
          <AccountSecurity />
          <q-card
            v-if="!auth.isDeveloper && !isMobile"
            flat
            bordered
            class="workspace-card developer-invite"
            ><h2>Vous développez des applications ?</h2
            ><p>Devenez développeur sur PWA Store avec ce même compte.</p
            ><q-btn
              color="primary"
              no-caps
              label="Devenir développeur"
              to="/developer/activate"
          /></q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>
<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { accountApi, apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
import CountrySelect from '@/components/CountrySelect.vue'
import AccountSecurity from '@/components/AccountSecurity.vue'
import DeveloperOverview from '@/components/DeveloperOverview.vue'
import PersonalLibrary from '@/components/PersonalLibrary.vue'
const auth = useAuthStore(),
  q = useQuasar(),
  router = useRouter(),
  { isMobile, developerView } = useWorkspaceAccess()
const form = reactive({
  name: '',
  email: '',
  country_id: null,
  current_password: ''
})
const loading = ref(true),
  saving = ref(false),
  sending = ref(false),
  removing = ref(null),
  error = ref(''),
  tab = ref('activity')
const favorites = ref([]),
  page = ref(1),
  lastPage = ref(1)
watch(developerView, () => {
  if (tab.value === 'library') tab.value = 'activity'
})
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
    Object.assign(form, {
      name: auth.user.name,
      email: auth.user.email,
      country_id: auth.user.country_id,
      current_password: ''
    })
    await loadFavorites()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function save() {
  saving.value = true
  error.value = ''
  try {
    const { data } = await accountApi.update(form)
    form.current_password = ''
    if (data.requires_otp) {
      auth.setChallenge(data)
      router.push('/verify-email')
      return
    }
    auth.setUser(data.user)
    q.notify({ type: 'positive', message: 'Profil enregistré.' })
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
    auth.setChallenge(data)
    router.push('/verify-email')
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
<style scoped>
.account-tabs {
  border-bottom: 1px solid var(--pwa-border);
  max-width: 100%;
}
</style>
