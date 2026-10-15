<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Promouvoir mon application') }}</h1
      ><p>{{
        ui(
          'Créez un lien de partage par canal (WhatsApp, LinkedIn, QR code…) et voyez ce que chacun apporte : visites, consultations de la fiche et ouvertures.'
        )
      }}</p></header
    >
    <DeveloperToolsNav />

    <div
      v-if="appsLoading"
      class="app-picker"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 3" :key="n" height="68px" class="pick-skeleton" />
    </div>

    <EmptyState
      v-else-if="appsError"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger vos applications.')"
      :text="appsError"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="loadApps()"
      />
    </EmptyState>

    <EmptyState
      v-else-if="!apps.length"
      icon="campaign"
      :title="ui('Aucune application à promouvoir.')"
      :text="
        ui(
          'Publiez une application sur le store pour créer des liens de partage.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="apps"
        :label="ui('Mes applications')"
        to="/developer/apps"
      />
    </EmptyState>

    <template v-else>
      <section class="workspace-section picker-section">
        <h2 id="growth-app-label">{{ ui('Application à promouvoir') }}</h2>
        <EmptyState
          v-if="!promotable.length"
          compact
          icon="campaign"
          class="q-mb-md"
          :title="ui('Aucune application ne peut être promue pour le moment.')"
          :text="ui('La raison est indiquée sous chaque application.')"
        />
        <div class="app-picker" role="group" aria-labelledby="growth-app-label">
          <button
            v-for="app in apps"
            :key="app.id"
            type="button"
            class="app-choice"
            :class="{ selected: app.id === selectedId }"
            :aria-pressed="app.id === selectedId"
            :aria-disabled="app.promotable ? undefined : 'true'"
            :aria-describedby="app.promotable ? undefined : `reason-${app.id}`"
            @click="selectApp(app.id)"
          >
            <AppIcon :src="app.icon_url" alt="" class="app-icon" />
            <span class="choice-text">
              <strong>{{ app.name }}</strong>
              <small v-if="!app.promotable" :id="`reason-${app.id}`">{{
                app.reason
                  ? ui(app.reason)
                  : ui('Cette application ne peut pas être promue.')
              }}</small>
              <small v-else-if="app.category">{{
                ui(app.category.name)
              }}</small>
            </span>
            <q-icon
              v-if="app.id === selectedId"
              name="check_circle"
              color="primary"
              size="22px"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      <template v-if="selectedApp">
        <q-tabs
          v-model="tab"
          align="left"
          no-caps
          inline-label
          outside-arrows
          mobile-arrows
        >
          <q-tab name="links" icon="link" :label="ui('Liens de campagne')" />
          <q-tab name="badges" icon="verified" :label="ui('Badges')" />
          <q-tab name="share" icon="image" :label="ui('Visuel de partage')" />
        </q-tabs>
        <q-tab-panels v-model="tab" animated keep-alive class="panels">
          <q-tab-panel name="links" class="q-pa-none">
            <q-card flat bordered class="workspace-card create-card">
              <h2>{{ ui('Nouveau lien de partage') }}</h2>
              <q-form class="create-form" @submit="createCampaign">
                <div
                  class="sources"
                  role="group"
                  :aria-label="ui('Où allez-vous partager ce lien ?')"
                >
                  <span class="field-label">{{
                    ui('Où allez-vous partager ce lien ?')
                  }}</span>
                  <div class="chips">
                    <button
                      v-for="item in sources"
                      :key="item.value"
                      type="button"
                      class="source-chip"
                      :aria-pressed="form.source === item.value"
                      @click="pickSource(item.value)"
                    >
                      <q-icon :name="item.icon" aria-hidden="true" />
                      <span>{{ item.label }}</span>
                    </button>
                  </div>
                </div>
                <div class="fields">
                  <q-input
                    v-model="form.name"
                    outlined
                    :label="ui('Nom du lien')"
                    :hint="
                      ui('Pour vous seul : il n’apparaît pas dans le lien.')
                    "
                    maxlength="80"
                    :rules="[
                      value => !!value?.trim() || ui('Donnez un nom à ce lien.')
                    ]"
                    @update:model-value="nameEdited = true"
                  />
                  <q-input
                    v-model="form.medium"
                    outlined
                    :label="ui('Précision (facultatif)')"
                    :hint="ui('Par exemple : publication, story, newsletter.')"
                    maxlength="40"
                    counter
                  />
                </div>
                <p v-if="createError" class="form-error" role="alert">{{
                  createError
                }}</p>
                <div>
                  <q-btn
                    type="submit"
                    unelevated
                    no-caps
                    color="primary"
                    icon="add_link"
                    :label="ui('Créer le lien')"
                    :loading="creating"
                  />
                </div>
              </q-form>
            </q-card>

            <q-card
              v-if="created"
              flat
              bordered
              class="workspace-card created-card"
            >
              <div class="created-main">
                <h2 ref="createdHeading" tabindex="-1">{{
                  ui('Votre lien est prêt')
                }}</h2>
                <p>{{
                  ui('Partagez-le sur {p0}. Chaque visite sera comptée ici.', {
                    p0: sourceInfo(created.source).label
                  })
                }}</p>
                <CampaignLink :url="created.url" large />
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="insights"
                  :label="ui('Voir le détail de ce lien')"
                  :to="`/developer/growth/campaigns/${created.id}`"
                  class="q-mt-sm"
                />
              </div>
              <GrowthSvgAsset
                class="created-qr"
                :fetch="() => growthApi.campaignQr(created.id)"
                :source="created.id"
                :alt="ui('QR code du lien {p0}', { p0: created.name })"
                :filename="`qr-${fileSlug(created.name)}`"
              />
            </q-card>

            <section class="workspace-section">
              <div class="list-head">
                <h2>{{ ui('Vos liens') }}</h2>
                <q-btn-toggle
                  v-model="archived"
                  :options="[
                    { value: false, label: ui('Actifs') },
                    { value: true, label: ui('Archivés') }
                  ]"
                  no-caps
                  unelevated
                  toggle-color="primary"
                  class="filter"
                />
              </div>
              <p class="text-muted note">{{
                ui(
                  'Une ouverture n’est pas une preuve d’installation. Les visites sont comptées une fois par jour et par appareil ; plusieurs personnes derrière une même connexion peuvent n’être comptées qu’une fois.'
                )
              }}</p>

              <div
                v-if="campaigns.loading.value"
                role="status"
                aria-busy="true"
                :aria-label="ui('Chargement…')"
              >
                <q-skeleton
                  v-for="n in 2"
                  :key="n"
                  height="140px"
                  class="q-mb-sm"
                />
              </div>
              <EmptyState
                v-else-if="campaigns.error.value"
                compact
                tone="error"
                icon="cloud_off"
                :title="ui('Vos liens n’ont pas pu être chargés.')"
                :text="campaignsErrorText"
              >
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="refresh"
                  :label="ui('Réessayer')"
                  @click="campaigns.reload()"
                />
              </EmptyState>
              <EmptyState
                v-else-if="!campaigns.items.value.length"
                compact
                icon="link_off"
                :title="
                  archived
                    ? ui('Aucun lien archivé.')
                    : ui('Aucun lien pour le moment.')
                "
                :text="
                  archived
                    ? ''
                    : ui(
                        'Choisissez un canal ci-dessus : votre premier lien est prêt en quelques secondes.'
                      )
                "
              />
              <template v-else>
                <ul class="campaign-list" role="list">
                  <li
                    v-for="campaign in campaigns.items.value"
                    :key="campaign.id"
                    class="workspace-card campaign-row"
                  >
                    <div class="row-head">
                      <router-link
                        :to="`/developer/growth/campaigns/${campaign.id}`"
                        class="campaign-name"
                        >{{ campaign.name }}</router-link
                      >
                      <MonitorBadge
                        :label="sourceInfo(campaign.source).label"
                        :icon="sourceInfo(campaign.source).icon"
                      />
                      <small v-if="campaign.medium" class="muted">{{
                        campaign.medium
                      }}</small>
                      <small class="muted">{{
                        ui('Créé le {p0}', {
                          p0: growthDate(campaign.created_at)
                        })
                      }}</small>
                    </div>
                    <CampaignLink :url="campaign.url" />
                    <GrowthStats :stats="campaign.stats" />
                  </li>
                </ul>
                <LoadMore
                  :has-more="campaigns.hasMore.value"
                  :loading="campaigns.loadingMore.value"
                  :error="campaigns.moreError.value"
                  :shown="campaigns.items.value.length"
                  :total="campaigns.total.value"
                  :page-size="15"
                  @load="campaigns.loadMore()"
                />
              </template>
            </section>
          </q-tab-panel>
          <q-tab-panel name="badges" class="q-pa-none">
            <GrowthBadges :app="selectedApp" />
          </q-tab-panel>
          <q-tab-panel name="share" class="q-pa-none">
            <GrowthShareCard :app="selectedApp" />
          </q-tab-panel>
        </q-tab-panels>
      </template>
      <p v-else-if="promotable.length" class="text-muted">{{
        ui('Choisissez l’application à promouvoir.')
      }}</p>
    </template>
  </q-page>
