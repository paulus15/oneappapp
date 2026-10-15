<template>
  <q-page class="workspace-page">
    <router-link :to="backTo" class="back-link">
      <q-icon name="arrow_back" aria-hidden="true" />
      {{ ui('Tous mes liens de partage') }}
    </router-link>

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton height="120px" class="q-mb-md" />
      <q-skeleton height="96px" class="q-mb-md" />
      <q-skeleton height="180px" />
    </div>

    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      :title="ui('Lien introuvable.')"
      :text="
        ui(
          'Ce lien n’existe pas, ne vous appartient pas ou la promotion n’est pas disponible.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        :label="ui('Retour à la promotion')"
        to="/developer/growth"
      />
    </EmptyState>

    <EmptyState
      v-else-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger ce lien.')"
      :text="error"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="load()"
      />
    </EmptyState>

    <template v-else-if="campaign">
      <header class="workspace-card detail-head">
        <AppIcon :src="campaign.app?.icon_url" alt="" class="app-icon" />
        <div class="head-text">
          <span class="eyebrow">{{ campaign.app?.name }}</span>
          <h1>{{ campaign.name }}</h1>
          <div class="badges">
            <MonitorBadge
              :label="sourceInfo(campaign.source).label"
              :icon="sourceInfo(campaign.source).icon"
            />
            <MonitorBadge
              v-if="campaign.archived_at"
              :label="ui('Archivé')"
              icon="archive"
              color="warning"
            />
            <small v-if="campaign.medium" class="muted">{{
              campaign.medium
            }}</small>
            <small class="muted">{{
              ui('Créé le {p0}', { p0: growthDate(campaign.created_at) })
            }}</small>
          </div>
        </div>
      </header>

      <q-banner
        v-if="campaign.archived_at"
        class="workspace-alert q-mb-md"
        role="status"
      >
        <template #avatar
          ><q-icon name="archive" aria-hidden="true"
        /></template>
        {{
          ui(
            'Ce lien est archivé : ses nouvelles visites ne sont plus comptées. Les statistiques passées restent consultables.'
          )
        }}
      </q-banner>

      <section class="workspace-section">
        <CampaignLink :url="campaign.url" large />
      </section>

      <section class="workspace-card stats-card workspace-section">
        <GrowthStats :stats="campaign.stats" large />
        <p class="note">{{
          ui(
            'Une ouverture n’est pas une preuve d’installation. Les visites sont comptées une fois par jour et par appareil ; plusieurs personnes derrière une même connexion peuvent n’être comptées qu’une fois.'
          )
        }}</p>
      </section>

      <section class="workspace-section">
        <h2>{{ ui('30 derniers jours') }}</h2>
        <div class="workspace-grid charts">
          <q-card flat bordered class="workspace-card">
            <TrendChart
              :title="ui('Visites par jour')"
              :points="series('visits')"
            />
          </q-card>
          <q-card flat bordered class="workspace-card">
            <TrendChart
              :title="ui('Ouvertures par jour')"
              :points="series('opens')"
            />
          </q-card>
        </div>
      </section>

      <section class="workspace-grid workspace-section">
        <q-card flat bordered class="workspace-card">
          <h2>{{ ui('Pays des visiteurs') }}</h2>
          <p class="note">{{
            ui(
              'Pays déclaré ou choisi par le visiteur sur le store, pas une géolocalisation.'
            )
          }}</p>
          <ol v-if="countries.length" class="countries">
            <li v-for="country in countries" :key="country.code">
              <span class="country-name">{{ country.name }}</span>
              <span class="bar" aria-hidden="true"
                ><i :style="{ width: `${country.share}%` }"
              /></span>
              <strong>{{ visitCount(country.visits) }}</strong>
            </li>
          </ol>
          <p v-else class="text-muted">{{
            ui('Aucun pays déclaré pour le moment.')
          }}</p>
        </q-card>
        <q-card flat bordered class="workspace-card">
          <h2>{{ ui('QR code de ce lien') }}</h2>
          <p v-if="campaign.archived_at" class="text-muted" role="status">{{
            ui(
              'Ce lien est archivé : son QR code n’est plus proposé. Réactivez le lien pour le télécharger.'
            )
          }}</p>
          <GrowthSvgAsset
            v-else
            class="qr"
            :fetch="() => growthApi.campaignQr(campaign.id)"
            :source="campaign.id"
            :alt="ui('QR code du lien {p0}', { p0: campaign.name })"
            :filename="`qr-${fileSlug(campaign.name)}`"
          />
        </q-card>
      </section>

      <section class="workspace-section">
        <q-card flat bordered class="workspace-card">
          <h2>{{ ui('Réglages du lien') }}</h2>
          <q-form class="settings-form" @submit="saveDetails">
            <q-input
              v-model="form.name"
              outlined
              :label="ui('Nom du lien')"
              maxlength="80"
              :rules="[
                value => !!value?.trim() || ui('Donnez un nom à ce lien.')
              ]"
            />
            <q-input
              v-model="form.medium"
              outlined
              :label="ui('Précision (facultatif)')"
              maxlength="40"
              counter
            />
            <div class="settings-actions">
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                icon="save"
                :label="ui('Enregistrer')"
                :loading="saving"
              />
              <q-btn
                outline
                no-caps
                :color="campaign.archived_at ? 'primary' : 'negative'"
                :icon="campaign.archived_at ? 'unarchive' : 'archive'"
                :label="
                  campaign.archived_at
                    ? ui('Réactiver le lien')
                    : ui('Archiver le lien')
                "
                class="toggle-archive"
                @click="confirmOpen = true"
              />
            </div>
          </q-form>
        </q-card>
      </section>

      <q-dialog v-model="confirmOpen">
        <q-card class="confirm-card">
          <q-card-section>
            <h2 class="confirm-title">{{
              campaign.archived_at
                ? ui('Réactiver ce lien ?')
                : ui('Archiver ce lien ?')
            }}</h2>
            <p>{{
              campaign.archived_at
                ? ui(
                    'Les nouvelles visites de ce lien seront de nouveau comptées.'
                  )
                : ui(
                    'Le lien ne comptera plus les nouvelles visites. Ses statistiques restent consultables et vous pourrez le réactiver.'
                  )
            }}</p>
            <p v-if="archiveError" class="archive-error" role="alert">{{
              archiveError
            }}</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              no-caps
              :label="ui('Annuler')"
              class="cancel-archive"
            />
            <q-btn
              unelevated
              no-caps
              :color="campaign.archived_at ? 'primary' : 'negative'"
              :label="campaign.archived_at ? ui('Réactiver') : ui('Archiver')"
              :loading="archiving"
              class="confirm-archive"
              @click="toggleArchive"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </q-page>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import TrendChart from '@/components/TrendChart.vue'
