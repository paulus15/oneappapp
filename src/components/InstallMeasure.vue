<template>
  <section class="workspace-card install-measure">
    <h3>{{ t('sdk.title') }}</h3>
    <p class="text-muted">{{ t('sdk.intro') }}</p>
    <q-linear-progress v-if="loading" indeterminate />
    <template v-if="info">
      <ol class="sdk-steps">
        <li>{{ t('sdk.step1') }}</li>
        <li>{{ t('sdk.step2') }}</li>
        <li>{{ t('sdk.step3') }}</li>
      </ol>
      <div class="snippet">
        <code>{{ info.snippet }}</code>
        <q-btn
          flat
          dense
          no-caps
          icon="content_copy"
          :label="copied ? t('sdk.copied') : t('sdk.copy')"
          @click="copy"
        />
        <!-- Screen readers hear the confirmation; the button label alone is not announced. -->
        <span class="sr-only" aria-live="polite">{{
          copied ? t('sdk.copied') : ''
        }}</span>
      </div>
      <p class="text-caption text-muted">{{
        t('sdk.origins', { origins: info.origins.join(', ') || '—' })
      }}</p>
      <p class="text-caption text-muted">{{ t('sdk.csp', { host: host }) }}</p>
      <!-- Checked from PWA Store: is the line really on the developer's site? -->
      <div class="sdk-check">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="travel_explore"
          :label="t('sdk.check.button')"
          :loading="checking"
          @click="check"
        />
        <template v-if="info.check">
          <div class="sdk-status">
            <q-icon
              :name="CHECK_ICONS[info.check.status] || 'help'"
              :color="
                info.check.status === 'connected' ? 'positive' : 'orange-8'
              "
              size="22px"
            />
            <span>{{ t(`sdk.check.status.${info.check.status}`) }}</span>
          </div>
          <p class="text-caption text-muted">{{
            t(`sdk.check.help.${info.check.status}`, {
              url: info.check.url || '—',
              found: info.check.found_src || '—'
            })
          }}</p>
          <p
            v-if="info.check.csp_blocks?.length"
            class="text-caption text-negative"
            >{{
              t('sdk.check.csp', {
                directives: info.check.csp_blocks.join(', '),
                host
              })
            }}</p
          >
          <p class="text-caption text-muted">{{
            t('sdk.check.at', { date: formatDate(info.check.checked_at) })
          }}</p>
        </template>
      </div>
      <SdkSignalStatus :info="info" :published="published" />
      <p v-if="info.last_signal_at" class="text-caption text-muted">{{
        t('sdk.collection.period')
      }}</p>
      <dl class="sdk-counts">
        <div>
          <dt>{{ t('sdk.installs') }}<InstallCountHelp kind="confirmed" /></dt>
          <dd>{{
            info.last_signal_at
              ? Number(info.confirmed_installs || 0).toLocaleString(locale)
              : '—'
          }}</dd>
        </div>
        <div>
          <dt>{{ t('sdk.launches') }}</dt>
          <dd>{{
            info.last_signal_at
              ? Number(info.launches || 0).toLocaleString(locale)
              : '—'
          }}</dd>
        </div>
        <div>
          <dt>{{ t('sdk.recognized') }}</dt>
          <dd>{{
            info.last_signal_at
              ? Number(info.recognized_accounts || 0).toLocaleString(locale)
              : '—'
          }}</dd>
        </div>
      </dl>
      <p class="text-caption text-muted">{{ t('sdk.privacy') }}</p>
    </template>
    <p v-if="error" class="text-negative" role="alert">{{ error }}</p>
  </section>
</template>
<script setup>
import SdkSignalStatus from '@/components/SdkSignalStatus.vue'
import InstallCountHelp from '@/components/InstallCountHelp.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { accountApi, apiMessage } from '@/services/account'

// Self-hosted PWAs confirm their installs with one script line the developer adds.
const props = defineProps({
  appId: { type: [Number, String], required: true },
  published: { type: Boolean, default: false }
})
const { t, locale } = useI18n()
const CHECK_ICONS = {
  connected: 'check_circle',
  missing: 'link_off',
  wrong_key: 'key_off',
  wrong_host: 'dns',
  unreachable: 'cloud_off',
  no_url: 'link_off'
}
const checking = ref(false)
const info = ref(null),
  loading = ref(true),
  error = ref(''),
  copied = ref(false)
const host = computed(() => {
  try {
    return new URL(info.value.snippet.match(/src="([^"]+)"/)[1]).origin
  } catch {
    return ''
  }
})
const formatDate = value => new Date(value).toLocaleString(locale.value)

async function check() {
  checking.value = true
  error.value = ''
  try {
    info.value = (await accountApi.checkInstallSignals(props.appId)).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    checking.value = false
  }
}
async function copy() {
  try {
    await navigator.clipboard.writeText(info.value.snippet)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    error.value = t('sdk.copyFailed')
  }
}
onMounted(async () => {
  try {
    info.value = (await accountApi.installSignals(props.appId)).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
})
</script>
<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.install-measure {
  margin-top: 16px;
  max-width: 820px;
}
.sdk-steps {
  margin: 0 0 10px;
  padding-left: 20px;
  line-height: 1.7;
}
.snippet {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-high);
  border: 1px solid var(--outline);
}
.snippet code {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.sdk-check {
  margin: 12px 0;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--outline);
}
.sdk-check p {
  margin: 4px 0 0;
}
.sdk-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  font-weight: 600;
}
.sdk-counts {
  display: flex;
  gap: 24px;
  margin: 0 0 8px;
}
.sdk-counts dt {
  font-size: 12px;
  color: var(--muted);
}
.sdk-counts dd {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
</style>
