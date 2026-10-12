<template>
  <q-expansion-item
    icon="travel_explore"
    :label="ui('Ressources et domaines externes détectés')"
    :caption="
      ui('{p0} domaine(s) détecté(s) automatiquement', { p0: domainCount })
    "
    @before-show="load"
  >
    <div class="resource-report q-pa-md">
      <q-linear-progress v-if="loading" indeterminate />
      <q-banner v-if="error" class="workspace-alert" role="alert"
        >{{ ui(error) }}<q-btn flat :label="ui('Réessayer')" @click="load"
      /></q-banner>
      <template v-if="report">
        <p
          >{{ report.domain_count }} {{ ui('domaines uniques ·') }}
          {{ report.resource_count }} {{ ui('ressources ·') }}
          {{ report.occurrence_count }}
          {{
            ui(
              'occurrences. Ces informations accompagnent la validation de cette version.'
            )
          }}</p
        >
        <p class="text-caption">{{ report.limitation }}</p>
        <q-banner v-if="!report.analyzed" class="workspace-alert">{{
          ui(
            'Cette ancienne version possède un rapport historique. Une nouvelle analyse détaillée est nécessaire. Une version déjà approuvée dont le rapport change devra être réimportée.'
          )
        }}</q-banner>
        <q-btn
          flat
          no-caps
          icon="refresh"
          :label="ui('Réanalyser le ZIP')"
          :loading="busy"
          @click="reanalyze"
        />
        <div v-if="report.comparison" class="q-my-md">
          <strong>{{
            report.comparison.previous_version_number
              ? ui('Comparaison à la version {p0}', {
                  p0: report.comparison.previous_version_number
                })
              : ui('Première version analysée')
          }}</strong>
          <p v-if="report.comparison.legacy_baseline">{{
            ui('La comparaison des types est limitée pour cet ancien rapport.')
          }}</p>
          <p v-for="(label, key) in comparisonLabels" :key="key"
            >{{ label }} :
            {{ report.comparison[key]?.join(', ') || ui('Aucun') }}</p
          >
        </div>
        <q-select
          v-model="risk"
          outlined
          dense
          emit-value
          map-options
          :label="ui('Filtrer par risque indicatif')"
          :options="riskOptions"
          class="q-mb-md"
        />
        <p v-if="!filtered.length">{{
          ui('Aucune ressource pour ce filtre.')
        }}</p>
        <q-card
          v-for="resource in filtered"
          :key="resource.id"
          flat
          bordered
          class="q-pa-md q-mb-sm"
        >
          <div class="row items-center q-gutter-sm"
            ><strong>{{
              resource.hostname || ui('Référence indéterminée')
            }}</strong
            ><q-badge
              :color="
                { high: 'orange-9', review: 'blue-grey', info: 'grey-6' }[
                  resource.risk_level
                ] || 'blue-grey'
              "
              >{{ riskLabels[resource.risk_level] }}</q-badge
            ><q-badge
              v-if="report.comparison.added_domains.includes(resource.hostname)"
              color="primary"
              >{{ ui('Nouveau domaine') }}</q-badge
            ></div
          >
          <p
            >{{ types[resource.resource_type] || resource.resource_type }} ·
            {{ classes[resource.classification] || resource.classification }} ·
            {{ resource.occurrences }} {{ ui('occurrence(s)') }}</p
          >
          <p class="resource-url">{{
            resource.normalized_url || resource.original_url
          }}</p>
          <p class="text-caption"
            >{{ ui('Fichiers :') }} {{ resource.source_files.join(', ') }}</p
          >
          <p>{{ ui('Examen :') }} {{ statuses[resource.review_status] }}</p>
          <q-expansion-item
            v-if="resource.observations.length"
            :label="ui('Historique des observations')"
          >
            <div
              v-for="note in resource.observations"
              :key="note.id"
              class="q-pa-sm"
            >
              <strong>{{ note.administrator_name }}</strong> ·
              {{ new Date(note.created_at).toLocaleString(currentLocale()) }} ·
              {{
                note.visibility === 'internal'
                  ? ui('Interne')
                  : ui('Communiquée au développeur')
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
            :label="ui('Examiner / ajouter une observation')"
            :disable="busy"
            @click="openReview(resource)"
          />
        </q-card>
        <q-expansion-item
          v-if="report.proposed_csp"
          :label="ui('Politique de sécurité proposée pour cette version')"
          ><p class="resource-url q-pa-sm">{{ report.proposed_csp }}</p
          ><p>{{
            ui(
              'Les origines HTTPS et WSS sont limitées aux types de ressources identifiés. Les références privées, non chiffrées ou indéterminées ne sont pas autorisées automatiquement.'
            )
          }}</p></q-expansion-item
        >
      </template>
    </div>
  </q-expansion-item>
  <q-dialog v-model="reviewOpen"
    ><q-card class="review-dialog q-pa-lg"
      ><h2>{{ ui('Examiner la ressource') }}</h2
      ><p>{{ selected?.hostname || ui('Référence indéterminée') }}</p
      ><q-form @submit="saveReview" class="q-gutter-md">
        <q-select
          v-model="form.status"
          outlined
          emit-value
          map-options
          :label="ui('Décision')"
          :options="[
            { label: ui('Examinée'), value: 'reviewed' },
            { label: ui('Correction demandée'), value: 'correction_requested' }
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
          :label="ui('Visibilité')"
          :disable="form.status === 'correction_requested'"
          :options="[
            { label: ui('Communiquée au développeur'), value: 'developer' },
            { label: ui('Interne à l’administration'), value: 'internal' }
          ]"
        />
        <q-input
          v-model="form.body"
          outlined
          type="textarea"
          :label="ui('Observation')"
          maxlength="4000"
          :rules="[
            v => v.trim().length >= 3 || ui('Précisez votre observation')
          ]"
        />
        <q-banner v-if="reviewError" role="alert">{{
          ui(reviewError)
        }}</q-banner>
        <div class="row justify-end q-gutter-sm"
          ><q-btn flat :label="ui('Annuler')" v-close-popup /><q-btn
            type="submit"
            color="primary"
            :label="ui('Enregistrer')"
            :loading="busy"
        /></div> </q-form></q-card
  ></q-dialog>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

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
const riskLabels = {
  get high() {
    return ui('Risque élevé à examiner')
  },
  get review() {
    return ui('À examiner')
  },
  get info() {
    return ui('Information')
  }
}
const riskOptions = [
  {
    get label() {
      return ui('Tous les risques')
    },
    value: 'all'
  },
  {
    get label() {
      return ui('Risque élevé')
    },
    value: 'high'
  },
  {
    get label() {
      return ui('À examiner')
    },
    value: 'review'
  },
  {
    get label() {
      return ui('Information')
    },
    value: 'info'
  }
]
const riskOrder = { high: 0, review: 1, info: 2 }
// High-risk references first, informational ones (namespaces, examples) last.
const filtered = computed(() =>
  (report.value?.resources || [])
    .filter(r => risk.value === 'all' || r.risk_level === risk.value)
    .sort(
      (a, b) =>
        (riskOrder[a.risk_level] ?? 1) - (riskOrder[b.risk_level] ?? 1) ||
        (a.hostname || '').localeCompare(b.hostname || '')
    )
)
const statuses = {
  get pending() {
    return ui('En attente')
  },
  get reviewed() {
    return ui('Examinée')
  },
  get correction_requested() {
    return ui('Correction demandée')
  }
}
const types = {
  script: 'JavaScript',
  get style() {
    return ui('Feuille de style')
  },
  get image() {
    return ui('Image')
  },
  get font() {
    return ui('Police')
  },
  get connect() {
    return ui('API / WebSocket')
  },
  get frame() {
    return ui('Iframe')
  },
  get media() {
    return ui('Média')
  },
  get manifest() {
    return ui('Manifest')
  },
  get worker() {
    return ui('Worker')
  },
  get unknown() {
    return ui('Usage non déterminé')
  },
  get indeterminate() {
    return ui('Référence indéterminée')
  },
  get reference() {
    return ui('Simple mention')
  }
}
const classes = {
  get known_service() {
    return ui('Service reconnu, à vérifier')
  },
  get business_api() {
    return ui('API métier présumée')
  },
  get unknown() {
    return ui('Domaine inconnu')
  },
  get local_private() {
    return ui('Adresse locale ou non publique')
  },
  get indeterminate() {
    return ui('Indéterminé')
  },
  get namespace() {
    return ui('Espace de noms XML (jamais chargé)')
  },
  get placeholder() {
    return ui('Adresse d’exemple')
  }
}
const comparisonLabels = {
  get added_domains() {
    return ui('Nouveaux domaines')
  },
  get removed_domains() {
    return ui('Domaines supprimés')
  },
  get changed_types() {
    return ui('Types modifiés')
  },
  get new_risks() {
    return ui('Nouveaux risques élevés')
  }
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
