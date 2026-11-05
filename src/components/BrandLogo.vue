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
    <img
      v-if="!compact"
      class="pwa-brand__wordmark"
      src="/brand/pwa-store-wordmark-transparent.png"
      alt=""
      width="150"
      height="50"
      decoding="async"
    />
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
  width: 150px;
  height: 50px;
  object-fit: contain;
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
