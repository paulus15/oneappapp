<template>
  <div class="growth-share">
    <q-card flat bordered class="workspace-card">
      <h2>{{ ui('Visuel de partage') }}</h2>
      <p>{{
        ui(
          'Une image au format 1200 × 630, prête pour LinkedIn, Facebook, X ou WhatsApp. Son contenu vient uniquement de votre fiche publiée : rien n’est ajouté ni inventé.'
        )
      }}</p>
      <GrowthSvgAsset
        :fetch="() => growthApi.shareCard(app.id)"
        :source="app.id"
        :alt="ui('Visuel de partage de {p0}', { p0: app.name })"
        :filename="`visuel-${fileSlug(app.name)}`"
        :png-width="1200"
        :png-height="630"
      />
      <template v-if="app.public_url">
        <h3 class="link-title">{{ ui('Lien de la fiche') }}</h3>
        <CampaignLink :url="app.public_url" />
      </template>
    </q-card>
    <q-card flat bordered class="workspace-card qr-card">
      <h2>{{ ui('QR code de la fiche') }}</h2>
      <p>{{
        ui(
          'Pour une affiche ou un flyer. Pour mesurer ce support à part, créez plutôt un lien de campagne « QR code ».'
        )
      }}</p>
      <GrowthSvgAsset
        :fetch="() => growthApi.appQr(app.id)"
        :source="app.id"
        :alt="ui('QR code de la fiche de {p0}', { p0: app.name })"
        :filename="`qr-${fileSlug(app.name)}`"
        class="qr"
      />
    </q-card>
  </div>
</template>
<script setup>
import CampaignLink from '@/components/growth/CampaignLink.vue'
import GrowthSvgAsset from '@/components/growth/GrowthSvgAsset.vue'
import { ui } from '@/i18n/text'
import { growthApi } from '@/services/growth'
import { fileSlug } from '@/utils/growth'

// { id, name, public_url }
defineProps({ app: { type: Object, required: true } })
</script>
<style scoped>
.growth-share {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.link-title {
  margin: 16px 0 8px;
}
.qr {
  max-width: 280px;
}
@media (max-width: 860px) {
  .growth-share {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
