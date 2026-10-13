<template>
  <div v-if="items.length" class="app-screenshots">
    <div class="screenshots-header row items-center justify-between q-mb-sm">
      <div class="row items-center q-gutter-x-sm">
        <h2 id="shots-title" class="section-title q-my-none">
          {{ ui("Captures d'écran") }}
        </h2>
        <q-badge
          rounded
          color="primary"
          class="shots-count-badge"
          :label="`${currentIndex + 1} / ${items.length}`"
        />
      </div>

      <!-- Mode switcher (Une à une vs Toutes en défilement) -->
      <div v-if="items.length > 1" class="mode-toggle row items-center">
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          :class="{ 'is-active-mode': mode === 'single' }"
          icon="view_carousel"
          :label="ui('Une par une')"
          class="mode-btn"
          @click="mode = 'single'"
        />
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          :class="{ 'is-active-mode': mode === 'grid' }"
          icon="view_stream"
          :label="ui('Toutes')"
          class="mode-btn"
          @click="mode = 'grid'"
        />
      </div>
    </div>

    <!-- Mode 1: Affichage une à une (Carousel / Présentation unitaire) -->
    <div
      v-if="mode === 'single'"
      class="single-shot-viewport"
      v-touch-swipe.horizontal="handleSwipe"
      tabindex="0"
      @keydown.left.prevent="prev"
      @keydown.right.prevent="next"
    >
      <div class="single-shot-stage">
        <!-- Bouton précédent -->
        <q-btn
          v-if="items.length > 1"
          round
          unelevated
          icon="chevron_left"
          class="shot-nav-btn shot-nav-prev"
          :aria-label="ui('Capture précédente')"
          @click="prev"
        />

        <!-- Image active -->
        <div
          class="single-shot-card"
          :class="`shot-${currentShot.device}`"
          @click="openLightbox(currentIndex)"
        >
          <img
            :src="currentShot.src"
            :alt="shotAlt(currentIndex)"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            class="single-shot-img"
          />

          <!-- Overlay d'info et zoom -->
          <div class="shot-overlay">
            <span class="shot-device-chip">
              {{
                currentShot.device === 'tablet' ? ui('Tablette') : ui('Mobile')
              }}
            </span>
            <q-btn
              round
              dense
              unelevated
              icon="zoom_in"
              class="shot-zoom-btn"
              :aria-label="ui('Agrandir')"
              @click.stop="openLightbox(currentIndex)"
            />
          </div>
        </div>

        <!-- Bouton suivant -->
        <q-btn
          v-if="items.length > 1"
          round
          unelevated
          icon="chevron_right"
          class="shot-nav-btn shot-nav-next"
          :aria-label="ui('Capture suivante')"
          @click="next"
        />
      </div>

      <!-- Bande de miniatures / navigation rapide -->
      <div v-if="items.length > 1" class="shot-thumbnails-rail">
        <button
          v-for="(shot, index) in items"
          :key="shot.key"
          type="button"
          class="shot-thumb-btn"
          :class="{
            'is-active': index === currentIndex,
            [`thumb-${shot.device}`]: true
          }"
          :aria-label="shotAlt(index)"
          @click="currentIndex = index"
        >
          <img :src="shot.src" :alt="''" loading="lazy" />
        </button>
      </div>
    </div>

    <!-- Mode 2: Galerie en défilement horizontal (ScrollRow) -->
    <div v-else class="grid-shots-viewport">
      <ScrollRow item-width="auto" :watch-key="items.length">
        <figure
          v-for="(shot, i) in items"
          :key="shot.key"
          class="screenshot-card clickable-shot"
          :class="`shot-${shot.device}`"
          @click="openLightbox(i)"
        >
          <img
            :src="shot.src"
            :alt="shotAlt(i)"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
          <div class="shot-card-badge">
            {{ shot.device === 'tablet' ? ui('Tablette') : ui('Mobile') }}
          </div>
        </figure>
      </ScrollRow>
    </div>

    <!-- Visionneuse plein écran / Lightbox (une à une en grand format) -->
    <q-dialog
      v-model="lightboxOpen"
      maximized
      transition-show="fade"
      transition-hide="fade"
      @keydown.left="prevLightbox"
      @keydown.right="nextLightbox"
      @keydown.esc="lightboxOpen = false"
    >
      <div
        class="lightbox-backdrop"
        v-touch-swipe.horizontal="handleLightboxSwipe"
      >
        <!-- Barre supérieure -->
        <header class="lightbox-header">
          <div class="lightbox-info">
            <span v-if="appName" class="lightbox-app-name">{{ appName }}</span>
            <span class="lightbox-counter">
              {{
                ui('Capture {n} sur {total}', {
                  n: lightboxIndex + 1,
                  total: items.length
                })
              }}
            </span>
            <span class="lightbox-device-chip">
              {{
                currentLightboxShot.device === 'tablet'
                  ? ui('Tablette')
                  : ui('Mobile')
              }}
            </span>
          </div>
          <q-btn
            round
            flat
            icon="close"
            class="lightbox-close-btn"
            :aria-label="ui('Fermer')"
            v-close-popup
          />
        </header>

        <!-- Zone principale de visualisation -->
        <main class="lightbox-main">
          <q-btn
            v-if="items.length > 1"
            round
            unelevated
            icon="chevron_left"
            class="lightbox-nav-btn lightbox-prev"
            :aria-label="ui('Capture précédente')"
            @click="prevLightbox"
          />

          <div
            class="lightbox-stage"
            :class="`stage-${currentLightboxShot.device}`"
          >
            <img
              :src="currentLightboxShot.src"
              :alt="shotAlt(lightboxIndex)"
              class="lightbox-img"
            />
          </div>

          <q-btn
            v-if="items.length > 1"
            round
            unelevated
            icon="chevron_right"
            class="lightbox-nav-btn lightbox-next"
            :aria-label="ui('Capture suivante')"
            @click="nextLightbox"
          />
        </main>

        <!-- Bande de miniatures en bas du lightbox -->
        <footer v-if="items.length > 1" class="lightbox-footer">
          <div class="lightbox-thumbnails">
            <button
              v-for="(shot, index) in items"
              :key="shot.key"
              type="button"
              class="lightbox-thumb"
              :class="{ 'is-active': index === lightboxIndex }"
              :aria-label="shotAlt(index)"
              @click="lightboxIndex = index"
            >
              <img :src="shot.src" :alt="''" loading="lazy" />
            </button>
          </div>
        </footer>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ui } from '@/i18n/text'
