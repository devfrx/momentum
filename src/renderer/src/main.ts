import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

// Load bundled icons BEFORE app initialization
import './plugins/iconify'

// Global theme system (modular)
import './assets/css/index.css'

import App from './App.vue'
import router from './router'
import i18n from './locales'
import ProfessionalPreset from './assets/theme/custom-preset'

// PrimeVue base styles
import 'primeicons/primeicons.css'

const app = createApp(App)

// Pinia (state management)
const pinia = createPinia()
app.use(pinia)

// Vue Router
app.use(router)

// i18n (internationalization)
app.use(i18n)

// PrimeVue with professional neutral theme
app.use(PrimeVue, {
  theme: {
    preset: ProfessionalPreset,
    options: {
      darkModeSelector: '[data-theme="dark"]',
      cssLayer: false
    }
  }
})

// PrimeVue services
app.use(ToastService)
app.use(ConfirmationService)

// PrimeVue directives
app.directive('tooltip', Tooltip)

// Mount
app.mount('#app')

// Apply default theme
document.documentElement.setAttribute('data-theme', 'dark')
