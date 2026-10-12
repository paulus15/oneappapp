<template>
  <q-page class="workspace-page portal-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{
        ui(
          'Vous développez des applications ? Devenez développeur sur PWA Store.'
        )
      }}</h1
      ><p>{{
        ui(
          'Présentez vos Progressive Web Apps, trouvez vos premiers utilisateurs et recevez leurs retours. L’activation est gratuite et se fait avec votre compte PWA Store habituel.'
        )
      }}</p
      ><div class="workspace-actions">
        <q-btn
          v-if="!isMobile"
          color="primary"
          no-caps
          unelevated
          :label="cta.label"
          :to="cta.to"
        />
        <q-btn flat no-caps :label="ui('Découvrir le Store')" to="/" />
      </div>
      <q-banner v-if="isMobile" class="workspace-alert q-mt-md">{{
        ui(
          'Le portail développeur s’utilise sur ordinateur ou tablette. Sur mobile, votre compte fonctionne comme un compte utilisateur.'
        )
      }}</q-banner></header
    >

    <section class="workspace-section">
      <h2>{{ ui('Comment ça marche') }}</h2>
      <ol class="steps">
        <li v-for="step in steps" :key="step.title">
          <q-icon :name="step.icon" class="step-icon" />
          <div
            ><strong>{{ step.title }}</strong
            ><p>{{ step.text }}</p></div
          >
        </li>
      </ol>
    </section>

    <section class="workspace-section">
      <h2>{{ ui('Deux façons de publier') }}</h2>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h3><q-icon name="link" /> {{ ui('Référencement par URL') }}</h3
          ><p>{{
            ui(
              'Votre PWA reste hébergée chez vous. PWA Store vérifie l’adresse HTTPS, le manifeste et les redirections, puis contrôle régulièrement sa disponibilité. Vos mises à jour sont publiées par votre propre serveur.'
            )
          }}</p></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3><q-icon name="archive" /> {{ ui('Dépôt d’un build') }}</h3
          ><p>{{
            ui(
              'Vous déposez les fichiers de production. Chaque version est analysée, revue puis servie sur une origine isolée. Vous pouvez revenir à une version approuvée précédente.'
            )
          }}</p></q-card
        >
      </div>
      <p class="text-muted">{{
        ui(
          'Les contrôles réduisent certains risques techniques mais ne constituent pas une garantie de sécurité.'
        )
      }}</p>
    </section>

    <section class="workspace-section">
      <h2>{{ ui('Ce qu’il faut savoir') }}</h2>
      <div class="workspace-grid">
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Vérification de l’éditeur') }}</h3
          ><p>{{
            ui(
              'Pour publier, votre profil doit être complet et vérifié par l’équipe, avec une pièce d’identité valide (celle du représentant pour une organisation). Le document reste privé.'
            )
          }}</p></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Revue de chaque application') }}</h3
          ><p>{{
            ui(
              'Un profil vérifié ne publie rien automatiquement : chaque application et chaque version sont examinées. Une application approuvée devient visible quand vous la publiez.'
            )
          }}</p></q-card
        >
        <q-card flat bordered class="workspace-card"
          ><h3>{{ ui('Gratuit pour commencer') }}</h3
          ><p>{{
            ui(
              'L’inscription, l’activation et les premières publications sont gratuites. Une contribution pourra être demandée au-delà d’un quota, annoncée à l’avance. Aucun paiement n’est actif aujourd’hui.'
            )
          }}</p></q-card
        >
      </div>
    </section>
    <AppFooter />
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'

const auth = useAuthStore()
const { isMobile } = useWorkspaceAccess()
const cta = computed(() =>
  !auth.isAuthenticated
    ? {
        get label() {
          return ui('Créer mon compte gratuit')
        },
        to: { path: '/register', query: { redirect: '/developer/activate' } }
      }
    : auth.isDeveloper
      ? {
          get label() {
            return ui('Ouvrir mon espace développeur')
          },
          to: '/developer'
        }
      : {
          get label() {
            return ui('Activer mon portail développeur')
          },
          to: '/developer/activate'
        }
)
const steps = [
  {
    icon: 'person_add',
    get title() {
      return ui('Créez votre compte')
    },
    get text() {
      return ui(
        'Un seul compte pour utiliser le Store et publier. Confirmez votre e-mail par code.'
      )
    }
  },
  {
    icon: 'badge',
    get title() {
      return ui('Activez le portail et complétez votre profil')
    },
    get text() {
      return ui(
        'Individuel ou organisation, avec votre pays et une pièce d’identité valide.'
      )
    }
  },
  {
    icon: 'verified_user',
    get title() {
      return ui('Faites vérifier votre profil')
    },
    get text() {
      return ui(
        'L’équipe examine votre demande et vous indique le motif de chaque décision.'
      )
    }
  },
  {
    icon: 'add_box',
    get title() {
      return ui('Préparez et soumettez votre application')
    },
    get text() {
      return ui(
        'Fiche, captures, puis URL HTTPS ou build. La validation de votre profil est obligatoire avant toute création.'
      )
    }
  },
  {
    icon: 'rocket_launch',
    get title() {
      return ui('Publiez et suivez vos retours')
    },
    get text() {
      return ui(
        'Après approbation, publiez quand vous êtes prêt, puis suivez avis et statistiques.'
      )
    }
  }
]
</script>
<style scoped>
.portal-page h1 {
  max-width: 820px;
}
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
}
.steps li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.steps p {
  margin: 4px 0 0;
  color: var(--muted);
}
.step-icon {
  flex: 0 0 auto;
  font-size: 22px;
  padding: 10px;
  border-radius: 12px;
  color: var(--pwa-primary);
  background: color-mix(in srgb, var(--pwa-primary) 12%, transparent);
}
h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
}
</style>