import ScrollRow from '@/components/ScrollRow.vue'

const props = defineProps({
  screenshots: {
    type: Array,
    default: () => []
  },
  appName: {
    type: String,
    default: ''
  }
})

const mode = ref('single')
const currentIndex = ref(0)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const items = computed(() => {
  return (props.screenshots || []).map((item, index) => {
    if (typeof item === 'string') {
      return {
        key: `shot-${index}`,
        device: 'mobile',
        src: item
      }
    }
    return {
      key: item.key || `${item.device || 'mobile'}-${index}`,
      device: item.device || 'mobile',
      src: item.src
    }
  })
})

const currentShot = computed(() => {
  return items.value[currentIndex.value] || items.value[0] || {}
})

const currentLightboxShot = computed(() => {
  return items.value[lightboxIndex.value] || items.value[0] || {}
})

watch(
  () => items.value.length,
  len => {
    if (currentIndex.value >= len) {
      currentIndex.value = Math.max(0, len - 1)
    }
  }
)

function shotAlt(index) {
  const n = index + 1
  return props.appName
    ? `${props.appName} - ${ui('Capture')} ${n}`
    : `${ui('Capture')} ${n}`
}

function prev() {
  if (!items.value.length) return
  currentIndex.value =
    (currentIndex.value - 1 + items.value.length) % items.value.length
}

function next() {
  if (!items.value.length) return
  currentIndex.value = (currentIndex.value + 1) % items.value.length
}

function handleSwipe({ direction }) {
  if (direction === 'left') next()
  if (direction === 'right') prev()
}

function openLightbox(index = 0) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function prevLightbox() {
  if (!items.value.length) return
  lightboxIndex.value =
    (lightboxIndex.value - 1 + items.value.length) % items.value.length
}

function nextLightbox() {
  if (!items.value.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % items.value.length
}

function handleLightboxSwipe({ direction }) {
  if (direction === 'left') nextLightbox()
  if (direction === 'right') prevLightbox()
}
</script>

<style scoped>
.app-screenshots {
  position: relative;
  width: 100%;
}

.screenshots-header {
  gap: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
}

.shots-count-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
}

