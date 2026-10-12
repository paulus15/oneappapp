<template>
  <section class="cover-uploader">
    <h3>{{ t('cover.title') }}</h3>
    <p class="text-caption text-muted">{{ t('cover.help') }}</p>
    <ul class="cover-specs">
      <li>{{ t('cover.spec.format') }}</li>
      <li>{{ t('cover.spec.recommended') }}</li>
      <li>{{ t('cover.spec.minimum') }}</li>
      <li>{{ t('cover.spec.weight') }}</li>
      <li>{{ t('cover.spec.types') }}</li>
    </ul>

    <div
      class="drop-zone"
      :class="{ dragging, disabled: disable }"
      role="button"
      :tabindex="disable ? -1 : 0"
      :aria-label="t('cover.choose')"
      @click="pick"
      @keydown.enter.prevent="pick"
      @keydown.space.prevent="pick"
      @dragover.prevent="dragging = !disable"
      @dragleave="dragging = false"
      @drop.prevent="drop"
    >
      <q-icon name="add_photo_alternate" size="32px" />
      <span>{{ t('cover.drop') }}</span>
      <input
        ref="input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden-input"
        :disabled="disable"
        @change="choose($event.target.files[0])"
      />
    </div>
    <q-linear-progress
      v-if="busy"
      :value="progress"
      :indeterminate="progress >= 1"
      class="q-my-sm"
      :aria-label="t('cover.uploading')"
    />
    <p v-if="error" class="text-negative" role="alert">{{ error }}</p>

    <div v-if="current" class="cover-previews">
      <figure>
        <figcaption>{{ t('cover.previewDesktop') }}</figcaption>
        <div class="frame frame-desktop" :style="{ background: current.color }">
          <img :src="previewUrl" alt="" />
        </div>
      </figure>
      <figure>
        <figcaption>{{ t('cover.previewMobile') }}</figcaption>
        <div class="frame frame-mobile" :style="{ background: current.color }">
          <img :src="previewUrl" alt="" />
        </div>
      </figure>
    </div>
    <div v-if="current && !disable" class="workspace-actions">
      <q-btn
        flat
        no-caps
        icon="swap_horiz"
        :label="t('cover.replace')"
        @click="pick"
      />
      <q-btn
        flat
        no-caps
        color="negative"
        icon="delete"
        :label="t('cover.remove')"
        :loading="busy"
        @click="emit('remove')"
      />
    </div>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveMediaUrl } from '@/utils/media'

// Checks the image in the browser first (fast feedback), the server checks it again for real.
const props = defineProps({
  cover: { type: Object, default: null },
  disable: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }
})
const emit = defineEmits(['upload', 'remove'])
const { t } = useI18n()
const input = ref(null),
  dragging = ref(false),
  error = ref('')
const MAX_BYTES = 3 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

const current = computed(() => props.cover)
const previewUrl = computed(() => {
  const sources = props.cover?.sources || {}
  const set = sources.webp || sources.jpg || {}
  const url = set['1280'] || set['640'] || Object.values(set)[0]
  return url ? resolveMediaUrl(url) : ''
})

function pick() {
  if (!props.disable) input.value?.click()
}
function drop(event) {
  dragging.value = false
  if (!props.disable) choose(event.dataTransfer?.files?.[0])
}
function dimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      reject(new Error('decode'))
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
async function choose(file) {
  error.value = ''
  if (input.value) input.value.value = ''
  if (!file) return
  if (!TYPES.includes(file.type)) return (error.value = t('cover.error.type'))
  if (file.size > MAX_BYTES) return (error.value = t('cover.error.weight'))
  try {
    const { width, height } = await dimensions(file)
    if (width < 1280 || height < 720)
      return (error.value = t('cover.error.small'))
    if (Math.abs(width / height - 16 / 9) / (16 / 9) > 0.02)
      return (error.value = t('cover.error.ratio'))
  } catch {
    return (error.value = t('cover.error.type'))
  }
  emit('upload', file)
}
</script>
<style scoped>
.cover-uploader h3 {
  font-size: 16px;
  margin: 0 0 4px;
}
.cover-specs {
  margin: 4px 0 10px;
  padding-left: 18px;
  font-size: 13px;
  color: var(--muted);
}
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  border: 2px dashed var(--outline);
  border-radius: 14px;
  cursor: pointer;
  text-align: center;
  padding: 16px;
  transition: border-color var(--motion-fast) var(--motion-settle);
}
.drop-zone:hover,
.drop-zone:focus-visible,
.drop-zone.dragging {
  border-color: var(--q-primary);
  outline: none;
}
.drop-zone.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.hidden-input {
  display: none;
}
.cover-previews {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.cover-previews figure {
  margin: 0;
}
.cover-previews figcaption {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}
.frame {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--outline);
}
.frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Desktop shows the full 16:9 banner; phones crop it closer to the centre. */
.frame-desktop {
  width: 320px;
  aspect-ratio: 16 / 9;
}
.frame-mobile {
  width: 150px;
  aspect-ratio: 4 / 3;
}
</style>
