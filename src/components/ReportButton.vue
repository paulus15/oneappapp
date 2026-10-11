<template>
  <q-btn
    flat
    no-caps
    :dense="dense"
    :color="color"
    icon="flag"
    :label="label"
    @click="open"
  />
  <q-dialog v-model="dialog">
    <q-card class="report-card">
      <q-form @submit="send">
        <q-card-section>
          <h2
            >Signaler
            {{ targetType === 'review' ? 'cet avis' : 'cette application' }}</h2
          >
          <p class="text-muted"
            >Votre signalement est confidentiel et examiné par l’équipe de
            modération.</p
          >
        </q-card-section>
        <q-card-section class="workspace-form">
          <q-option-group v-model="reason" :options="reasons" type="radio" />
          <q-input
            v-model="details"
            outlined
            type="textarea"
            autogrow
            maxlength="2000"
            label="Précisions (facultatif)"
          />
          <q-banner v-if="error" class="workspace-alert" role="alert">{{
            error
          }}</q-banner>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Annuler" v-close-popup />
          <q-btn
            type="submit"
            color="negative"
            no-caps
            label="Envoyer le signalement"
            :disable="!reason"
            :loading="busy"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { communityApi, REPORT_REASONS } from '@/services/community'
import { apiMessage } from '@/services/account'

const props = defineProps({
  targetType: { type: String, required: true },
  targetId: { type: Number, required: true },
  label: { type: String, default: 'Signaler' },
  dense: Boolean,
  color: { type: String, default: 'grey-7' }
})
const $q = useQuasar(),
  auth = useAuthStore(),
  router = useRouter(),
  route = useRoute()
const dialog = ref(false),
  reason = ref(null),
  details = ref(''),
  busy = ref(false),
  error = ref('')
const reasons = Object.entries(REPORT_REASONS).map(([value, label]) => ({
  value,
  label
}))

function open() {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  error.value = ''
  dialog.value = true
}
async function send() {
  busy.value = true
  error.value = ''
  try {
    const { data } = await communityApi.report({
      target_type: props.targetType,
      target_id: props.targetId,
      reason: reason.value,
      details: details.value || null
    })
    dialog.value = false
    reason.value = null
    details.value = ''
    $q.notify({ type: 'positive', message: data.message })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<style scoped>
.report-card {
  width: min(520px, 100vw);
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 4px;
}
</style>
