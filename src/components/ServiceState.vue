<template>
  <main class="service-state">
    <router-link
      to="/"
      class="service-brand"
      :aria-label="ui('Retour à l’accueil')"
      ><BrandLogo
    /></router-link>
    <section class="service-card" aria-live="polite">
      <span class="service-icon" aria-hidden="true"
        ><q-icon :name="icon"
      /></span>
      <span class="service-code">{{ code }}</span>
      <h1>{{ title }}</h1>
      <p>{{ text }}</p>
      <div class="service-actions"><slot /></div>
    </section>
  </main>
</template>
<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
import { ui } from '@/i18n/text'
defineProps({
  code: String,
  title: String,
  text: String,
  icon: { type: String, default: 'cloud_off' }
})
</script>
<style scoped>
.service-state {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 100px 24px 48px;
  background:
    radial-gradient(
      ellipse at 50% 25%,
      color-mix(in srgb, var(--pwa-primary) 10%, transparent),
      transparent 65%
    ),
    var(--surface);
  color: var(--text);
}
.service-brand {
  position: absolute;
  top: 28px;
  left: 28px;
}
.service-card {
  max-width: 560px;
  text-align: center;
}
.service-icon {
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  margin: 0 auto 24px;
  border-radius: 28px;
  background: color-mix(in srgb, var(--pwa-primary) 12%, var(--surface));
  color: var(--pwa-primary);
  font-size: 42px;
}
.service-code {
  color: var(--pwa-primary);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.08em;
}
h1 {
  font-size: clamp(28px, 5vw, 42px);
  line-height: 1.15;
  letter-spacing: -0.035em;
  margin: 12px 0 16px;
}
p {
  color: var(--muted);
  line-height: 1.7;
  white-space: pre-line;
}
.service-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}
</style>
