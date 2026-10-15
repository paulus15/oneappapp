<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{
        developerView
          ? ui('Votre activité développeur')
          : ui('Votre compte unique')
      }}</span
      ><h1>{{
        developerView
          ? ui('Tableau de bord développeur')
          : ui('Mon espace PWA Store')
      }}</h1
      ><p>{{
        developerView
          ? ui(
              'Vos publications, leur suivi et les ressources de votre compte.'
            )
          : ui('Vos applications, vos favoris et vos réglages personnels.')
      }}</p></header
    >
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ ui(error)
      }}<template #action
        ><q-btn flat :label="ui('Réessayer')" @click="load" /></template
    ></q-banner>
    <q-linear-progress
      v-if="loading"
      indeterminate
      :aria-label="ui('Chargement du compte')"
    />
    <template v-if="auth.user && !loading">
      <q-banner v-if="!auth.user.email_verified_at" class="workspace-alert"
        >{{ ui('Confirmez votre adresse e-mail.')
        }}<template #action
          ><q-btn
            flat
            no-caps
            :label="ui('Recevoir un code')"
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
          :label="developerView ? ui('Vue d’ensemble') : ui('Mes applications')"
        />
        <q-tab
          v-if="developerView"
          name="library"
          :label="ui('Mes applications personnelles')"
        />
        <q-tab name="favorites" :label="ui('Favoris')" />
        <q-tab name="reviews" :label="ui('Mes avis')" />
        <q-tab name="suggestions" :label="ui('Mes suggestions')" />
        <q-tab name="profile" :label="ui('Profil et sécurité')" />
        <q-tab name="preferences" :label="ui('Préférences et données')" />
      </q-tabs>
      <div class="q-mt-lg">
        <DeveloperOverview v-if="tab === 'activity' && developerView" />
        <PersonalLibrary v-else-if="tab === 'activity' || tab === 'library'" />
        <MyReviews v-else-if="tab === 'reviews'" />
        <MySuggestions v-else-if="tab === 'suggestions'" />
        <AccountPreferences v-else-if="tab === 'preferences'" />
        <section v-else-if="tab === 'favorites'">
          <q-linear-progress v-if="favoriteList.loading.value" indeterminate />
          <EmptyState
            v-else-if="favoriteList.error.value"
            tone="error"
            icon="cloud_off"
            :title="ui('Chargement impossible')"
            ><q-btn flat :label="ui('Réessayer')" @click="loadFavorites"
          /></EmptyState>
          <EmptyState
            v-else-if="!favorites.length"
            icon="favorite_border"
            :title="ui('Vous n’avez pas encore de favoris.')"
            ><q-btn
              flat
              color="primary"
              to="/applications"
              :label="ui('Découvrir les applications')"
          /></EmptyState>
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
                  :label="ui('Voir l’application')"
                  :to="`/apps/${item.id}`" /><q-btn
                  flat
                  no-caps
                  :label="ui('Retirer')"
                  :loading="removing === item.id"
                  @click="remove(item.id)" /></div></q-card
          ></div>
          <LoadMore
            v-if="!favoriteList.loading.value"
            auto
            :has-more="favoriteList.hasMore.value"
            :loading="favoriteList.loadingMore.value"
            :error="favoriteList.moreError.value"
            :shown="favorites.length"
            :total="favoriteList.total.value"
            @load="favoriteList.loadMore"
          />
        </section>
        <div v-else-if="tab === 'profile'" class="workspace-grid">
          <q-card flat bordered class="workspace-card"
            ><h2>{{ ui('Mon profil') }}</h2>
            <q-form class="workspace-form" @submit="save">
              <q-input
                v-model="form.name"
                :label="ui('Nom complet')"
                autocomplete="name"
                outlined
                required
                maxlength="255"
              />
              <!-- Chosen at sign-up and never changed afterwards (older accounts without one pick it once). -->
              <CountrySelect
                v-model="form.country_id"
                required
                :disable="!!auth.user.country_id"
                :label="ui('Pays de résidence déclaré')"
              />
              <p class="text-caption text-muted">{{ t('geo.profileHint') }}</p>
              <!-- The sign-in address is the account's identity: it cannot be changed. -->
              <q-input
                v-model="form.email"
                :label="ui('Adresse e-mail')"
                type="email"
                outlined
                readonly
                disable
                :hint="
                  ui('L’adresse e-mail du compte ne peut pas être modifiée.')
                "
              />
              <p class="text-caption">
                {{ ui('Une erreur sur votre pays ou votre adresse ?') }}
                <router-link
                  :to="{
                    path: '/contact',
                    query: { subject: 'Modifier mon compte' }
                  }"
                  >{{ ui('Demander une correction au support') }}</router-link
                >
              </p>
              <q-btn
                type="submit"
                no-caps
                color="primary"
                :label="ui('Enregistrer')"
                :loading="saving"
              />
            </q-form>
          </q-card>
          <AccountSecurity />
          <q-card
            v-if="!auth.isDeveloper"
            flat
            bordered
            class="workspace-card developer-invite"
            ><h2>{{ ui('Vous développez des applications ?') }}</h2
            ><p>{{
              ui('Devenez développeur sur PWA Store avec ce même compte.')
            }}</p
            ><q-btn
              color="primary"
              no-caps
              :label="ui('Devenir développeur')"
              to="/developer/activate"
          /></q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>
<script setup>
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { useI18n } from 'vue-i18n'
import { ui } from '@/i18n/text'

import { onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { accountApi, apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
import CountrySelect from '@/components/CountrySelect.vue'
import AccountSecurity from '@/components/AccountSecurity.vue'
import AccountPreferences from '@/components/AccountPreferences.vue'
import MyReviews from '@/components/MyReviews.vue'
import MySuggestions from '@/components/MySuggestions.vue'
import DeveloperOverview from '@/components/DeveloperOverview.vue'
import PersonalLibrary from '@/components/PersonalLibrary.vue'
const LINKABLE_TABS = [
  'activity',
  'favorites',
  'reviews',
  'suggestions',
  'profile',
  'preferences'
]
const { t } = useI18n()
const auth = useAuthStore(),
  q = useQuasar(),
  router = useRouter(),
  { developerView } = useWorkspaceAccess()
const form = reactive({
  name: '',
  email: '',
  country_id: null
})
const loading = ref(true),
  saving = ref(false),
  sending = ref(false),
  removing = ref(null),
  error = ref(''),
  route = useRoute(),
  // Links open a tab directly: /account?tab=favorites (mobile bar), ?tab=suggestions (notifications).
  tabFromQuery = () =>
    LINKABLE_TABS.includes(route.query.tab) ? route.query.tab : 'activity',
  tab = ref(tabFromQuery())
const favoriteList = useLoadMore(
  async page => (await accountApi.favorites(page)).data
)
const favorites = favoriteList.items
// The mobile bar opens "Favoris" then "Profil" on the same page: follow the URL.
watch(
  () => route.query.tab,
  () => (tab.value = tabFromQuery())
)
watch(developerView, () => {
  if (tab.value === 'library') tab.value = 'activity'
})
const loadFavorites = favoriteList.reload
async function load() {
  loading.value = true
  error.value = ''
  try {
    await auth.fetchUser()
    if (!auth.user) return
    Object.assign(form, {
      name: auth.user.name,
      email: auth.user.email,
      country_id: auth.user.country_id
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
    auth.setUser(data.user)
    q.notify({
      type: 'positive',
      get message() {
        return ui('Profil enregistré.')
      }
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
