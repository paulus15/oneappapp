import { reactive } from 'vue'

export const maintenance = reactive({
  enabled: false,
  message: '',
  until: null
})
export function setMaintenance(state) {
  Object.assign(maintenance, {
    enabled: !!state?.enabled,
    message: state?.message || '',
    until: state?.until || null
  })
}