</template>
<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import CampaignLink from '@/components/growth/CampaignLink.vue'
import GrowthBadges from '@/components/growth/GrowthBadges.vue'
import GrowthShareCard from '@/components/growth/GrowthShareCard.vue'
import GrowthStats from '@/components/growth/GrowthStats.vue'
import GrowthSvgAsset from '@/components/growth/GrowthSvgAsset.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { growthApi } from '@/services/growth'
import {
  defaultCampaignName,
  fileSlug,
  growthDate,
  growthSources,
  sourceInfo
} from '@/utils/growth'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const apps = ref([]),
  appsLoading = ref(true),
  appsError = ref(''),
  selectedId = ref(null),
  tab = ref('links'),
  archived = ref(false),
  creating = ref(false),
  createError = ref(''),
  created = ref(null),
  nameEdited = ref(false),
  createdHeading = ref(null)
const form = reactive({ source: 'whatsapp', name: '', medium: '' })

const sources = computed(() => growthSources())
const promotable = computed(() => apps.value.filter(app => app.promotable))
const selectedApp = computed(
  () => promotable.value.find(app => app.id === selectedId.value) || null
)

const campaigns = useLoadMore(
  async page =>
    (
      await growthApi.campaigns({
        applicationId: selectedId.value,
        archived: archived.value,
        page
      })
    ).data
)
const campaignsErrorText = computed(() =>
  campaigns.last.value instanceof Error ? apiMessage(campaigns.last.value) : ''
)