import CampaignLink from '@/components/growth/CampaignLink.vue'
import GrowthStats from '@/components/growth/GrowthStats.vue'
import GrowthSvgAsset from '@/components/growth/GrowthSvgAsset.vue'
import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { growthApi } from '@/services/growth'
import { displayName } from '@/utils/listing'
import { fileSlug, growthCount, growthDate, sourceInfo } from '@/utils/growth'

const $q = useQuasar()
const route = useRoute()
const campaignId = computed(() => route.params.id)

const campaign = ref(null),
  loading = ref(true),
  notFound = ref(false),
  error = ref(''),
  saving = ref(false),
  archiving = ref(false),
  confirmOpen = ref(false),
  archiveError = ref('')
const form = reactive({ name: '', medium: '' })

const backTo = computed(() =>
  campaign.value?.application_id
    ? `/developer/growth?app=${campaign.value.application_id}`
    : '/developer/growth'
)
const series = key =>
  (campaign.value?.daily || []).map(day => ({
    day: day.date,
    value: Number(day[key]) || 0
  }))
const countries = computed(() => {
  const list = (campaign.value?.countries || []).filter(c => c?.code)
  const max = Math.max(1, ...list.map(c => Number(c.visits) || 0))
  return list.map(c => ({
    code: c.code,
    visits: c.visits,
    name: displayName(c.code, currentLocale(), 'region'),
    share: Math.round(((Number(c.visits) || 0) / max) * 100)
  }))
})

