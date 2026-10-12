<template>
  <q-expansion-item
    icon="travel_explore"
    label="Ressources et domaines externes détectés"
    :caption="`${domainCount} domaine(s) détecté(s) automatiquement`"
    @before-show="load"
  >
    <div class="resource-report q-pa-md">
      <q-linear-progress v-if="loading" indeterminate />
      <q-banner v-if="error" class="workspace-alert" role="alert"
        >{{ error }}<q-btn flat label="Réessayer" @click="load"
      /></q-banner>
      <template v-if="report">
        <p
          >{{ report.domain_count }} domaines uniques ·
          {{ report.resource_count }} ressources ·
          {{ report.occurrence_count }} occurrences. Ces informations
          accompagnent la validation de cette version.</p
        >
        <p class="text-caption">{{ report.limitation }}</p>
        <q-banner v-if="!report.analyzed" class="workspace-alert"
          >Cette ancienne version possède un rapport historique. Une nouvelle
          analyse détaillée est nécessaire. Une version déjà approuvée dont le
          rapport change devra être réimportée.</q-banner
        >
        <q-btn
          flat
          no-caps
          icon="refresh"
          label="Réanalyser le ZIP"
          :loading="busy"
          @click="reanalyze"
        />
        <div v-if="report.comparison" class="q-my-md">
          <strong>{{
            report.comparison.previous_version_number
              ? `Comparaison à la version ${report.comparison.previous_version_number}`
              : 'Première version analysée'
          }}</strong>
          <p v-if="report.comparison.legacy_baseline"
            >La comparaison des types est limitée pour cet ancien rapport.</p
          >
          <p v-for="(label, key) in comparisonLabels" :key="key"
            >{{ label }} :
            {{ report.comparison[key]?.join(', ') || 'Aucun' }}</p
          >
        </div>
        <q-select
          v-model="risk"
          outlined
          dense
          emit-value
          map-options
          label="Filtrer par risque indicatif"
          :options="riskOptions"
          class="q-mb-md"
        />
        <p v-if="!filtered.length">Aucune ressource pour ce filtre.</p>
        <q-card
          v-for="resource in filtered"
          :key="resource.id"
          flat
          bordered
          class="q-pa-md q-mb-sm"
        >
          <div class="row items-center q-gutter-sm"
            ><strong>{{ resource.hostname || 'Référence indéterminée' }}</strong
            ><q-badge
              :color="resource.risk_level === 'high' ? 'orange-9' : 'blue-grey'"
              >{{ riskLabels[resource.risk_level] }}</q-badge
            ><q-badge
              v-if="report.comparison.added_domains.includes(resource.hostname)"
              color="primary"
              >Nouveau domaine</q-badge
            ></div
          >
          <p
            >{{ types[resource.resource_type] || resource.resource_type }} ·
            {{ classes[resource.classification] || resource.classification }} ·
            {{ resource.occurrences }} occurrence(s)</p
          >
          <p class="resource-url">{{
            resource.normalized_url || resource.original_url
          }}</p>
          <p class="text-caption"
            >Fichiers : {{ resource.source_files.join(', ') }}</p
          >
          <p>Examen : {{ statuses[resource.review_status] }}</p>
          <q-expansion-item
            v-if="resource.observations.length"
            label="Historique des observations"
          >
            <div
              v-for="note in resource.observations"
              :key="note.id"
              class="q-pa-sm"
            >
              <strong>{{ note.administrator_name }}</strong> ·
              {{ new Date(note.created_at).toLocaleString('fr-FR') }} ·
              {{
                note.visibility === 'internal'
                  ? 'Interne'
                  : 'Communiquée au développeur'
              }}
              <p class="note-body">{{ note.body }}</p
              ><span>{{ statuses[note.status] }}</span>
            </div>
          </q-expansion-item>
          <q-btn
            v-if="report.can_review"
            flat
            no-caps
            icon="rate_review"
            label="Examiner / ajouter une observation"
            :disable="busy"
            @click="openReview(resource)"
          />
        </q-card>
        <q-expansion-item
          v-if="report.proposed_csp"
          label="Politique de sécurité proposée pour cette version"
          ><p class="resource-url q-pa-sm">{{ report.proposed_csp }}</p
          ><p
            >Les origines HTTPS et WSS sont limitées aux types de ressources
            identifiés. Les références privées, non chiffrées ou indéterminées
            ne sont pas autorisées automatiquement.</p
          ></q-expansion-item
        >
      </template>
    </div>
  </q-expansion-item>
  <q-dialog v-model="reviewOpen"
    ><q-card class="review-dialog q-pa-lg"
      ><h2>Examiner la ressource</h2
      ><p>{{ selected?.hostname || 'Référence indéterminée' }}</p
      ><q-form @submit="saveReview" class="q-gutter-md">
        <q-select
          v-model="form.status"
          outlined
          emit-value
          map-options
          label="Décision"
          :options="[
            { label: 'Examinée', value: 'reviewed' },
            { label: 'Correction demandée', value: 'correction_requested' }
          ]"
          @update:model-value="
            v => {
              if (v === 'correction_requested') form.visibility = 'developer'
            }
          "
        />
        <q-select
          v-model="form.visibility"
          outlined
          emit-value
          map-options
          label="Visibilité"
          :disable="form.status === 'correction_requested'"
          :options="[
            { label: 'Communiquée au développeur', value: 'developer' },
            { label: 'Interne à l’administration', value: 'internal' }
          ]"
        />
        <q-input
          v-model="form.body"
          outlined
          type="textarea"
          label="Observation"
          maxlength="4000"
          :rules="[v => v.trim().length >= 3 || 'Précisez votre observation']"
        />
        <q-banner v-if="reviewError" role="alert">{{ reviewError }}</q-banner>
        <div class="row justify-end q-gutter-sm"
          ><q-btn flat label="Annuler" v-close-popup /><q-btn
            type="submit"
            color="primary"
            label="Enregistrer"
            :loading="busy"
        /></div> </q-form></q-card
  ></q-dialog>
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
const props = defineProps({ version: { type: Object, required: true } })
const emit = defineEmits(['changed'])
const report = ref(null),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  risk = ref('all'),
  reviewOpen = ref(false),
  selected = ref(null),
  reviewError = ref('')