function resetName() {
  form.name = defaultCampaignName(form.source)
  nameEdited.value = false
}
// A name typed by the developer is kept; the suggested one follows the channel.
function pickSource(source) {
  form.source = source
  if (!nameEdited.value || !form.name.trim()) resetName()
}

async function loadApps() {
  appsLoading.value = true
  appsError.value = ''
  try {
    const { data } = await growthApi.apps()
    apps.value = Array.isArray(data?.data) ? data.data : []
    const fromQuery = Number(route.query?.app)
    const wanted = promotable.value.find(app => app.id === fromQuery)
    // One promotable app: no choice to make.
    const initial =
      wanted ||
      (promotable.value.length === 1 ? promotable.value[0] : null) ||
      null
    selectedId.value = initial?.id ?? null
  } catch (e) {
    apps.value = []
    appsError.value = apiMessage(e)
  } finally {
    appsLoading.value = false
  }
}

function selectApp(id) {
  if (!promotable.value.some(app => app.id === id)) return
  selectedId.value = id
  if (String(route.query?.app) !== String(id))
    void router.replace({ query: { ...route.query, app: String(id) } })
}

watch(selectedId, id => {
  created.value = null
  createError.value = ''
  // Switching the filter back reloads the list through its own watcher.
  if (archived.value) archived.value = false
  else if (id) void campaigns.reload()
})
watch(archived, () => {
  if (selectedId.value) void campaigns.reload()
})

