<template>
  <div class="content-panel">
    <!-- 1. Access for the review team -->
    <section class="workspace-card content-section">
      <h3>{{ t('content.access.title') }}</h3>
      <p class="text-muted">{{ t('content.access.intro') }}</p>
      <q-option-group
        v-model="access.mode"
        :options="[
          { label: t('content.access.open'), value: 'open' },
          { label: t('content.access.restricted'), value: 'restricted' }
        ]"
        type="radio"
        :disable="disable"
      />
      <template v-if="access.mode === 'restricted'">
        <q-input
          v-model="access.instructions"
          outlined
          type="textarea"
          autogrow
          maxlength="2000"
          :label="t('content.access.instructions')"
          :hint="t('content.access.instructionsHint')"
          :disable="disable"
        />
        <div class="form-row">
          <q-input
            v-model="access.username"
            outlined
            autocomplete="off"
            :label="t('content.access.username')"
            :disable="disable"
          />
          <q-input
            v-model="access.password"
            outlined
            autocomplete="new-password"
            :type="showPassword ? 'text' : 'password'"
            :label="t('content.access.password')"
            :disable="disable"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                role="button"
                tabindex="0"
                :aria-label="t('content.access.togglePassword')"
                @click="showPassword = !showPassword"
                @keydown.enter="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>
        <q-input
          v-model="access.other"
          outlined
          maxlength="1000"
          :label="t('content.access.other')"
          :disable="disable"
        />
      </template>
      <p class="text-caption text-muted secure-note">
        <q-icon name="lock" />{{ t('content.access.secure') }}
      </p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="save"
        :label="t('workspace.save')"
        :loading="busyAccess"
        :disable="disable || !access.mode"
        @click="saveAccess"
      />
    </section>

    <!-- 2. Ads -->
    <section class="workspace-card content-section">
      <h3>{{ t('content.ads.title') }}</h3>
      <p class="text-muted">{{ t('content.ads.intro') }}</p>
      <q-option-group
        v-model="ads"
        :options="[
          { label: t('content.ads.yes'), value: true },
          { label: t('content.ads.no'), value: false }
        ]"
        type="radio"
        :disable="disable"
      />
    </section>

    <!-- Permissions: declared by the developer, then compared with the analysis -->
    <section class="workspace-card content-section">
      <h3>{{ ui('Autorisations demandées') }}</h3>
      <p class="text-muted">{{
        ui(
          'Cochez chaque autorisation que votre application demande au navigateur. Elles sont affichées sur sa fiche avant l’installation.'
        )
      }}</p>
      <q-checkbox
        v-model="noPermission"
        :label="ui('Mon application ne demande aucune autorisation')"
        :disable="disable"
        @update:model-value="value => value && (permissions = [])"
      />
      <div class="permission-grid" :class="{ muted: noPermission }">
        <q-checkbox
          v-for="perm in permissionOptions"
          :key="perm.key"
          v-model="permissions"
          :val="perm.key"
          :disable="disable || noPermission"
          dense
        >
          <q-icon :name="perm.icon" class="q-mr-xs" aria-hidden="true" />
          {{ perm.label }}
        </q-checkbox>
      </div>
      <q-banner
        v-if="undeclared.length"
        class="workspace-alert q-mt-sm"
        role="status"
      >
        <template #avatar
          ><q-icon name="travel_explore" color="warning"
        /></template>
        {{
          ui(
            'Notre analyse du code a repéré des autorisations non cochées : {list}. Cochez-les si votre application les utilise ; sinon, l’équipe de vérification vous posera la question.',
            {
              list: undeclared.map(key => permissionInfo(key).label).join(', ')
            }
          )
        }}
      </q-banner>
      <p
        v-else-if="app.detected_permissions"
        class="text-caption text-muted q-mt-sm"
        >{{
          ui(
            'Analyse du code : aucune autorisation non déclarée. Cette détection est automatique et peut manquer des cas : votre déclaration fait foi.'
          )
        }}</p
      >
    </section>

    <!-- 3. Content rating -->
    <section class="workspace-card content-section">
      <div class="rating-head">
        <h3>{{ t('content.rating.title') }}</h3>
        <span
          class="age-badge"
          :aria-label="t('content.rating.ageLabel', { age })"
          >{{ age }}+</span
        >
      </div>
      <p class="text-muted">{{ t('content.rating.intro') }}</p>
      <div
        v-for="(levels, question) in QUESTIONS"
        :key="question"
        class="question"
      >
        <p class="question-label">{{ t(`content.rating.q.${question}`) }}</p>
        <q-option-group
          v-model="answers[question]"
          :options="
            Object.keys(levels).map(level => ({
              label: t(`content.rating.a.${question}.${level}`),
              value: level
            }))
          "
          type="radio"
          inline
          :disable="disable"
        />
      </div>
      <div v-for="element in INTERACTIVE" :key="element" class="question">
        <p class="question-label">{{ t(`content.rating.q.${element}`) }}</p>
        <q-option-group
          v-model="answers[element]"
          :options="yesNo"
          type="radio"
          inline
          :disable="disable"
        />
      </div>
      <div class="question">
        <p class="question-label">{{ t('content.rating.q.packaged') }}</p>
        <p class="text-caption text-muted">{{
          t('content.rating.packagedHelp')
        }}</p>
        <q-option-group
          v-model="answers.packaged"
          :options="yesNo"
          type="radio"
          inline
          :disable="disable"
        />
      </div>
      <p class="text-caption text-muted">{{
        t('content.rating.notOfficial')
      }}</p>
    </section>

    <div class="save-row">
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="save"
        :label="t('workspace.save')"
        :loading="busy"
        :disable="disable || !complete"
        @click="save"
      />
      <span class="text-caption text-muted">{{
        complete
          ? live
            ? t('workspace.saveLive')
            : t('workspace.saveDraft')
          : t('content.incomplete')
      }}</span>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { ui } from '@/i18n/text'
