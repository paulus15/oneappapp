<template>
  <footer class="app-footer">
    <div class="footer-brand">
      <router-link to="/" aria-label="PWA Store, accueil"
        ><BrandLogo
      /></router-link>
      <p
        >Un canal de découverte, de test et de distribution Web pour les
        Progressive Web Apps. Complémentaire des stores mobiles.</p
      >
    </div>
    <nav
      v-for="group in groups"
      :key="group.title"
      :aria-label="group.title"
      class="links"
    >
      <h2>{{ group.title }}</h2>
      <router-link v-for="link in group.links" :key="link.to" :to="link.to">{{
        link.label
      }}</router-link>
    </nav>
    <p class="legal">© {{ year }} PWA Store. Tous droits réservés.</p>
  </footer>
</template>
<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
const year = new Date().getFullYear()
const groups = [
  {
    title: 'Store',
    links: [
      { to: '/', label: 'Accueil' },
      { to: '/categories', label: 'Catégories' },
      { to: '/popular', label: 'Populaires' },
      { to: '/about', label: 'À propos' }
    ]
  },
  {
    title: 'Développeurs',
    links: [
      { to: '/developers', label: 'Devenir développeur' },
      { to: '/publishing-rules', label: 'Règles de publication' }
    ]
  },
  {
    title: 'Aide',
    links: [
      { to: '/help', label: 'Centre d’aide' },
      { to: '/contact', label: 'Contact' }
    ]
  },
  {
    title: 'Légal',
    links: [
      { to: '/terms', label: 'Conditions d’utilisation' },
      { to: '/privacy', label: 'Confidentialité' }
    ]
  }
]
</script>
<style scoped>
.app-footer {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(120px, 1fr));
  gap: 24px;
  padding: 28px var(--ui-page-gutter, 16px) 20px;
  margin-top: 24px;
  color: var(--muted);
  border-top: 1px solid var(--outline);
}
.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.footer-brand p {
  max-width: 320px;
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
}
.links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
h2 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 13px;
  font-weight: 750;
}
a {
  color: var(--muted);
  font-size: 12px;
  text-decoration: none;
}
a:hover,
a:focus-visible {
  color: var(--pwa-link);
}
.legal {
  grid-column: 1 / -1;
  margin: 0;
  padding-top: 14px;
  border-top: 1px solid var(--outline);
  font-size: 11px;
}
@media (max-width: 900px) {
  .app-footer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .footer-brand {
    grid-column: 1 / -1;
  }
}
</style>
