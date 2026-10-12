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
    <p v-if="!loading && !profiles.length">{{
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
        ><DeveloperDocuments :profile-id="p.id" admin /><div
          class="workspace-actions"
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
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      @update:model-value="load"
    />
  </q-page>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import AdminNav from '@/components/AdminNav.vue'
import DeveloperDocuments from '@/components/DeveloperDocuments.vue'
import { identityLabels } from '@/utils/identity'
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { accountApi, apiMessage } from '@/services/account'
const q = useQuasar(),
  profiles = ref([]),
  loading = ref(true),
  busy = ref(false),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1)
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
  page.value = 1
  return load()
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await accountApi.developers(page.value, {
      status: filters.status || undefined,
      search: filters.search || undefined
    })
    profiles.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
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
onMounted(load)
</script>
