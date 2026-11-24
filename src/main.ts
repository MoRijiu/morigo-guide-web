import { createApp } from 'vue'
// Register all icons locally first: @iconify/vue must never fetch
// api.iconify.design at runtime (unreachable for many users = blank icons).
import './icons/localIcons'
// Self-hosted fonts (latin subsets, font-display: swap): never fetch
// fonts.googleapis.com at runtime — same unreachable-host problem as icons.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-700.css'
import App from './App.vue'
import './style.css'
import siteConfig from './config/site'

document.title = `${siteConfig.title}${siteConfig.titleHighlight} - ${siteConfig.tagline}`

createApp(App).mount('#app')
