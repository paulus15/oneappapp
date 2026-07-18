<template>
  <q-layout class="auth-layout" :class="{ 'theme-dark': isDark }">
    <div class="auth-ambient auth-ambient-one" aria-hidden="true" />
    <div class="auth-ambient auth-ambient-two" aria-hidden="true" />

    <router-link to="/" class="auth-brand" aria-label="Retour à OneInstall">
      <span class="auth-brand-mark"><q-icon name="apps" /></span>
      <span>
        <strong>OneInstall</strong>
        <small>One App. All Platforms.</small>
      </span>
    </router-link>

    <q-btn
      flat
      round
      :icon="isDark ? 'light_mode' : 'dark_mode'"
      :aria-label="
        isDark ? 'Activer le thème clair' : 'Activer le thème sombre'
      "
      class="auth-theme-toggle"
      @click="toggleTheme"
    />

    <q-page-container class="auth-page-container">
      <div class="auth-shell">
        <aside class="auth-story" aria-label="Présentation OneInstall">
          <div class="story-grid" aria-hidden="true" />
          <div class="story-content">
            <span class="story-kicker"
              ><q-icon name="auto_awesome" /> Expérience universelle</span
            >
            <h2>Vos applications.<br /><em>Partout avec vous.</em></h2>
            <p>
              Un seul espace sécurisé pour découvrir, installer et publier des
              expériences qui fonctionnent sur toutes vos plateformes.
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

          <div class="story-proof">
            <div class="proof-avatars">
              <span>AM</span><span>KS</span><span>FD</span>
            </div>
            <p
              ><strong>Une communauté en mouvement</strong><br />Créateurs et
              utilisateurs réunis.</p
            >
          </div>
        </aside>

        <main class="auth-form-panel">
          <router-view />
        </main>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const isDark = ref(true)

const benefits = [
  {
    icon: 'verified_user',
    label: 'Sécurisé par défaut',
    text: 'Chaque build est contrôlé et signé.'
  },
  {
    icon: 'devices',
    label: 'Toutes les plateformes',
    text: 'Une expérience cohérente partout.'
  },
  {
    icon: 'bolt',
    label: 'Simple et rapide',
    text: 'Commencez en quelques secondes.'
  }
]

onMounted(() => {
  const savedTheme = localStorage.getItem('oneinstall-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = savedTheme ? savedTheme === 'dark' : prefersDark
  $q.dark.set(isDark.value)
})

function toggleTheme() {
  isDark.value = !isDark.value
  $q.dark.set(isDark.value)
  localStorage.setItem('oneinstall-theme', isDark.value ? 'dark' : 'light')
}
</script>

<style lang="scss">
.auth-layout {
  --page: #fafafa;
  --surface-low: #fff;
  --surface: #f4f4f5;
  --surface-high: #e4e4e7;
  --surface-highest: #d4d4d8;
  --text: #18181b;
  --muted: #71717a;
  --outline: rgba(24, 24, 27, 0.12);
  --glass: rgba(255, 255, 255, 0.82);
  --primary: #059669;
  --primary-soft: #d1fae5;
  min-height: 100vh;
  color: var(--text);
  background: var(--page);
}

.auth-layout.theme-dark {
  --page: #09090b;
  --surface-low: #18181b;
  --surface: #202023;
  --surface-high: #27272a;
  --surface-highest: #3f3f46;
  --text: #fafafa;
  --muted: #a1a1aa;
  --outline: rgba(255, 255, 255, 0.09);
  --glass: rgba(9, 9, 11, 0.84);
  --primary: #34d399;
  --primary-soft: #065f46;
}

.auth-page-container {
  min-height: 100vh;
  padding: 16px;
}
.auth-shell {
  width: min(1120px, calc(100vw - 32px));
  min-height: min(700px, calc(100vh - 32px));
  display: grid;
  grid-template-columns: minmax(390px, 0.95fr) minmax(420px, 1.05fr);
  margin: 0 auto;
  overflow: hidden;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 22px;
  box-shadow: var(--ui-shadow-lg);
}

.auth-brand {
  position: fixed;
  z-index: 5;
  top: 42px;
  left: max(48px, calc((100vw - 1180px) / 2 + 30px));
  display: flex;
  align-items: center;
  gap: 11px;
  color: #fff;
  text-decoration: none;
}
.auth-brand-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(12px);
}
.auth-brand > span:last-child {
  display: flex;
  flex-direction: column;
}
.auth-brand strong {
  font-size: 15px;
}
.auth-brand small {
  color: rgba(255, 255, 255, 0.67);
  font-size: 8px;
}
.auth-theme-toggle {
  position: fixed;
  z-index: 6;
  top: 38px;
  right: max(48px, calc((100vw - 1180px) / 2 + 30px));
  color: var(--muted);
  background: color-mix(in srgb, var(--surface-low) 84%, transparent);
  border: 1px solid var(--outline);
  backdrop-filter: blur(14px);
}