const form = reactive({ status: 'reviewed', visibility: 'developer', body: '' })
const domainCount = computed(
  () =>
    report.value?.domain_count ?? props.version.detected_domains?.length ?? 0
)
const riskLabels = { high: 'Risque élevé à examiner', review: 'À examiner' }
const riskOptions = [
  { label: 'Tous les risques', value: 'all' },
  { label: 'Risque élevé', value: 'high' },
  { label: 'À examiner', value: 'review' }
]
const filtered = computed(() =>
  (report.value?.resources || []).filter(
    r => risk.value === 'all' || r.risk_level === risk.value
  )
)
const statuses = {
  pending: 'En attente',
  reviewed: 'Examinée',
  correction_requested: 'Correction demandée'
}
const types = {
  script: 'JavaScript',
  style: 'Feuille de style',
  image: 'Image',
  font: 'Police',
  connect: 'API / WebSocket',
  frame: 'Iframe',
  media: 'Média',
  manifest: 'Manifest',
  worker: 'Worker',
  unknown: 'Usage non déterminé',
  indeterminate: 'Référence indéterminée'
}
const classes = {
  known_service: 'Service reconnu, à vérifier',
  business_api: 'API métier présumée',
  unknown: 'Domaine inconnu',
  local_private: 'Adresse locale ou privée',
  indeterminate: 'Indéterminé'
}
const comparisonLabels = {
  added_domains: 'Nouveaux domaines',
  removed_domains: 'Domaines supprimés',
  changed_types: 'Types modifiés',
  new_risks: 'Nouveaux risques élevés'
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    report.value = (
      await api.get(`/versions/${props.version.id}/external-resources`)
    ).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function reanalyze() {
  busy.value = true
  error.value = ''
  try {
    report.value = (
      await api.post(
        `/versions/${props.version.id}/external-resources/reanalyze`
      )
    ).data
    emit('changed')
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
function openReview(resource) {
  selected.value = resource
  Object.assign(form, { status: 'reviewed', visibility: 'developer', body: '' })
  reviewError.value = ''
  reviewOpen.value = true
}
async function saveReview() {
  busy.value = true
  reviewError.value = ''
  try {
    await api.post(
      `/admin/external-resources/${selected.value.id}/review`,
      form
    )
    reviewOpen.value = false
    await load()
    emit('changed')
  } catch (e) {
    reviewError.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<style scoped>
.resource-report {
  min-width: 0;
}
.resource-report p,
.resource-report strong {
  overflow-wrap: anywhere;
}
.resource-url {
  font-family: monospace;
  overflow-wrap: anywhere;
}
.note-body {
  white-space: pre-wrap;
}
.review-dialog {
  width: 560px;
  max-width: 95vw;
}
</style>
