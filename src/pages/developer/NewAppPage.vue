<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ t('newApp.eyebrow') }}</span
      ><h1>{{ t('newApp.title') }}</h1
      ><p>{{ t('newApp.intro') }}</p></header
    >
    <q-card flat bordered class="workspace-card new-app-card">
      <q-form class="workspace-form" @submit="create">
        <q-input
          v-model="form.name"
          outlined
          :label="t('newApp.name')"
          maxlength="255"
          :rules="[v => !!v?.trim() || t('newApp.nameRequired')]"
          autofocus
        />
        <q-select
          v-model="form.category_id"
          outlined
          emit-value
          map-options
          :options="categories"
          option-value="id"
          option-label="name"
          :label="t('newApp.category')"
          :loading="loadingCategories"
        />
        <fieldset class="source-choice">
          <legend>{{ t('newApp.sourceTitle') }}</legend>
          <q-option-group
            v-model="form.source_type"
            :options="sourceOptions"
            type="radio"
          />
          <div class="source-explain">
            <HostingBadge :source-type="form.source_type" />
            <span>{{ t(`newApp.sourceHelp.${form.source_type}`) }}</span>
          </div>
          <q-input
            v-if="form.source_type === 'url'"
            v-model="form.external_url"
            outlined
            type="url"
            :label="t('newApp.url')"
            :hint="t('newApp.urlHint')"
            :rules="[
              v => /^https:\/\//.test(v || '') || t('newApp.urlRequired')
            ]"
          />
        </fieldset>
        <q-banner v-if="error" class="workspace-alert" role="alert">{{
          error
        }}</q-banner>
        <div class="workspace-actions">
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            :label="t('newApp.create')"
            :loading="busy"
          />
          <q-btn flat no-caps :label="t('common.cancel')" to="/developer" />
        </div>
        <p class="text-caption text-muted">{{ t('newApp.draftNote') }}</p>
      </q-form>
    </q-card>
  </q-page>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HostingBadge from '@/components/HostingBadge.vue'
import { usePlatform } from '@/composables/usePlatform'
import { catalogApi } from '@/services/catalog'
import { accountApi, apiMessage } from '@/services/account'

// A draft only needs a name: everything else is filled in the app's workspace, at the developer's pace.
const router = useRouter()
const { t } = useI18n()
const form = reactive({
  name: '',
  category_id: null,
  source_type: 'url',
  external_url: ''
})
const categories = ref([]),
  loadingCategories = ref(true),
  busy = ref(false),
  error = ref('')
const { platform } = usePlatform()
// ZIP uploads are switched off on the platform: the option stays visible, disabled, with the reason.
const zipEnabled = computed(() => !!platform.value?.build_uploads)
const sourceOptions = computed(() => [
  { label: t('newApp.source.url'), value: 'url' },
  {
    label: zipEnabled.value
      ? t('newApp.source.build')
      : `${t('newApp.source.build')} — ${t('newApp.zipUnavailable')}`,
    value: 'build',
    disable: !zipEnabled.value
  }
])

// Technical identifier derived from the name; unique enough for a first draft.
function identifier(name) {
  const base =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 80) || 'app'
  return `${base}.${Date.now().toString(36)}`
}

async function create() {
  busy.value = true
  error.value = ''
  try {
    const { data: app } = await accountApi.createApp({
      name: form.name.trim(),
      identifier: identifier(form.name),
      category_id: form.category_id
    })
    await accountApi.source(app.id, {
      source_type: form.source_type,
      external_url: form.source_type === 'url' ? form.external_url : null
    })
    router.replace(`/developer/apps/${app.id}`)
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = (await catalogApi.categories()).data
  } catch {
    // The category can also be chosen later in the workspace.
  } finally {
    loadingCategories.value = false
  }
})
</script>
<style scoped>
.new-app-card {
  max-width: 640px;
}
.source-choice {
  border: 1px solid var(--outline, rgba(0, 0, 0, 0.12));
  border-radius: 12px;
  padding: 8px 14px 14px;
  display: grid;
  gap: 10px;
}
.source-choice legend {
  padding: 0 6px;
  font-weight: 600;
}
.source-explain {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
}
</style>