async function createCampaign() {
  const app = selectedApp.value
  const name = form.name.trim()
  if (!app || !name || creating.value) return
  creating.value = true
  createError.value = ''
  const payload = { application_id: app.id, name, source: form.source }
  const medium = form.medium.trim()
  if (medium) payload.medium = medium
  try {
    const { data } = await growthApi.create(payload)
    // The developer may have switched app while the request was running.
    if (selectedId.value !== app.id) return
    created.value = data.data
    form.medium = ''
    resetName()
    $q.notify({ type: 'positive', message: ui('Lien créé.') })
    if (archived.value) archived.value = false
    else void campaigns.reload()
    await nextTick()
    createdHeading.value?.focus?.()
  } catch (e) {
    // 404: the app was removed or is no longer the developer's; refresh the choices.
    if (e.response?.status === 404) {
      createError.value = ui(
        'Cette application n’est plus disponible pour la promotion.'
      )
      void loadApps()
    } else createError.value = apiMessage(e)
    $q.notify({ type: 'negative', message: createError.value })
  } finally {
    creating.value = false
  }
}

resetName()
onMounted(loadApps)
defineExpose({
  form,
  created,
  selectedId,
  archived,
  createCampaign,
  pickSource
})
</script>
<style scoped>
.picker-section {
  margin-bottom: 18px;
}
.app-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 10px;
}
.pick-skeleton {
  border-radius: 14px;
}
.app-choice {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  color: var(--text);
  font: inherit;
  text-align: left;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 14px;
  cursor: pointer;
}
.app-choice.selected {
  border-color: var(--pwa-primary);
  box-shadow: 0 0 0 1px var(--pwa-primary);
}
.app-choice[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.72;
}
.app-choice:focus-visible,
.source-chip:focus-visible,
.campaign-name:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 3px;
}
.app-icon {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
}
.choice-text {
  display: grid;
  flex: 1;
  min-width: 0;
}
.choice-text strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.choice-text small {
  color: var(--muted);
  line-height: 1.4;
}
.panels {
  background: transparent;
}
.create-card,
.created-card {
  margin-bottom: 16px;
  border: 1px solid var(--outline);
}
.create-form {
  display: grid;
  gap: 16px;
}
.field-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.source-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 14px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 999px;
  cursor: pointer;
}
.source-chip[aria-pressed='true'] {
  color: #fff;
  background: var(--q-primary);
  border-color: var(--q-primary);
}
.fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 12px;
}
.form-error {
  margin: 0;
  color: var(--q-negative);
}
.created-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 220px);
  gap: 18px;
  align-items: start;
  border-color: var(--pwa-primary);
}
.created-main h2:focus {
  outline: none;
}
.list-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.list-head h2 {
  margin: 0;
}
.filter {
  border: 1px solid var(--outline);
}
.note {
  margin: 8px 0 14px;
  font-size: 13px;
}
.campaign-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.campaign-row {
  display: grid;
  gap: 12px;
  border: 1px solid var(--outline);
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.campaign-name {
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.campaign-name:hover {
  color: var(--pwa-link);
  text-decoration: underline;
}
.muted {
  color: var(--muted);
}
@media (max-width: 700px) {
  .created-card {
    grid-template-columns: minmax(0, 1fr);
  }
  .created-qr {
    max-width: 240px;
  }
}
</style>
