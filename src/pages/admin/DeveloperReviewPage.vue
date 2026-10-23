<template>
  <q-page class="workspace-page"
    ><header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Vérification des développeurs') }}</h1
      ><p>{{
        ui(
          'La vérification de l’éditeur ne publie aucune application automatiquement.'
        )
      }}</p></header
    >
    <AdminNav />
    <AdminDeveloperEdit ref="editor" @saved="load" />
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-5"
        ><q-input
          v-model="filters.search"
          outlined
          dense
          clearable
          debounce="400"
          :label="ui('Nom ou e-mail')"
          @update:model-value="reload"
          ><template #prepend><q-icon name="search" /></template></q-input
      ></div>
      <div class="col-12 col-md-4"
        ><q-select
          v-model="filters.status"
          :options="statusOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          :label="ui('Statut')"
          @update:model-value="reload"
      /></div>
    </div>
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ ui(error)
      }}<template #action
        ><q-btn
          flat
          :label="ui('Réessayer')"
          @click="load" /></template></q-banner
    ><q-linear-progress v-if="loading" indeterminate />
    <EmptyState
      v-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      :text="ui('Les données n’ont pas pu être chargées.')"
      ><q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="load"
    /></EmptyState>
    <p v-if="!loading && !error && !list.error.value && !profiles.length">{{
      ui('Aucun profil à afficher.')
    }}</p>
    <div class="workspace-grid"
      ><q-card
        v-for="p in profiles"
        :key="p.id"
        flat
        bordered
        class="workspace-card"
        ><q-chip
          :label="labels[p.status]"
          color="primary"
          text-color="white" /><h2>{{
          p.public_name || ui('Profil incomplet')
        }}</h2
        ><p>{{ p.user?.email }}</p
        ><dl
          ><dt>{{ ui('Identité légale') }}</dt
          ><dd>{{ p.legal_name || ui('Non renseignée') }}</dd
          ><dt>{{ ui('Pays') }}</dt
          ><dd>{{ p.country || ui('Non renseigné') }}</dd
          ><dt>{{ ui('Profil') }}</dt
          ><dd>{{
            p.type === 'organization' ? ui('Organisation') : ui('Individuel')
          }}</dd
          ><template v-if="p.type === 'organization'"
            ><dt>{{ ui('Représentant') }}</dt
            ><dd>{{ p.representative_name }}</dd
            ><dt>{{ ui('E-mail professionnel') }}</dt
            ><dd>{{ p.business_email }}</dd
            ><dt>{{ ui('Informations légales') }}</dt
            ><dd>{{ p.legal_information }}</dd></template
          ><dt>{{ ui('Pièce d’identité') }}</dt
          ><dd>{{
            p.identity_document_type
              ? ui('{p0} · expire le {p1}', {
                  p0: identityLabels[p.identity_document_type],
                  p1: new Date(
                    p.identity_document_expires_at
                  ).toLocaleDateString(currentLocale())
                })
              : ui('Non déposée')
          }}</dd
          ><dt>{{ ui('Présentation') }}</dt
          ><dd>{{ p.description || ui('Non renseignée') }}</dd
          ><dt>{{ ui('Site') }}</dt
          ><dd>{{ p.website || ui('Non renseigné') }}</dd></dl
        ><p v-if="p.validation"
          >{{ ui('Dernière validation :') }}
          {{ p.validation.administrator_name || ui('Administrateur supprimé') }}
          {{ ui('(n°') }} {{ p.validation.administrator_id || 'indisponible' }})
          ·
          {{
            new Date(p.validation.validated_at).toLocaleString(currentLocale())
          }}</p
        ><p v-if="p.missing_fields?.length"
          >{{ ui('Profil incomplet :') }} {{ p.missing_fields.join(', ') }}</p
        ><p v-if="p.decision_reason"
          >{{ ui('Dernier motif :') }} {{ p.decision_reason }}</p
        ><p v-if="p.last_reminded_at" class="text-caption text-muted"
          ><q-icon name="mark_email_read" size="14px" class="q-mr-xs" />{{
            ui('Dernier rappel envoyé le {p0}', {
              p0: new Date(p.last_reminded_at).toLocaleDateString(
                currentLocale()
              )
            })
          }}</p
        ><DeveloperDocuments :profile-id="p.id" admin /><div
          class="workspace-actions"
          ><q-btn
            outline
            no-caps
            icon="edit"
            :label="ui('Modifier le profil développeur')"
            :disable="busy || p.user_id === auth.user?.id"
            @click="editor.edit(p)" /><q-btn
            v-if="['draft', 'rejected'].includes(p.status)"
            unelevated
            no-caps
            color="primary"
            icon="send"
            :label="ui('Soumettre pour le développeur')"
            :disable="busy || !!p.missing_fields?.length"
            @click="submitFor(p)" /><q-btn
            v-if="
              ['draft', 'pending_verification', 'rejected'].includes(p.status)
            "
            outline
            no-caps
            color="warning"
            icon="mail"
            :label="ui('Envoyer un rappel')"
            :disable="busy || p.user_id === auth.user?.id || !canRemind(p)"
            @click="remind(p)"
            ><q-tooltip v-if="remindTooltip(p)">{{
              remindTooltip(p)
            }}</q-tooltip></q-btn
          ><q-btn
            v-for="state in transitions[p.status]"
            :key="state"
            outline
            no-caps
            :label="actions[state]"
            :disable="
              busy || (state === 'verified' && !!p.missing_fields?.length)
            "
            @click="decide(p, state)" /></div></q-card
    ></div>
    <LoadMore
      v-if="!loading && !list.error.value"
      auto
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="profiles.length"
      :total="list.total.value"
      @load="list.loadMore"
    />
  </q-page>
