<template>
  <footer class="app-footer">
    <div class="footer-brand">
      <router-link to="/" :aria-label="ui('PWA Store, accueil')"
        ><BrandLogo
      /></router-link>
      <p>{{
        ui(
          'Un canal de découverte, de test et de distribution Web pour les Progressive Web Apps. Complémentaire des stores mobiles.'
        )
      }}</p>
    </div>
    <nav
      v-for="group in groups"
      :key="group.title"
      :aria-label="group.title"
      class="links"
    >
      <h2>{{ group.title }}</h2>
      <router-link
        v-for="link in group.links.filter(l => !l.desktopOnly || !isMobile)"
        :key="link.to"
        :to="link.to"
        >{{ link.label }}</router-link
      >
    </nav>
    <p class="legal"
      >© {{ year }} {{ ui('PWA Store. Tous droits réservés.') }}</p
    >
  </footer>
</template>
<script setup>
import { ui } from '@/i18n/text'

import BrandLogo from '@/components/BrandLogo.vue'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
// Becoming a developer happens on a computer: that entry is not offered on phones.
const { isMobile } = useWorkspaceAccess()
const year = new Date().getFullYear()
const groups = [
  {
    get title() {
      return ui('Store')
    },
    links: [
      {
        to: '/',
        get label() {
          return ui('Accueil')
        }
      },
      {
        to: '/categories',
        get label() {
          return ui('Catégories')
        }
      },
      {
        to: '/popular',
        get label() {
          return ui('Populaires')
        }
      },
      {
        to: '/about',
        get label() {
          return ui('À propos')
        }
      }
    ]
  },
  {
    get title() {
      return ui('Développeurs')
    },
    links: [
      {
        to: '/developers',
        desktopOnly: true,
        get label() {
          return ui('Devenir développeur')
        }
      },
      {
        to: '/publishing-rules',
        get label() {
          return ui('Règles de publication')
        }
      }
    ]
  },
  {
    get title() {
      return ui('Aide')
    },
    links: [
      {
        to: '/help',
        get label() {
          return ui('Centre d’aide')
        }
      },
      {
        to: '/contact',
        get label() {
          return ui('Contact')
        }
      }
    ]
  },
  {
    get title() {
      return ui('Légal')
    },
    links: [
      {
        to: '/terms',
        get label() {
          return ui('Conditions d’utilisation')
        }
      },
      {
        to: '/privacy',
        get label() {
          return ui('Confidentialité')
        }
      }
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
