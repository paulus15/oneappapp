<template>
  <div>
    <q-select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :options="options"
      :option-value="valueField"
      option-label="name"
      emit-value
      map-options
      :multiple="multiple"
      :use-chips="multiple"
      :label="label"
      :disable="disable"
      :loading="loading"
      :error="!!error"
      :error-message="error"
      :clearable="!required"
      :rules="required ? [value => !!value || 'Choisissez un pays'] : []"
      outlined
      dense
      use-input
      input-debounce="150"
      @filter="filter"
      autocomplete="country-name"
    />
    <q-btn
      v-if="error"
      flat
      dense
      no-caps
      label="Recharger les pays"
      @click="load"
    />
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
defineProps({
  modelValue: [Number, String, Array],
  label: { type: String, default: 'Pays de résidence' },
  valueField: { type: String, default: 'id' },
  multiple: Boolean,
  required: Boolean,
  disable: Boolean
})
defineEmits(['update:modelValue'])
const countries = ref([]),
  options = ref([]),
  loading = ref(false),
  error = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    countries.value = (await api.get('/countries')).data
    options.value = countries.value
  } catch {
    error.value = 'Impossible de charger les pays.'
  } finally {
    loading.value = false
  }
}
function filter(value, update) {
  update(() => {
    const needle = value.toLocaleLowerCase('fr')
    options.value = countries.value.filter(c =>
      `${c.name} ${c.code} ${c.name_en}`
        .toLocaleLowerCase('fr')
        .includes(needle)
    )
  })
}
onMounted(load)
</script>
