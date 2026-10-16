<template>
  <!-- Shows a token or a webhook secret ONCE. The value lives only in the parent's local
       ref, which the parent clears on "closed"; it never reaches a list or a store. -->
  <q-dialog
    :model-value="modelValue"
    persistent
    :maximized="$q.screen.lt.sm"
    @update:model-value="value => !value && close()"
    @hide="$emit('closed')"
  >
    <q-card class="reveal-card" role="alertdialog" :aria-labelledby="titleId">
      <q-card-section>
        <h2 :id="titleId">{{ title }}</h2>
        <div class="reveal-warning" role="alert">
          <q-icon name="warning" size="22px" aria-hidden="true" />
          <p>
            <strong>{{ warningTitle }}</strong>
            {{ warningText }}
          </p>
        </div>
        <div class="secret-row">
          <code class="secret-value" :aria-label="valueLabel">{{
            secret
          }}</code>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="copy-secret"
            :icon="copied ? 'check' : 'content_copy'"
            :label="copied ? ui('Copié') : ui('Copier')"
            :aria-label="copyLabel"
            @click="copy"
          />
        </div>
        <q-checkbox
          v-model="confirmed"
          class="confirm-copied"
          :label="confirmLabel"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="close-reveal"
          :label="ui('Fermer')"
          :disable="!confirmed"
          @click="close"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { ui } from '@/i18n/text'
import { copyText } from '@/utils/growth'

const props = defineProps({
  modelValue: Boolean,
  secret: { type: String, default: '' },
  // token | secret
  kind: { type: String, default: 'token' }
})
const emit = defineEmits(['update:modelValue', 'closed'])
const $q = useQuasar()
const confirmed = ref(false),
  copied = ref(false)
let timer = null
const titleId = `reveal-${Math.random().toString(36).slice(2, 9)}`

const isToken = computed(() => props.kind === 'token')
const title = computed(() =>
  isToken.value ? ui('Votre jeton d’accès') : ui('Secret de signature')
)
const warningTitle = computed(() =>
  isToken.value
    ? ui('Ce jeton ne sera plus jamais affiché.')
    : ui('Ce secret ne sera plus jamais affiché.')
)
const warningText = computed(() =>
  isToken.value
    ? ui(
        'Copiez-le maintenant et rangez-le dans un coffre de secrets (par exemple les secrets de votre dépôt GitHub). Ne le collez jamais dans votre code.'
      )
    : ui(
        'Copiez-le maintenant : votre serveur en a besoin pour vérifier la signature de chaque événement reçu.'
      )
)
const valueLabel = computed(() =>
  isToken.value ? ui('Jeton d’accès') : ui('Secret de signature')
)
const copyLabel = computed(() =>
  isToken.value ? ui('Copier le jeton') : ui('Copier le secret')
)
const confirmLabel = computed(() =>
  isToken.value ? ui('J’ai copié le jeton') : ui('J’ai copié le secret')
)

watch(
  () => props.modelValue,
  open => {
    if (open) {
      confirmed.value = false
      copied.value = false
    }
  }
)

async function copy() {
  if (!props.secret) return
  if (await copyText(props.secret)) {
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2000)
    $q.notify({
      type: 'positive',
      message: ui('Copié dans le presse-papiers.')
    })
  } else
    $q.notify({
      type: 'warning',
      message: ui('Copie impossible : sélectionnez la valeur pour la copier.')
    })
}
function close() {
  if (!confirmed.value) return
  emit('update:modelValue', false)
}
onBeforeUnmount(() => clearTimeout(timer))
defineExpose({ copy, close, confirmed })
</script>
<style scoped>
.reveal-card {
  width: min(560px, 100vw);
}
.reveal-card h2 {
  margin: 0 0 12px;
  font-size: 20px;
}
.reveal-warning {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  margin-bottom: 14px;
  color: var(--text);
  background: color-mix(in srgb, var(--q-warning) 16%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--q-warning) 55%, transparent);
  border-radius: 12px;
}
.reveal-warning .q-icon {
  flex: none;
  color: var(--q-warning);
}
.reveal-warning p {
  margin: 0;
  line-height: 1.5;
}
.reveal-warning strong {
  display: block;
}
.secret-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.secret-value {
  flex: 1 1 260px;
  min-width: 0;
  padding: 12px 14px;
  color: var(--text);
  font-size: 14px;
  overflow-wrap: anywhere;
  user-select: all;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 10px;
}
.copy-secret {
  min-height: 46px;
}
@media (max-width: 599px) {
  .copy-secret {
    width: 100%;
  }
}
</style>
