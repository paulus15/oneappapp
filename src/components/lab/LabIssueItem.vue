<template>
  <article
    class="lab-issue"
    :class="[`status-${check.status}`, { open: isOpen }]"
    :data-check="check.id"
  >
    <h3 class="issue-heading">
      <button
        type="button"
        class="issue-toggle"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="bodyId"
        :disabled="forceOpen"
        @click="open = !open"
      >
        <q-icon
          :name="statusIcon(check.status).icon"
          :color="statusIcon(check.status).color"
          size="22px"
          aria-hidden="true"
        />
        <span class="issue-title">
          <span class="issue-label">{{ check.label }}</span>
          <span class="issue-meta">
            <span class="issue-status">{{ statusLabel(check.status) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ categoryLabel(check.category_key, check.category) }}</span>
          </span>
        </span>
        <span class="sr-only">{{ ui('Sévérité :') }}</span>
        <q-badge
          class="issue-severity"
          :color="severityColor(check.severity)"
          :label="severityLabel(check.severity)"
        />
        <q-icon
          v-if="!forceOpen"
          class="issue-chevron"
          name="expand_more"
          aria-hidden="true"
        />
      </button>
    </h3>
    <div v-show="isOpen" :id="bodyId" class="issue-body">
      <dl>
        <template v-if="check.detail">
          <dt>{{ ui('Constat') }}</dt>
          <dd class="issue-detail">{{ check.detail }}</dd>
        </template>
        <template v-if="check.impact">
          <dt>{{ ui('Impact') }}</dt>
          <dd class="issue-impact">{{ check.impact }}</dd>
        </template>
        <template v-if="check.recommendation">
          <dt>{{ ui('Comment corriger ?') }}</dt>
          <dd class="issue-recommendation">{{ check.recommendation }}</dd>
        </template>
      </dl>
      <div v-if="check.example" class="issue-example">
        <div class="example-head">
          <span>{{ ui('Exemple') }}</span>
          <q-btn
            v-if="!forceOpen"
            class="copy-example"
            flat
            dense
            no-caps
            size="sm"
            icon="content_copy"
            :label="copied ? ui('Copié') : ui('Copier')"
            :aria-label="
              ui('Copier l’exemple : {label}', { label: check.label })
            "
            @click="copy"
          />
        </div>
        <!-- Plain text only: the example is never interpreted as HTML. -->
        <pre><code>{{ check.example }}</code></pre>
      </div>
      <p v-if="check.measured_by === 'browser'" class="issue-note">
        {{ ui('À vérifier dans un navigateur.') }}
      </p>
      <div class="issue-actions">
        <a
          v-if="docUrl"
          class="issue-doc"
          :href="docUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ ui('Documentation') }}
          <span class="sr-only">{{ ui('(nouvel onglet)') }}</span>
          <q-icon name="open_in_new" aria-hidden="true"
        /></a>
        <!-- On paper the link is lost: print its address. -->
        <span v-if="docUrl && forceOpen" class="doc-url">{{ docUrl }}</span>
        <!-- Hook for the future assistant: off until the `assistant` tool ships. -->
        <q-btn
          v-if="assistant"
          class="issue-assistant"
          flat
          dense
          no-caps
          color="primary"
          icon="auto_awesome"
          :label="ui('Comment corriger ?')"
          @click="$emit('assist', check)"
        />
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { ui } from '@/i18n/text'
import { copyText } from '@/utils/growth'
import {
  categoryLabel,
  safeDocUrl,
  severityColor,
  severityLabel,
  statusIcon,
  statusLabel
} from '@/utils/lab'

const props = defineProps({
  check: { type: Object, required: true },
  // Print/export: every issue is shown expanded.
  forceOpen: Boolean,
  // Assistant hook ("Comment corriger ?" button), kept off for now.
  assistant: Boolean
})
defineEmits(['assist'])

const open = ref(false),
  copied = ref(false)
const isOpen = computed(() => props.forceOpen || open.value)
const bodyId = computed(
  () => `lab-issue-${String(props.check.id).replace(/[^\w-]/g, '-')}`
)
const docUrl = computed(() => safeDocUrl(props.check.doc_url))

let copiedTimer = null
onBeforeUnmount(() => clearTimeout(copiedTimer))
async function copy() {
  copied.value = await copyText(String(props.check.example))
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
}
</script>

<style scoped>
.lab-issue {
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 14px;
  break-inside: avoid;
}
.lab-issue + .lab-issue {
  margin-top: 8px;
}
.status-fail {
  border-left: 4px solid var(--q-negative);
}
.status-warn {
  border-left: 4px solid var(--q-warning);
}
.issue-heading {
  margin: 0;
  font-size: inherit;
}
.issue-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: 14px;
}
.issue-toggle:disabled {
  cursor: default;
}
.issue-toggle:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.issue-title {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;
}
.issue-label {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.issue-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--muted);
  font-size: 12.5px;
}
.issue-chevron {
  transition: transform 0.2s ease;
}
.open .issue-chevron {
  transform: rotate(180deg);
}
.issue-body {
  padding: 0 14px 14px 46px;
}
.issue-body dl {
  margin: 0;
}
.issue-body dt {
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 750;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.issue-body dd {
  margin: 2px 0 0;
  line-height: 1.5;
}
.issue-example {
  margin-top: 10px;
}
.example-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 750;
  color: var(--muted);
}
.issue-example pre {
  margin: 4px 0 0;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: color-mix(in srgb, var(--text) 6%, var(--surface));
  border-radius: 10px;
}
.issue-note {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}
.issue-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.issue-actions:empty {
  display: none;
}
.issue-doc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--pwa-link);
  font-weight: 650;
}
.doc-url {
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
@media print {
  .copy-example {
    display: none !important;
  }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@media (max-width: 600px) {
  .issue-body {
    padding-left: 14px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .issue-chevron {
    transition: none;
  }
}
</style>
