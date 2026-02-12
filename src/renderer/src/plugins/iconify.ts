/**
 * Icon setup — Configure Iconify to load icons from bundled @iconify/json
 * 
 * This ensures icons work offline in the Electron app.
 */
import { addCollection } from '@iconify/vue'

// Import MDI icon set (most commonly used)
import mdiIcons from '@iconify/json/json/mdi.json'

// Add the collection to Iconify
addCollection(mdiIcons)

console.log('[Icons] MDI icon set loaded:', Object.keys(mdiIcons.icons).length, 'icons')
