<template>
  <div class="question-builder">
    <p class="text-muted help">{{
      ui(
        'Les candidats répondent à ces questions avant de rejoindre le test ({n} au maximum).',
        { n: BETA_LIMITS.questions }
      )
    }}</p>
    <p v-if="!questions.length" class="text-muted empty">{{
      ui(
        'Aucune question : les candidats acceptent seulement les conditions du test.'
      )
    }}</p>
    <ol class="questions" role="list">
      <li
        v-for="(question, index) in questions"
        :key="question.key"
        class="question"
        :data-question="question.key"
      >
        <div class="q-top">
          <strong>{{ ui('Question {n}', { n: index + 1 }) }}</strong>
          <div class="q-tools">
            <q-btn
              flat
              round
              dense
              icon="arrow_upward"
              class="move-up"
              :disable="index === 0"
              :aria-label="ui('Monter la question {n}', { n: index + 1 })"
              @click="move(index, -1)"
            />
            <q-btn
              flat
              round
              dense
              icon="arrow_downward"
              class="move-down"
              :disable="index === questions.length - 1"
              :aria-label="ui('Descendre la question {n}', { n: index + 1 })"
              @click="move(index, 1)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              class="remove-question"
              :aria-label="ui('Supprimer la question {n}', { n: index + 1 })"
              @click="remove(index)"
            />
          </div>
        </div>
        <q-input
          v-model="question.label"
          outlined
          dense
          :label="ui('Intitulé')"
          :maxlength="BETA_LIMITS.label"
          counter
        />
        <div class="q-row">
          <q-select
            :model-value="question.type"
            :options="typeOptions"
            emit-value
            map-options
            outlined
            dense
            class="type-select"
            :label="ui('Type de réponse')"
            @update:model-value="setType(question, $event)"
          />
          <q-toggle
            v-model="question.required"
            :label="ui('Réponse obligatoire')"
          />
        </div>
        <div v-if="question.type === 'choice'" class="options">
          <div v-for="(option, o) in question.options" :key="o" class="option">
            <q-input
              v-model="question.options[o]"
              outlined
              dense
              class="option-input"
              :label="ui('Choix {n}', { n: o + 1 })"
              :maxlength="BETA_LIMITS.option"
            />
            <q-btn
              flat
              round
              dense
              icon="close"
              :disable="question.options.length <= 2"
              :aria-label="ui('Retirer le choix {n}', { n: o + 1 })"
              @click="question.options.splice(o, 1)"
            />
          </div>
          <q-btn
            flat
            no-caps
            dense
            icon="add"
            color="primary"
            class="add-option"
            :disable="question.options.length >= BETA_LIMITS.options"
            :label="ui('Ajouter un choix')"
            @click="question.options.push('')"
          />
        </div>
        <p
          v-if="problems[`question_${question.key}`]"
          class="field-error"
          role="alert"
          >{{ problems[`question_${question.key}`] }}</p
        >
      </li>
    </ol>
    <q-btn
      outline
      no-caps
      color="primary"
      icon="add"
      class="add-question"
      :disable="questions.length >= BETA_LIMITS.questions"
      :label="ui('Ajouter une question')"
      @click="add"
    />
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { ui } from '@/i18n/text'
import { BETA_LIMITS, newQuestion, questionTypeOptions } from '@/utils/beta'

// Edits the questions array of the campaign form in place.
const props = defineProps({
  questions: { type: Array, required: true },
  problems: { type: Object, default: () => ({}) }
})
const typeOptions = computed(() => questionTypeOptions())

function add() {
  if (props.questions.length >= BETA_LIMITS.questions) return
  props.questions.push(newQuestion())
}
function remove(index) {
  props.questions.splice(index, 1)
}
function move(index, step) {
  const target = index + step
  if (target < 0 || target >= props.questions.length) return
  const [item] = props.questions.splice(index, 1)
  props.questions.splice(target, 0, item)
}
function setType(question, type) {
  question.type = type
  if (type === 'choice' && question.options.length < 2)
    question.options = [...question.options, '', ''].slice(0, 2)
}
defineExpose({ add, remove, move, setType })
</script>
<style scoped>
.help,
.empty {
  margin: 0 0 10px;
}
.questions {
  display: grid;
  gap: 12px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}
.question {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.q-top,
.q-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.type-select {
  min-width: 200px;
}
.options {
  display: grid;
  gap: 6px;
}
.option {
  display: flex;
  align-items: center;
  gap: 6px;
}
.option-input {
  flex: 1;
}
.field-error {
  margin: 0;
  color: var(--q-negative);
  font-size: 13px;
}
</style>
