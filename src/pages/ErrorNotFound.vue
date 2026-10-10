<template>
  <main class="not-found-page">
    <router-link to="/" class="not-found-brand" aria-label="PWA Store, accueil"
      ><BrandLogo
    /></router-link>
    <div class="not-found-orb orb-one" aria-hidden="true" />
    <div class="not-found-orb orb-two" aria-hidden="true" />

    <section class="not-found-card">
      <div class="error-visual" aria-hidden="true">
        <span>4</span>
        <div class="lost-app"><q-icon name="travel_explore" /></div>
        <span>4</span>
      </div>
      <span class="error-kicker">Page introuvable</span>
      <h1>Cette application s’est égarée.</h1>
      <p
        >Le lien a peut-être changé ou la page n’existe plus. Revenez au Store
        pour poursuivre votre exploration.</p
      >
      <div class="error-actions">
        <q-btn
          unelevated
          no-caps
          icon="home"
          label="Retour à l’accueil"
          to="/"
          class="home-action"
        />
        <q-btn
          flat
          no-caps
          icon="arrow_back"
          label="Page précédente"
          @click="$router.back()"
        />
      </div>
    </section>
  </main>
</template>

<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
</script>

<style scoped lang="scss">
.not-found-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 80px 20px 30px;
  color: var(--pwa-text);
  background: var(--pwa-background);
}
.not-found-brand {
  position: absolute;
  top: 28px;
  left: 30px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--pwa-on-primary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 800;
}
.not-found-brand .q-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background: var(--pwa-primary);
  border-radius: 10px;
}
.not-found-card {
  position: relative;
  z-index: 2;
  width: min(620px, 100%);
  text-align: center;
}
.error-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 4vw, 28px);
  color: var(--pwa-muted);
  font-size: clamp(92px, 19vw, 160px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.08em;
}
.lost-app {
  width: clamp(78px, 13vw, 112px);
  height: clamp(78px, 13vw, 112px);
  display: grid;
  place-items: center;
  color: var(--pwa-on-primary);
  background: var(--pwa-primary);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 28%;
  box-shadow: 0 24px 60px rgba(var(--pwa-primary-rgb), 0.35);
  animation: lost-float 4s ease-in-out infinite;
}
.lost-app .q-icon {
  font-size: 43%;
}
.error-kicker {
  color: var(--pwa-secondary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.not-found-card h1 {
  margin: 12px 0 10px;
  font-size: clamp(28px, 5vw, 46px);
  line-height: 1.08;
  letter-spacing: -0.05em;
}
.not-found-card p {
  max-width: 520px;
  margin: 0 auto 26px;
  color: var(--pwa-muted);
  font-size: 13px;
  line-height: 1.7;
}
.error-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.error-actions .q-btn {
  min-height: 46px;
  padding: 0 18px;
  color: var(--pwa-text);
}
.error-actions .home-action {
  color: var(--pwa-on-primary);
  background: var(--pwa-primary);
  box-shadow: 0 12px 30px rgba(var(--pwa-primary-rgb), 0.28);
}
.not-found-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
}
.orb-one {
  top: -10%;
  right: 5%;
  width: 360px;
  height: 360px;
  background: var(--pwa-primary);
}
.orb-two {
  bottom: -15%;
  left: 5%;
  width: 420px;
  height: 420px;
  background: var(--surface-highest);
}
@keyframes lost-float {
  0%,
  100% {
    transform: translateY(0) rotate(-3deg);
  }
  50% {
    transform: translateY(-12px) rotate(3deg);
  }
}
</style>