.mode-toggle {
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 20px;
  padding: 2px;
  gap: 2px;
}

.mode-btn {
  border-radius: 16px;
  color: var(--muted);
  font-size: 12px;
  padding: 4px 10px;
  transition: all 0.2s ease;
}

.mode-btn.is-active-mode {
  background: var(--surface-low);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Mode une à une */
.single-shot-viewport {
  display: flex;
  flex-direction: column;
  align-items: center;
  outline: none;
  width: 100%;
  margin-top: 8px;
}

.single-shot-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 0;
}

.single-shot-card {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  user-select: none;
}

.single-shot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
}

.single-shot-card.shot-mobile {
  width: clamp(200px, 55vw, 290px);
  aspect-ratio: 9 / 19.5;
}

.single-shot-card.shot-tablet {
  width: clamp(320px, 80vw, 560px);
  aspect-ratio: 4 / 3;
}

.single-shot-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shot-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.shot-device-chip {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.3px;
}

.shot-zoom-btn {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  width: 32px;
  height: 32px;
  font-size: 12px;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.shot-zoom-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.08);
}

.shot-nav-btn {
  position: absolute;
  z-index: 3;
  width: 42px;
  height: 42px;
  color: var(--text);
  background: var(--surface-low);
  border: 1px solid var(--outline);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.shot-nav-btn:hover {
  color: var(--primary);
  transform: scale(1.06);
}

.shot-nav-prev {
  left: 8px;
}

.shot-nav-next {
  right: 8px;
}

/* Bande de miniatures */
.shot-thumbnails-rail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  max-width: 100%;
  overflow-x: auto;
  padding: 6px 12px;
  scrollbar-width: thin;
}

.shot-thumb-btn {
  position: relative;
  border: 2px solid transparent;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-high);
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  flex-shrink: 0;
}

.shot-thumb-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.shot-thumb-btn.is-active {
  opacity: 1;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
  transform: scale(1.05);
}

.shot-thumb-btn.thumb-mobile {
  width: 36px;
  aspect-ratio: 9 / 19.5;
}

.shot-thumb-btn.thumb-tablet {
  width: 58px;
  aspect-ratio: 4 / 3;
}

.shot-thumb-btn img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Mode toutes en défilement */
.clickable-shot {
  cursor: pointer;
  position: relative;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.clickable-shot:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.shot-card-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
}

.screenshot-card {
  margin: 0;
  overflow: hidden;
  background: var(--surface-high);
  border: 1px solid var(--outline);
  border-radius: 14px;
}

.screenshot-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shot-mobile {
  width: clamp(140px, 36vw, 200px);
  aspect-ratio: 9 / 19.5;
}

.shot-tablet {
  width: clamp(240px, 64vw, 420px);
  aspect-ratio: 4 / 3;
}

/* Lightbox plein écran */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 12, 24, 0.94);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  z-index: 6000;
  color: #fff;
  outline: none;
}

.lightbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.lightbox-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lightbox-app-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.lightbox-counter {
  font-size: 13px;
  color: #aabbd7;
}

.lightbox-device-chip {
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}

.lightbox-close-btn {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s ease;
}

.lightbox-close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lightbox-main {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 60px;
  min-height: 0;
}

.lightbox-stage {
  max-width: 90vw;
  max-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: calc(100vh - 160px);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.lightbox-nav-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-50%) scale(1.06);
}

.lightbox-prev {
  left: 20px;
}

.lightbox-next {
  right: 20px;
}

.lightbox-footer {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.lightbox-thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  max-width: 100%;
  padding: 4px;
}

.lightbox-thumb {
  width: 44px;
  height: 60px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  opacity: 0.5;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  flex-shrink: 0;
}

.lightbox-thumb:hover {
  opacity: 0.85;
}

.lightbox-thumb.is-active {
  opacity: 1;
  border-color: #38bdf8;
  transform: scale(1.08);
}

.lightbox-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 600px) {
  .lightbox-main {
    padding: 12px 10px;
  }
  .lightbox-nav-btn {
    width: 38px;
    height: 38px;
  }
  .lightbox-prev {
    left: 8px;
  }
  .lightbox-next {
    right: 8px;
  }
}
</style>
