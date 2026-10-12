<template>
  <q-layout class="auth-layout" :class="{ 'theme-dark': isDark }">
    <div class="auth-ambient auth-ambient-one" aria-hidden="true" />
    <div class="auth-ambient auth-ambient-two" aria-hidden="true" />

    <q-page-container class="auth-page-container">
      <div class="auth-shell">
        <header class="auth-header">
          <router-link
            to="/"
            class="auth-brand"
            :aria-label="ui('Retour à PWA Store')"
          >
            <BrandLogo />
          </router-link>
          <div class="auth-header-actions">
            <router-link to="/" class="auth-back-link">
              <q-icon name="arrow_back" size="16px" />
              <span>{{ ui('Retour au store') }}</span>
            </router-link>
            <q-btn
              flat
              round
              :icon="isDark ? 'light_mode' : 'dark_mode'"
              :aria-label="
                isDark
                  ? ui('Activer le thème clair')
                  : ui('Activer le thème sombre')
              "
              class="auth-theme-toggle"
              @click="toggleTheme"
            />
            <LanguageSwitcher />
          </div>
        </header>
        <aside class="auth-story" :aria-label="ui('Présentation PWA Store')">
          <div class="story-grid" aria-hidden="true" />
          <div class="story-content">
            <span class="story-kicker"
              ><q-icon name="auto_awesome" />
              {{ ui('Expérience universelle') }}</span
            >
            <h2
              >{{ ui('Vos applications.') }}<br /><em>{{
                ui('Partout avec vous.')
              }}</em></h2
            >
            <p>
              {{
                ui(
                  'Découvrez vos prochaines applications ou partagez vos créations, depuis un seul et même espace.'
                )
              }}
            </p>

            <div class="story-benefits">
              <div v-for="benefit in benefits" :key="benefit.label">
                <span><q-icon :name="benefit.icon" /></span>
                <div>
                  <strong>{{ benefit.label }}</strong>
                  <small>{{ benefit.text }}</small>
                </div>
              </div>
            </div>
          </div>

          <p class="story-note"
            ><q-icon name="language" size="18px" />
            {{ ui('Le web, à portée de main.') }}
          </p>
        </aside>

        <main class="auth-form-panel">
          <router-view />
        </main>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ui } from '@/i18n/text'

import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

const benefits = [
  {
    icon: 'explore',
    get label() {
      return ui('Découvrez de nouvelles applications')
    },
    get text() {
      return ui('Explorez le catalogue à votre rythme.')
    }
  },
  {
    icon: 'devices',
    get label() {
      return ui('Toutes les plateformes')
    },
    get text() {
      return ui('Une expérience cohérente partout.')
    }
  },
  {
    icon: 'bolt',
    get label() {
      return ui('Simple et rapide')
    },
    get text() {
      return ui('Commencez en quelques secondes.')
    }
  }
]
</script>