import { accountApi, apiMessage } from '@/services/account'
import { APP_PERMISSIONS, permissionInfo } from '@/utils/appPermissions'

// Mirrors App\Services\ContentRating: the server recomputes the age on every save.
const QUESTIONS = {
  violence: { none: 3, mild: 7, strong: 16 },
  sexual: { none: 3, suggestive: 12, explicit: 18 },
  language: { none: 3, mild: 12, strong: 16 },
  drugs: { none: 3, references: 12, use: 18 },
  gambling: { none: 3, simulated: 12, real_money: 18 },
  fear: { none: 3, mild: 7, strong: 16 }
}
const INTERACTIVE = ['users_interact', 'shares_location', 'digital_purchases']

const props = defineProps({
  app: { type: Object, required: true },
  listing: { type: Object, required: true },
  disable: { type: Boolean, default: false },
  live: { type: Boolean, default: false }
})
const emit = defineEmits(['saved'])
const q = useQuasar()
const { t } = useI18n()

const access = reactive({
  mode: null,
  instructions: '',
  username: '',
  password: '',
  other: ''
})
const showPassword = ref(false)

function toBoolean(val) {
  if (val === true || val === 1 || val === '1' || val === 'true') return true
  if (val === false || val === 0 || val === '0' || val === 'false') return false
  return null
}

function initAnswers(source) {
  const result = { ...source }
  for (const key of [...INTERACTIVE, 'packaged']) {
    if (key in result) {
      const b = toBoolean(result[key])
      if (b !== null) result[key] = b
    }
  }
  return result
}

const ads = ref(props.listing.contains_ads ?? null)
const answers = reactive(initAnswers(props.listing.content_rating?.answers))
// null = not answered yet; [] = "no permission", which is a valid answer.
const permissions = ref([...(props.listing.permissions || [])])
const noPermission = ref(
  Array.isArray(props.listing.permissions) && !props.listing.permissions.length
)

watch(
  () => props.listing,
  newListing => {
    if (!newListing) return
    ads.value = newListing.contains_ads ?? null
    permissions.value = [...(newListing.permissions || [])]
    noPermission.value =
      Array.isArray(newListing.permissions) && !newListing.permissions.length
    const updated = initAnswers(newListing.content_rating?.answers)
    for (const [k, v] of Object.entries(updated)) {
      answers[k] = v
    }
  },
  { deep: true }
)
const permissionOptions = computed(() => APP_PERMISSIONS.map(permissionInfo))
// Detected in the code but not ticked here (compared with the unsaved choice).
const undeclared = computed(() =>
  (props.app.detected_permissions || []).filter(
    key => !permissions.value.includes(key)
  )
)
const busy = ref(false),
  busyAccess = ref(false)
const yesNo = computed(() => [
  { label: t('content.yes'), value: true },
  { label: t('content.no'), value: false }
])
const complete = computed(
  () =>
    ads.value !== null &&
    (noPermission.value || permissions.value.length > 0) &&
    Object.keys(QUESTIONS).every(key => answers[key]) &&
    [...INTERACTIVE, 'packaged'].every(key => typeof answers[key] === 'boolean')
)
const age = computed(() =>
  Math.max(
    3,
    ...Object.entries(QUESTIONS).map(
      ([key, levels]) => levels[answers[key]] || 3
    )
  )
)

async function saveAccess() {
  busyAccess.value = true
  try {
    await accountApi.saveReviewAccess(props.app.id, access)
    q.notify({ type: 'positive', message: t('content.access.saved') })
    emit('saved')
  } catch (e) {
    q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    busyAccess.value = false
  }
}
async function save() {
  busy.value = true
  const data = new FormData()
  data.append('_method', 'PUT')
  data.append('contains_ads', ads.value ? 1 : 0)
  // The flag carries "no permission": multipart cannot send an empty list.
  data.append('permissions_declared', 1)
  permissions.value.forEach((perm, i) => data.append(`permissions[${i}]`, perm))
  for (const [key, value] of Object.entries(answers))
    data.append(
      `content_rating[${key}]`,
      typeof value === 'boolean' ? (value ? 1 : 0) : value
    )
  try {
    await accountApi.updateApp(props.app.id, data)
    q.notify({
      type: 'positive',
      message: props.live ? t('workspace.savedLive') : t('workspace.saved')
    })
    emit('saved')
  } catch (e) {
    q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  try {
    Object.assign(
      access,
      (await accountApi.reviewAccess(props.app.id)).data.review_access || {}
    )
  } catch {
    // The form simply starts empty.
  }
})
</script>
<style scoped>
.content-panel {
  display: grid;
  gap: 16px;
  max-width: 820px;
}
.content-section {
  display: grid;
  gap: 10px;
}
.content-section h3 {
  margin: 0;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.secure-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.rating-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.age-badge {
  min-width: 48px;
  padding: 4px 10px;
  border-radius: 10px;
  text-align: center;
  font-weight: 800;
  color: #fff;
  background: var(--q-primary);
}
.question {
  border-top: 1px solid var(--outline);
  padding-top: 8px;
}
.question-label {
  margin: 0 0 2px;
  font-weight: 600;
}
.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 4px 12px;
  margin-top: 6px;
}
.permission-grid.muted {
  opacity: 0.55;
}
.save-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