</template>
<script setup>
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import AdminDeveloperEdit from '@/components/AdminDeveloperEdit.vue'
import { useAuthStore } from '@/stores/auth'
import AdminNav from '@/components/AdminNav.vue'
import DeveloperDocuments from '@/components/DeveloperDocuments.vue'
import { identityLabels } from '@/utils/identity'
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { accountApi, apiMessage } from '@/services/account'
const auth = useAuthStore()
const editor = ref(null)
const list = useLoadMore(async page => {
  const { data } = await accountApi.developers(page, {
    status: filters.status || undefined,
    search: filters.search || undefined
  })
  return data
})

const q = useQuasar(),
  profiles = list.items,
  loading = list.loading,
  busy = ref(false),
  error = ref('')
const labels = {
  get draft() {
    return ui('Brouillon')
  },
  get pending_verification() {
    return ui('En attente')
  },
  get verified() {
    return ui('Vérifié')
  },
  get rejected() {
    return ui('Refusé')
  },
  get suspended() {
    return ui('Suspendu')
  }
}
const actions = {
  get verified() {
    return ui('Vérifier')
  },
  get rejected() {
    return ui('Demander une correction')
  },
  get suspended() {
    return ui('Suspendre')
  },
  get draft() {
    return ui('Rouvrir le profil')
  }
}
const transitions = {
  draft: ['suspended'],
  pending_verification: ['verified', 'rejected', 'suspended'],
  verified: ['suspended'],
  rejected: ['draft', 'suspended'],
  suspended: ['draft']
}
const filters = reactive({ status: null, search: '' })
const statusOptions = Object.keys(labels).map(value => ({
  value,
  get label() {
    return labels[value]
  }
}))
function reload() {
  return load()
}
const load = () => {
  error.value = ''
  return list.reload()
}

// The developer completed everything but never sent it: the reviewer sends it, with a reason.
function submitFor(profile) {
  q.dialog({
    title: ui('Soumettre pour le développeur'),
    get message() {
      return ui(
        'Le profil passera en vérification comme si le développeur l’avait envoyé. Indiquez le motif (par exemple sa demande).'
      )
    },
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(async reason => {
    busy.value = true
    try {
      await accountApi.submitDeveloper(profile.id, { reason })
      await load()
      q.notify({
        type: 'positive',
        get message() {
          return ui(
            'Profil envoyé en vérification. Le développeur est prévenu.'
          )
        }
      })
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}

function decide(profile, status) {
  q.dialog({
    title: actions[status],
    get message() {
      return ui('Indiquez un motif de décision.')
    },
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(async reason => {
    busy.value = true
    try {
      await accountApi.reviewDeveloper(profile.id, { status, reason })
      await load()
      q.notify({
        type: 'positive',
        get message() {
          return ui('Décision enregistrée.')
        }
      })
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function isOlderThanThreeDays(dateString) {
  if (!dateString) return true
  return Date.now() - new Date(dateString).getTime() >= THREE_DAYS_MS
}

function canRemind(profile) {
  if (!profile || profile.user_id === auth.user?.id) return false
  if (!['draft', 'pending_verification', 'rejected'].includes(profile.status))
    return false
  if (!isOlderThanThreeDays(profile.updated_at)) return false
  if (
    profile.last_reminded_at &&
    !isOlderThanThreeDays(profile.last_reminded_at)
  )
    return false
  return true
}

function remindTooltip(profile) {
  if (!profile) return ''
  if (profile.user_id === auth.user?.id) {
    return ui('Un administrateur ne peut pas s’envoyer de rappel.')
  }
  if (!isOlderThanThreeDays(profile.updated_at)) {
    return ui('Rappel disponible après 3 jours d’inactivité.')
  }
  if (
    profile.last_reminded_at &&
    !isOlderThanThreeDays(profile.last_reminded_at)
  ) {
    return ui('Un rappel a déjà été envoyé au cours des 3 derniers jours.')
  }
  return ''
}

function remind(profile) {
  const recipient =
    profile.user?.email || profile.public_name || ui('ce développeur')
  q.dialog({
    title: ui('Envoyer un rappel par e-mail'),
    message: ui(
      'Envoyer un e-mail de rappel à {email} pour l’inviter à finaliser son profil développeur ?',
      { email: recipient }
    ),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    busy.value = true
    try {
      const { data } = await accountApi.remindDeveloper(profile.id)
      profile.last_reminded_at =
        data?.last_reminded_at || new Date().toISOString()
      q.notify({
        type: 'positive',
        message: data?.message || ui('E-mail de rappel envoyé au développeur.')
      })
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}

onMounted(load)
</script>
