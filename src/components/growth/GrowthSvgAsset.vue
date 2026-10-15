<template>
  <!-- Authenticated SVG (QR code, share card): preview plus SVG and PNG downloads. -->
  <div class="svg-asset">
    <div class="frame" :style="{ aspectRatio: `${pngWidth} / ${pngHeight}` }">
      <q-skeleton
        v-if="asset.loading.value"
        class="fill"
        role="status"
        :aria-label="ui('Chargement…')"
      />
      <div v-else-if="asset.error.value" class="fill failed" role="alert">
        <q-icon name="broken_image" size="28px" aria-hidden="true" />
        <span>{{
          asset.refusal.value || ui('L’aperçu n’a pas pu être chargé.')
        }}</span>
        <q-btn
          v-if="!asset.refusal.value"
          flat
          dense
          no-caps
          color="primary"
          icon="refresh"
          :label="ui('Réessayer')"
          @click="reload"
        />
      </div>
      <img v-else-if="asset.url.value" :src="asset.url.value" :alt="alt" />
    </div>
    <div v-if="!asset.refusal.value" class="actions">
      <q-btn
        outline
        no-caps
        color="primary"
        icon="download"
        :label="ui('Télécharger SVG')"
        :disable="!asset.text.value"
        @click="asset.downloadSvg(`${filename}.svg`)"
      />
      <q-btn
        outline
        no-caps
        color="primary"
        icon="image"
        :label="ui('Télécharger PNG')"
        :disable="!asset.text.value"
        :loading="rendering"
        @click="downloadPng"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useSvgAsset } from '@/composables/useSvgAsset'
import { ui } from '@/i18n/text'

const props = defineProps({
  // () => axios promise of the SVG text.
  fetch: { type: Function, required: true },
  // Changing it loads a new image (another campaign or app).
  source: { type: [String, Number], required: true },
  alt: { type: String, required: true },
  filename: { type: String, required: true },
  pngWidth: { type: Number, default: 1024 },
  pngHeight: { type: Number, default: 1024 }
})
const $q = useQuasar()
const asset = useSvgAsset(() => props.fetch())
const rendering = ref(false)

const reload = () => asset.load()
watch(() => props.source, reload, { immediate: true })

async function downloadPng() {
  rendering.value = true
  try {
    await asset.downloadPng(
      `${props.filename}.png`,
      props.pngWidth,
      props.pngHeight
    )
  } catch {
    $q.notify({
      type: 'negative',
      message: ui('La conversion en PNG a échoué. Téléchargez la version SVG.')
    })
  } finally {
    rendering.value = false
  }
}
defineExpose({ asset, downloadPng })
</script>
<style scoped>
.svg-asset {
  display: grid;
  gap: 10px;
  min-width: 0;
}
.frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.frame img,
.fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.frame img {
  object-fit: contain;
}
.failed {
  overflow: auto;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 6px;
  padding: 12px;
  color: var(--text);
  text-align: center;
  background: var(--surface);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
