<template>
  <q-page class="workspace-page static-page">
    <template v-if="page">
      <header class="workspace-heading"
        ><span class="eyebrow">{{ page.eyebrow }}</span
        ><h1>{{ page.title }}</h1
        ><p v-if="page.updated" class="text-muted"
          >{{ ui('Dernière mise à jour :') }} {{ page.updated }}</p
        ></header
      >
      <q-banner v-if="page.draft" class="workspace-alert q-mb-lg" role="note">{{
        ui(
          'Brouillon — ce texte doit être validé par un juriste avant la mise en ligne publique de PWA Store.'
        )
      }}</q-banner>
      <article>
        <section v-for="section in page.sections" :key="section.title">
          <h2>{{ section.title }}</h2>
          <p v-for="text in section.paragraphs || []" :key="text">{{ text }}</p>
          <ul v-if="section.list">
            <li v-for="item in section.list" :key="item">{{ item }}</li>
          </ul>
          <q-list v-if="section.faq" bordered separator class="faq">
            <q-expansion-item
              v-for="item in section.faq"
              :key="item.q"
              :label="item.q"
              header-class="faq-question"
            >
              <p class="faq-answer">{{ item.a }}</p>
            </q-expansion-item>
          </q-list>
        </section>
      </article>
      <p class="text-muted q-mt-lg"
        >{{ ui('Une question ?') }}
        <router-link to="/contact">{{ ui('Contactez-nous') }}</router-link
        >.</p
      >
    </template>
    <AppFooter />
  </q-page>
</template>
<script setup>
import { ui, localizedCopy } from '@/i18n/text'

import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import { pages } from '@/content/pages'

const route = useRoute()
const page = computed(() => localizedCopy(pages[route.meta.page]))
watchEffect(() => {
  if (page.value) document.title = `${page.value.title} · PWA Store`
})
</script>
<style scoped>
article {
  max-width: 820px;
}
section {
  margin-bottom: 24px;
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 10px;
}
p,
li {
  line-height: 1.7;
}
ul {
  padding-left: 20px;
}
.faq {
  border-radius: 12px;
}
.faq-answer {
  margin: 0;
  padding: 0 16px 14px;
  color: var(--muted);
}
</style>
