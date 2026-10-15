<template>
  <section class="my-feedback" :aria-label="ui('Mes retours envoyés')">
    <h3>{{ ui('Mes retours envoyés') }}</h3>
    <div
      v-if="list.loading.value"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 2" :key="n" height="56px" class="q-mb-sm" />
    </div>
    <EmptyState
      v-else-if="list.error.value"
      compact
      tone="error"
      icon="cloud_off"
      :title="ui('Vos retours n’ont pas pu être chargés.')"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="list.reload()"
      />
    </EmptyState>
    <p v-else-if="!items.length" class="text-muted empty-line">{{
      ui('Vous n’avez pas encore envoyé de retour pour ce test.')
    }}</p>
    <template v-else>
      <ul class="feedback-items" role="list">
        <li v-for="item in items" :key="item.id" class="feedback-item">
          <div class="item-head">
            <strong>{{ item.title }}</strong>
            <span class="chip">{{ feedbackTypeLabel(item.type) }}</span>
            <span
              class="chip"
              :class="`tone-${feedbackStatusColor(item.status)}`"
              >{{ feedbackStatusLabel(item.status) }}</span
            >
            <small class="text-muted">{{ betaDate(item.created_at) }}</small>
          </div>
          <!-- Collapsed: plain-text summary only. Expanded: the full body and the
               attachment previews through the existing sanitized view. -->
          <template v-if="expanded !== item.id">
            <p v-if="item.body || item.excerpt" class="excerpt">{{
              richTextSummary(item.body) || item.excerpt
            }}</p>
          </template>
          <SuggestionDetail
            v-else
            :suggestion="view(item)"
            :fetch-attachment="betaTesterApi.attachment"
          />
          <small v-if="item.steps || item.device" class="text-muted extra">
            <span v-if="item.device"
              ><q-icon name="devices" aria-hidden="true" />
              {{ item.device }}</span
            >
            <span v-if="item.steps" class="steps"
              >{{ ui('Étapes pour reproduire') }} : {{ item.steps }}</span
            >
          </small>
          <div
            v-if="item.developer_reply && expanded !== item.id"
            class="reply"
          >
            <strong>{{ ui('Réponse du développeur') }}</strong>
            <p>{{ item.developer_reply }}</p>
          </div>
          <q-btn
            v-if="item.body || item.attachments?.length"
            flat
            dense
            no-caps
            color="primary"
            class="toggle-detail"
            :aria-expanded="expanded === item.id ? 'true' : 'false'"
            :label="
              expanded === item.id
                ? ui('Masquer le détail')
                : item.attachments?.length
                  ? ui('Voir le détail et les captures')
                  : ui('Voir le détail')
            "
            @click="expanded = expanded === item.id ? null : item.id"
          />
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        :page-size="LIST_PAGE_SIZE"
        @load="list.loadMore()"
      />
    </template>
  </section>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { betaTesterApi } from '@/services/beta'
import {
  LIST_PAGE_SIZE,
  attachmentView,
  betaDate,
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackTypeLabel,
  richTextSummary
} from '@/utils/beta'

const props = defineProps({
  participationId: { type: [Number, String], required: true }
})
const list = useLoadMore(
  async page => (await betaTesterApi.feedback(props.participationId, page)).data
)
const items = list.items
// Only one feedback at a time loads its private image previews.
const expanded = ref(null)

// Body and attachments go through the existing sanitizer and private download.
const view = item => ({
  id: item.id,
  body: item.body,
  attachments: attachmentView(item.attachments),
  developer_reply: item.developer_reply || null,
  application: true
})

// A feedback just sent goes on top without reloading the list.
function add(item) {
  if (!item?.id || items.value.some(other => other.id === item.id)) return
  items.value = [item, ...items.value]
  list.total.value += 1
}

onMounted(() => void list.reload())
defineExpose({ reload: () => list.reload(), add, expanded })
</script>
<style scoped>
.my-feedback h3 {
  margin: 0 0 8px;
}
.empty-line {
  margin: 0;
}
.feedback-items {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.feedback-item {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.item-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}
.excerpt {
  margin: 0;
}
.extra {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.steps {
  white-space: pre-line;
}
.toggle-detail {
  justify-self: start;
}
.chip {
  --chip: var(--muted);
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 650;
  background: color-mix(in srgb, var(--chip) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--chip) 35%, transparent);
  border-radius: 999px;
}
.tone-primary {
  --chip: var(--q-primary);
}
.tone-positive {
  --chip: var(--q-positive);
}
.tone-orange-8 {
  --chip: var(--q-warning);
}
.reply {
  padding: 8px 10px;
  background: var(--surface-low);
  border-left: 3px solid var(--pwa-primary);
  border-radius: 8px;
}
.reply p {
  margin: 4px 0 0;
  white-space: pre-line;
}
</style>
