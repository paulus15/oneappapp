import { boot } from 'quasar/wrappers'
import { countUp } from '@/directives/countUp'

export default boot(({ app }) => {
  app.directive('count-up', countUp)
})
