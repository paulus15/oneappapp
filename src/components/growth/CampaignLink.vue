<template>
  <!-- The link stays selectable text; the button copies it in one tap. -->
  <div class="campaign-link" :class="{ large }">
    <code class="link-text">{{ url }}</code>
    <q-btn
      :unelevated="large"
      :flat="!large"
      no-caps
      color="primary"
      :icon="copied ? 'check' : 'content_copy'"
      :label="copied ? ui('Copié') : ui('Copier le lien')"
      :aria-label="ui('Copier le lien {p0}', { p0: url })"
      class="copy-btn"
      @click="copy"
    />
  </div>
</template>
<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useQuasar } from 'quasar'
import { ui } from '@/i18n/text'
import { copyText } from '@/utils/growth'

const props = defineProps({
  url: { type: String, required: true },
  large: Boolean
})
const $q = useQuasar()
const copied = ref(false)
let timer = null

async function copy() {
  if (await copyText(props.url)) {
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2000)
    $q.notify({ type: 'positive', message: ui('Lien copié.') })
  } else
    $q.notify({
      type: 'warning',
      message: ui('Copie impossible : sélectionnez le lien pour le copier.')
    })
}
onBeforeUnmount(() => clearTimeout(timer))
defineExpose({ copy })
</script>
<style scoped>
.campaign-link {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.link-text {
  flex: 1 1 220px;
  min-width: 0;
  padding: 8px 10px;
  color: var(--text);
  font-size: 13px;
  overflow-wrap: anywhere;
  user-select: all;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 10px;
}
.large .link-text {
  font-size: 15px;
  padding: 12px 14px;
}
.large .copy-btn {
  min-height: 48px;
  padding: 0 20px;
  font-size: 15px;
}
@media (max-width: 599px) {
  .large .copy-btn {
    width: 100%;
  }
}
</style>
