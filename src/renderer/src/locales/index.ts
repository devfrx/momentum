/**
 * vue-i18n setup — centralized internationalization
 *
 * Usage in components:
 *   import { useI18n } from 'vue-i18n'
 *   const { t } = useI18n()
 *   // or simply use $t('key') in templates
 *
 * To add a new language: create a new file in locales/ and import it here.
 */
import { createI18n } from 'vue-i18n'
import {
  registerMessageCompiler,
  compile,
  registerMessageResolver,
  resolveValue,
  registerLocaleFallbacker,
  fallbackWithLocaleChain
} from '@intlify/core-base'
import en from './en'
import it from './it'

// Explicitly register the message compiler so that production tree-shaking
// (all @intlify packages declare sideEffects:false) does not drop it.
registerMessageCompiler(compile)
registerMessageResolver(resolveValue)
registerLocaleFallbacker(fallbackWithLocaleChain)

export type SupportedLocale = 'en' | 'it'

const i18n = createI18n({
  legacy: false,
  locale: 'it', // Default to Italian as requested
  fallbackLocale: 'en',
  messages: { en, it },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

export default i18n
