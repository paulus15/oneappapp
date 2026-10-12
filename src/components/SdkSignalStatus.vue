<template>
  <div class="signal-status" role="status">
    <p class="signal-title">
      <q-icon
        :name="received ? 'check_circle' : 'info'"
        :color="received ? 'positive' : 'grey-7'"
      />
      {{ title }}
    </p>
    <p class="signal-caption">{{
      received
        ? t('sdk.received', {
            date: new Date(info.last_signal_at).toLocaleString(locale)
          })
        : t('sdk.collection.noData')
    }}</p>
    <p v-if="!published" class="signal-caption">{{
      t('sdk.afterPublication')
    }}</p>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({
  info: { type: Object, required: true },
  published: { type: Boolean, default: false }
})
const { t, te, locale } = useI18n()
const received = computed(() => !!props.info.last_signal_at)
const title = computed(() => {
  if (props.info.check?.csp_blocks?.length) return t('sdk.collection.blocked')
  const status = props.info.check?.status
  if (status && status !== 'connected' && te(`sdk.check.status.${status}`))
    return t(`sdk.check.status.${status}`)
  if (received.value) return t('sdk.collection.received')
  return t(
    status === 'connected'
      ? 'sdk.collection.waiting'
      : 'sdk.collection.unchecked'
  )
})
</script>
<style scoped>
.signal-status {
  margin-block: 10px;
}
.signal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin: 0;
}
.signal-caption {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
