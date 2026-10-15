<template>
  <div class="growth-badges">
    <q-card flat bordered class="workspace-card">
      <h2>{{ ui('Badge « Disponible sur PWA Store »') }}</h2>
      <p>{{
        ui(
          'Ajoutez ce badge sur votre site, votre blog ou votre README : il mène directement à la fiche de votre application.'
        )
      }}</p>
      <div class="options">
        <div
          v-for="group in groups"
          :key="group.key"
          class="option"
          role="group"
          :aria-label="group.label"
        >
          <span class="option-label">{{ group.label }}</span>
          <q-btn-toggle
            v-model="options[group.key]"
            :options="group.options"
            no-caps
            unelevated
            toggle-color="primary"
            class="toggle"
          />
        </div>
      </div>
      <div class="preview" :class="`preview-${options.theme}`">
        <img
          :key="previewUrl"
          :src="previewUrl"
          :alt="alt"
          @load="previewFailed = false"
          @error="previewFailed = true"
        />
      </div>
      <p v-if="previewFailed" class="text-negative" role="alert">{{
        ui('L’aperçu du badge n’a pas pu être chargé.')
      }}</p>
      <div class="actions">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="download"
          :label="ui('Télécharger SVG')"
          :loading="downloading"
          @click="downloadSvg"
        />
      </div>
    </q-card>

    <q-card flat bordered class="workspace-card snippets">
      <div v-for="snippet in snippets" :key="snippet.key" class="snippet">
        <div class="snippet-head">
          <h3>{{ snippet.title }}</h3>
          <q-btn
            flat
            no-caps
            color="primary"
            icon="content_copy"
            :label="ui('Copier')"
            :aria-label="ui('Copier le code {p0}', { p0: snippet.title })"
            @click="copy(snippet.code)"
          />
        </div>
        <pre class="code" tabindex="0"><code>{{ snippet.code }}</code></pre>
      </div>
      <p class="text-muted note">{{
        ui(
          'Le badge indique seulement que l’application est disponible sur PWA Store. Il ne signifie pas qu’elle a été vérifiée ou recommandée.'
        )
      }}</p>
    </q-card>
  </div>
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'
import { growthApi } from '@/services/growth'
import {
  BADGE_DEFAULTS,
  badgeAlt,
  badgeHtml,
  badgeMarkdown,
  badgeParams,
  badgeUrl,
  copyText,
  downloadBlob,
  fileSlug,
  svgBlob
} from '@/utils/growth'

// { id, name, public_url }
const props = defineProps({ app: { type: Object, required: true } })
const $q = useQuasar()
const options = reactive({
  ...BADGE_DEFAULTS,
  lang: currentLocale() === 'en' ? 'en' : 'fr'
})
const previewFailed = ref(false),
  downloading = ref(false)

const groups = computed(() => [
  {
    key: 'style',
    label: ui('Texte'),
    options: [
      { value: 'available', label: ui('Disponible sur') },
      { value: 'discover', label: ui('Découvrir sur') }
    ]
  },
  {
    key: 'theme',
    label: ui('Thème'),
    options: [
      { value: 'light', label: ui('Clair') },
      { value: 'dark', label: ui('Sombre') }
    ]
  },
  {
    key: 'size',
    label: ui('Taille'),
    options: [
      { value: 'sm', label: ui('Petit') },
      { value: 'md', label: ui('Moyen') },
      { value: 'lg', label: ui('Grand') }
    ]
  },
  {
    key: 'lang',
    label: ui('Langue du badge'),
    options: [
      { value: 'fr', label: 'Français' },
      { value: 'en', label: 'English' }
    ]
  }
])

const previewUrl = computed(() => badgeUrl(props.app.id, options))
const alt = computed(() => badgeAlt(props.app.name, options))
const snippetInput = computed(() => ({
  appId: props.app.id,
  name: props.app.name,
  publicUrl: props.app.public_url,
  options
}))
const snippets = computed(() => [
  { key: 'html', title: ui('Code HTML'), code: badgeHtml(snippetInput.value) },
  {
    key: 'markdown',
    title: ui('Markdown'),
    code: badgeMarkdown(snippetInput.value)
  }
])

async function copy(code) {
  $q.notify(
    (await copyText(code))
      ? { type: 'positive', message: ui('Code copié.') }
      : {
          type: 'warning',
          message: ui('Copie impossible : sélectionnez le code pour le copier.')
        }
  )
}

async function downloadSvg() {
  downloading.value = true
  try {
    const params = badgeParams(options)
    const { data } = await growthApi.badge(props.app.id, params)
    downloadBlob(
      svgBlob(typeof data === 'string' ? data : await data.text()),
      `badge-${fileSlug(props.app.name)}-${params.style}-${params.theme}-${params.size}-${params.lang}.svg`
    )
  } catch {
    $q.notify({
      type: 'negative',
      message: ui('Le badge n’a pas pu être téléchargé.')
    })
  } finally {
    downloading.value = false
  }
}
defineExpose({ options, snippets })
</script>
<style scoped>
.growth-badges {
  display: grid;
  gap: 14px;
}
.options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
  margin: 12px 0 16px;
}
.option {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.option-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.toggle {
  flex-wrap: wrap;
  border: 1px solid var(--outline);
}
.preview {
  display: grid;
  place-items: center;
  min-height: 120px;
  padding: 20px;
  border: 1px dashed var(--outline);
  border-radius: 12px;
}
.preview img {
  max-width: 100%;
  height: auto;
}
.preview-light {
  background: #ffffff;
}
.preview-dark {
  background: #111318;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.snippets {
  display: grid;
  gap: 16px;
}
.snippet {
  min-width: 0;
}
.snippet-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.snippet-head h3 {
  margin: 0;
}
.code {
  margin: 6px 0 0;
  padding: 12px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 10px;
}
.code:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.note {
  margin: 0;
  font-size: 13px;
}
</style>