.auth-story {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 96px 42px 30px;
  color: #fff;
  background: #18181b;
}
.story-grid {
  position: absolute;
  inset: 0;
  opacity: 0.13;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, black, transparent 84%);
}
.story-content {
  position: relative;
  z-index: 1;
}
.story-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6ee7b7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.auth-story h2 {
  margin: 14px 0 12px;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.02;
  letter-spacing: -0.055em;
}
.auth-story h2 em {
  color: #6ee7b7;
  font-style: normal;
}
.auth-story > .story-content > p {
  max-width: 430px;
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.7;
}
.story-benefits {
  display: grid;
  gap: 13px;
  margin-top: 28px;
}
.story-benefits > div {
  display: flex;
  align-items: center;
  gap: 12px;
}
.story-benefits > div > span {
  width: 38px;
  height: 38px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  background: rgba(255, 255, 255, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 11px;
}
.story-benefits > div > span .q-icon {
  color: #6ee7b7;
  font-size: 19px;
}
.story-benefits div div {
  display: flex;
  flex-direction: column;
}
.story-benefits strong {
  font-size: 11px;
}
.story-benefits small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 9px;
}
.story-proof {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 28px;
}
.proof-avatars {
  display: flex;
}
.proof-avatars span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  margin-left: -7px;
  color: #18181b;
  background: #d4d4d8;
  border: 2px solid #27272a;
  border-radius: 50%;
  font-size: 8px;
  font-weight: 800;
}
.proof-avatars span:first-child {
  margin-left: 0;
}
.story-proof p {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 8px;
  line-height: 1.5;
}
.story-proof strong {
  color: #fff;
  font-size: 9px;
}

.auth-form-panel {
  min-width: 0;
  display: grid;
  place-items: center;
  padding: 68px 6% 32px;
  background: var(--surface-low);
}
.auth-ambient {
  position: fixed;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.auth-ambient-one {
  top: -100px;
  right: 8%;
  width: 260px;
  height: 260px;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.auth-ambient-two {
  bottom: -100px;
  left: 5%;
  width: 300px;
  height: 300px;
  background: color-mix(in srgb, var(--secondary) 10%, transparent);
}

@media (max-width: 900px) {
  .auth-page-container {
    padding: 0;
  }
  .auth-shell {
    width: 100%;
    min-height: 100vh;
    grid-template-columns: 1fr;
    border: 0;
    border-radius: 0;
  }
  .auth-story {
    display: none;
  }
  .auth-brand {
    top: 20px;
    left: 20px;
    color: var(--text);
  }
  .auth-brand-mark {
    color: #fff;
    background: var(--primary);
    border: 0;
  }
  .auth-brand small {
    color: var(--muted);
  }
  .auth-theme-toggle {
    top: 17px;
    right: 18px;
  }
  .auth-form-panel {
    min-height: 100vh;
    padding: 92px 20px 36px;
  }
}
</style>