// "1 visite" / "12 visites", with the locale's number format.
const visitCount = value =>
  i18n.global.t('growth.visits', { n: growthCount(value) }, Number(value) || 0)

function fill(data) {
  form.name = data?.name || ''
  form.medium = data?.medium || ''
}

// Each load gets a number; only the latest one may fill the page, so a late answer for
// campaign 7 never lands on campaign 8.
let requestSeq = 0
async function load() {
  const seq = ++requestSeq
  loading.value = true
  notFound.value = false
  error.value = ''
  campaign.value = null
  confirmOpen.value = false
  try {
    const data = (await growthApi.show(campaignId.value)).data.data
    if (seq !== requestSeq) return
    campaign.value = data
    fill(data)
  } catch (e) {
    if (seq !== requestSeq) return
    if (e.response?.status === 404) notFound.value = true
    else error.value = apiMessage(e)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

// PATCH answers the campaign without daily/countries: keep the ones already shown.
function merge(id, data) {
  if (!campaign.value || String(campaign.value.id) !== String(id)) return false
  campaign.value = {
    ...campaign.value,
    ...data,
    daily: data?.daily ?? campaign.value.daily,
    countries: data?.countries ?? campaign.value.countries
  }
  return true
}

async function saveDetails() {
  const id = campaign.value?.id
  const name = form.name.trim()
  if (!id || !name) return
  saving.value = true
  try {
    const { data } = await growthApi.update(id, {
      name,
      medium: form.medium.trim() || null
    })
    if (!merge(id, data.data)) return
    fill(campaign.value)
    $q.notify({ type: 'positive', message: ui('Lien enregistré.') })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    saving.value = false
  }
}

async function toggleArchive() {
  const id = campaign.value?.id
  if (!id || archiving.value) return
  const archive = !campaign.value.archived_at
  archiving.value = true
  archiveError.value = ''
  try {
    const { data } = await growthApi.update(id, { archived: archive })
    if (!merge(id, data.data)) return
    confirmOpen.value = false
    $q.notify({
      type: 'positive',
      message: archive ? ui('Lien archivé.') : ui('Lien réactivé.')
    })
  } catch (e) {
    // 422 on reactivation: the cap of active links is reached. The dialog stays open
    // with the server's explanation.
    archiveError.value = apiMessage(e)
    $q.notify({ type: 'negative', message: archiveError.value })
  } finally {
    archiving.value = false
  }
}

watch(confirmOpen, open => {
  if (open) archiveError.value = ''
})
watch(campaignId, load, { immediate: true })
defineExpose({ campaign, confirmOpen, toggleArchive, saveDetails, form })
</script>
<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  color: var(--pwa-link);
  font-weight: 600;
  text-decoration: none;
}
.back-link:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 3px;
  border-radius: 6px;
}
.detail-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--outline);
}
.app-icon {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
}
.head-text {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.head-text h1 {
  overflow-wrap: anywhere;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 4px;
}
.muted {
  color: var(--muted);
}
.workspace-section {
  margin-bottom: 16px;
}
.stats-card {
  border: 1px solid var(--outline);
}
.note {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
.countries {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}
.countries li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}
.country-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar {
  height: 8px;
  overflow: hidden;
  background: var(--pwa-chart-grid, var(--outline));
  border-radius: 4px;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--pwa-chart-mark, var(--q-primary));
  border-radius: 4px;
}
.qr {
  max-width: 260px;
}
.settings-form {
  display: grid;
  gap: 12px;
  max-width: 560px;
}
.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.confirm-card {
  width: min(440px, calc(100vw - 32px));
}
.archive-error {
  margin: 8px 0 0;
  color: var(--q-negative);
}
.confirm-title {
  margin: 0 0 8px;
  font-size: 18px;
}
</style>
