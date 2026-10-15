<template>
  <!-- Print view of one analysis (Exporter en PDF): light theme, no navigation. -->
  <main class="lab-print">
    <div class="print-toolbar no-print">
      <p>
        {{
          ui('Utilisez « Enregistrer en PDF » dans la fenêtre d’impression.')
        }}
      </p>
      <button
        type="button"
        class="print-again"
        :disabled="!analysis"
        @click="print"
      >
        {{ ui('Imprimer / Enregistrer en PDF') }}
      </button>
    </div>

    <p v-if="loading" role="status">{{ ui('Chargement…') }}</p>
    <p v-else-if="error" class="print-error" role="alert">{{ error }}</p>
    <template v-else-if="analysis">
      <header class="print-header">
        <p class="print-brand">{{ ui('Labo PWA — rapport d’analyse') }}</p>
        <h1 class="print-url">{{ analysis.url }}</h1>
        <p v-if="analysis.final_url && analysis.final_url !== analysis.url">
          {{ ui('Adresse finale : {url}', { url: analysis.final_url }) }}
        </p>
        <p class="print-date">
          {{ ui('Analyse du {date}', { date: labDate(analysis.created_at) }) }}
        </p>
      </header>
      <LabProReport v-if="pro" :analysis="analysis" print />
      <div v-else class="lab-legacy-report">
        <LabLegacyReport :analysis="analysis" />
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LabLegacyReport from '@/components/lab/LabLegacyReport.vue'
import LabProReport from '@/components/lab/LabProReport.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { labApi } from '@/services/lab'
import { isProReport, labDate } from '@/utils/lab'

const route = useRoute()
const analysis = ref(null),
  loading = ref(true),
  error = ref('')
const pro = computed(() => isProReport(analysis.value))

function print() {
  window.print()
}

// The browser proposes the page title as the PDF file name.
const previousTitle = document.title
onBeforeUnmount(() => (document.title = previousTitle))
function printTitle(data) {
  let host = data.url
  try {
    host = new URL(data.url).host
  } catch {
    // Keep the raw address.
  }
  const day = data.created_at ? String(data.created_at).slice(0, 10) : ''
  return [ui('Labo PWA'), host, day].filter(Boolean).join(' — ')
}

onMounted(async () => {
  try {
    analysis.value = (await labApi.show(route.params.id)).data
    document.title = printTitle(analysis.value)
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
  if (!analysis.value) return
  // Print once the report is in the page (and fonts are ready when supported).
  await nextTick()
  await document.fonts?.ready?.catch?.(() => {})
  print()
})
</script>

<style scoped>
/* Light theme whatever the app theme: the tokens are redefined for this page. */
.lab-print {
  --pwa-background: #ffffff;
  --pwa-surface: #ffffff;
  --pwa-text: #08132d;
  --pwa-muted: #475569;
  --pwa-border: #d4dceb;
  --pwa-link: #0645c9;
  --page: #ffffff;
  --surface: #ffffff;
  --surface-low: #ffffff;
  --text: #08132d;
  --muted: #475569;
  --outline: #d4dceb;
  --primary: #075bff;
  --pwa-primary: #075bff;
  --primary-soft: #e8efff;
  --primary-text: #0645c9;
  --pwa-primary-soft: #e8efff;
  --surface-high: #edf2fb;
  --surface-highest: #e0e9f8;
  --pwa-surface-high: #edf2fb;
  --pwa-surface-highest: #e0e9f8;
  --glass: #ffffff;
  color-scheme: light;
  max-width: 960px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 16px 48px;
  color: var(--text);
  background: #ffffff;
}
.print-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #eef3ff;
  border-radius: 12px;
}
.print-toolbar p {
  margin: 0;
}
.print-again {
  min-height: 40px;
  padding: 0 16px;
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  background: #075bff;
  border: 0;
  border-radius: 999px;
}
.print-again:focus-visible {
  outline: 3px solid #08132d;
  outline-offset: 2px;
}
.print-header {
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 2px solid #08132d;
}
.print-header p {
  margin: 2px 0;
  color: var(--muted);
}
.print-brand {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 12px;
}
.print-url {
  margin: 4px 0;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.print-error {
  color: #b00020;
}
@media print {
  .no-print {
    display: none !important;
  }
  .lab-print {
    max-width: none;
    padding: 0;
  }
}
</style>

<style>
@media print {
  @page {
    margin: 14mm;
  }
  html,
  body {
    background: #ffffff !important;
    color: #08132d !important;
  }
  body * {
    box-shadow: none !important;
  }
}
</style>
