<template>
  <span
    class="pwa-brand"
    :class="{
      'pwa-brand--compact': compact,
      'pwa-brand--responsive': responsive
    }"
    role="img"
    aria-label="PWA Store"
  >
    <img
      class="pwa-brand__icon"
      src="/brand/pwa-store-icon.png"
      alt=""
      width="44"
      height="44"
      decoding="async"
    />
    <span v-if="!compact" class="pwa-brand__wordmark" aria-hidden="true">
      <img
        class="pwa-brand__letters"
        src="/brand/pwa-store-wordmark-transparent.png"
        alt=""
        width="150"
        height="50"
        decoding="async"
      />
      <img
        class="pwa-brand__store"
        src="/brand/pwa-store-wordmark-transparent.png"
        alt=""
        width="150"
        height="50"
        decoding="async"
      />
    </span>
  </span>
</template>

<script setup>
defineProps({ compact: Boolean, responsive: Boolean })
</script>

<style scoped lang="scss">
.pwa-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  flex-shrink: 0;
  vertical-align: middle;
}
.pwa-brand__icon {
  width: 44px;
  height: 44px;
  object-fit: contain;
}
.pwa-brand__wordmark {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 150px;
  height: 50px;
}
.pwa-brand__letters,
.pwa-brand__store {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
// Both halves use the same artwork to preserve the exact lettering and gradients.
.pwa-brand__letters {
  clip-path: inset(0 50% 0 0);
}
.pwa-brand__store {
  clip-path: inset(0 0 0 50%);
  filter: brightness(0);
}
.body--dark .pwa-brand__store {
  filter: brightness(0) invert(1);
}
@media (max-width: 599px) {
  .pwa-brand--responsive .pwa-brand__wordmark {
    display: none;
  }
  .pwa-brand__icon {
    width: 38px;
    height: 38px;
  }
}
</style>
