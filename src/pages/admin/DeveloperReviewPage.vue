<template>
  <q-page class="workspace-page"
    ><header class="workspace-heading"
      ><span class="eyebrow">Administration</span
      ><h1>Vérification des développeurs</h1
      ><p
        >La vérification de l’éditeur ne publie aucune application
        automatiquement.</p
      ></header
    >
    <AdminNav />
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ error
      }}<template #action
        ><q-btn flat label="Réessayer" @click="load" /></template></q-banner
    ><q-linear-progress v-if="loading" indeterminate />
    <p v-if="!loading && !profiles.length">Aucun profil à afficher.</p>
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
          text-color="white" /><h2>{{ p.public_name || 'Profil incomplet' }}</h2
        ><p>{{ p.user?.email }}</p
        ><dl
          ><dt>Identité légale</dt
          ><dd>{{ p.legal_name || 'Non renseignée' }}</dd
          ><dt>Pays</dt><dd>{{ p.country || 'Non renseigné' }}</dd
          ><dt>Profil</dt
          ><dd>{{
            p.type === 'organization' ? 'Organisation' : 'Individuel'
          }}</dd
          ><template v-if="p.type === 'organization'"
            ><dt>Représentant</dt><dd>{{ p.representative_name }}</dd
            ><dt>E-mail professionnel</dt><dd>{{ p.business_email }}</dd
            ><dt>Informations légales</dt
            ><dd>{{ p.legal_information }}</dd></template
          ><dt>Pièce d’identité</dt
          ><dd>{{
            p.identity_document_type
              ? `${identityLabels[p.identity_document_type]} · expire le ${new Date(p.identity_document_expires_at).toLocaleDateString('fr-FR')}`
              : 'Non déposée'
          }}</dd
          ><dt>Présentation</dt><dd>{{ p.description || 'Non renseignée' }}</dd
          ><dt>Site</dt><dd>{{ p.website || 'Non renseigné' }}</dd></dl
        ><p v-if="p.decision_reason">Dernier motif : {{ p.decision_reason }}</p
        ><DeveloperDocuments :profile-id="p.id" admin /><div
          class="workspace-actions"
          ><q-btn
            v-for="state in transitions[p.status]"
            :key="state"
            outline
            no-caps
            :label="actions[state]"
            :disable="busy"
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
import AdminNav from '@/components/AdminNav.vue'
import DeveloperDocuments from '@/components/DeveloperDocuments.vue'
import { identityLabels } from '@/utils/identity'
import { onMounted, ref } from 'vue'
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
  draft: 'Brouillon',
  pending_verification: 'En attente',
  verified: 'Vérifié',
  rejected: 'Refusé',
  suspended: 'Suspendu'
}
const actions = {
  verified: 'Vérifier',
  rejected: 'Demander une correction',
  suspended: 'Suspendre',
  draft: 'Rouvrir le profil'
}
const transitions = {
  draft: ['suspended'],
  pending_verification: ['verified', 'rejected', 'suspended'],
  verified: ['suspended'],
  rejected: ['draft', 'suspended'],
  suspended: ['draft']
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await accountApi.developers(page.value)
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
    message: 'Indiquez un motif de décision.',
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(async reason => {
    busy.value = true
    try {
      await accountApi.reviewDeveloper(profile.id, { status, reason })
      await load()
      q.notify({ type: 'positive', message: 'Décision enregistrée.' })
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}
onMounted(load)
</script>