<style lang="scss">
.auth-layout {
  min-height: 100vh;
  color: var(--text);
  background: var(--page);
}
.auth-page-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  align-items: center;
  padding: 24px;
}
.auth-shell {
  position: relative;
  width: min(1040px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  margin: auto;
  overflow: hidden;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 24px;
  box-shadow: var(--ui-shadow-lg);
}
.auth-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px;
  border-bottom: 1px solid var(--outline);
}
.auth-brand {
  display: inline-flex;
  text-decoration: none;
}
.auth-brand .pwa-brand__icon {
  width: 36px;
  height: 36px;
}
.auth-brand .pwa-brand__wordmark {
  width: 120px;
  height: 40px;
}
.auth-header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.auth-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  text-decoration: none;
  font-size: 12px;
}
.auth-back-link:hover {
  color: var(--pwa-link);
}
.auth-theme-toggle {
  color: var(--muted);
  border: 1px solid var(--outline);
}
.auth-story {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 36px;
  overflow: hidden;
  padding: 40px 36px;
  color: var(--pwa-text);
  background: var(--pwa-auth-story-background);
}
.story-grid {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background-image:
    linear-gradient(var(--pwa-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--pwa-border) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, black, transparent 90%);
}
.story-content,
.story-note {
  position: relative;
  z-index: 1;
}
.story-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--pwa-auth-story-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.auth-story h2 {
  margin: 20px 0 18px;
  font-size: clamp(32px, 3.3vw, 42px);
  font-weight: 650;
  line-height: 1.13;
  letter-spacing: -0.04em;
}
.auth-story h2 em {
  color: var(--pwa-auth-story-accent);
  font-style: normal;
}
.story-content > p {
  margin: 0;
  color: var(--pwa-muted);
  font-size: 13px;
  line-height: 1.75;
}
.story-benefits {
  display: grid;
  gap: 20px;
  margin-top: 32px;
}
.story-benefits > div {
  display: flex;
  align-items: center;
  gap: 12px;
}
.story-benefits > div > span {
  width: 36px;
  height: 36px;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  color: var(--pwa-auth-story-accent);
  background: var(--pwa-surface);
  border: 1px solid var(--pwa-border);
  border-radius: 10px;
}
.story-benefits .q-icon {
  font-size: 19px;
}
.story-benefits div div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.story-benefits strong {
  font-size: 12px;
  font-weight: 650;
}
.story-benefits small {
  color: var(--pwa-muted);
  font-size: 11px;
}
.story-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--pwa-muted);
  font-size: 11px;
}
.auth-form-panel {
  min-width: 0;
  display: grid;
  align-items: center;
  padding: 28px 40px;
}
.auth-form-panel .auth-page {
  width: 100%;
  min-height: 0 !important;
}
.auth-form-panel .auth-card {
  width: 100%;
  max-width: 410px;
  margin: auto;
  background: transparent;
}
.auth-form-panel .q-card__section {
  padding: 0;
}
.auth-form-panel .card-header {
  padding-bottom: 22px;
}
.auth-eyebrow {
  display: block;
  margin-bottom: 8px;
  color: var(--pwa-link);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.auth-form-panel .auth-title {
  margin: 0;
  color: var(--text);
  font-size: clamp(26px, 2.5vw, 30px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -0.035em;
}
.auth-subtitle {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}
.auth-form {
  display: grid;
  gap: 12px;
}
.auth-form .q-field__control {
  min-height: 48px;
  height: 48px;
}
.auth-form .q-field__marginal {
  height: 48px;
  color: var(--muted);
  font-size: 20px;
}
.auth-form .q-field__label,
.auth-form .q-field__native {
  color: var(--text);
  font-size: 14px;
}
.auth-form .q-field__bottom {
  padding: 5px 10px 0;
}
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
}
.text-action {
  padding: 4px 0;
  color: var(--pwa-link);
  background: none;
  border: 0;
  cursor: pointer;
  font: inherit;
}
.account-type {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.account-type legend {
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.account-type-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.radio-box {
  min-height: 44px;
  padding: 6px 8px;
  border: 1px solid var(--outline);
  border-radius: 10px;
  color: var(--text);
  font-size: 12px;
}
.radio-box--selected {
  border-color: var(--pwa-link);
  background: var(--primary-soft);
}
.auth-form .submit-btn {
  min-height: 46px;
  width: 100%;
  border-radius: 10px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-size: 14px;
  font-weight: 700;
}
.auth-form-panel .card-footer {
  padding-top: 20px;
  text-align: center;
}
.footer-text {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}
.footer-text a {
  color: var(--pwa-link);
  font-weight: 650;
  text-decoration: none;
}
.footer-text a:hover {
  text-decoration: underline;
}
.form-error {
  padding: 10px 12px;
  color: var(--q-negative);
  background: rgba(239, 91, 103, 0.1);
  border: 1px solid rgba(239, 91, 103, 0.2);
  border-radius: 10px;
  font-size: 12px;
}
.auth-layout a:focus-visible {
  outline: 2px solid var(--pwa-link);
  outline-offset: 4px;
  border-radius: 4px;
}
.auth-ambient {
  position: fixed;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.auth-ambient-one {
  top: -100px;
  right: 8%;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.auth-ambient-two {
  bottom: -100px;
  left: 5%;
  background: color-mix(in srgb, var(--secondary) 10%, transparent);
}
@media (max-width: 800px) {
  .auth-page-container {
    padding: 20px;
  }
  .auth-shell {
    max-width: 520px;
    grid-template-columns: 1fr;
  }
  .auth-story {
    display: none;
  }
  .auth-header {
    padding: 16px 24px;
  }
  .auth-back-link {
    display: none;
  }
  .auth-form-panel {
    padding: 28px;
  }
}
@media (max-width: 400px) {
  .auth-page-container {
    padding: 12px;
  }
  .auth-header {
    padding: 12px 18px;
  }
  .auth-form-panel {
    padding: 24px 18px;
  }
  .auth-header-actions {
    gap: 8px;
  }
  .account-type-options {
    gap: 8px;
  }
  .radio-box {
    padding: 6px 4px;
    font-size: 11px;
  }
}
</style>
