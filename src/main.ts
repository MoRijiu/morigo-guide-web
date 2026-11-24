import { createApp } from 'vue'
// Register all icons locally first: @iconify/vue must never fetch
// api.iconify.design at runtime (unreachable for many users = blank icons).
import './icons/localIcons'
import App from './App.vue'
import './style.css'
import siteConfig from './config/site'

document.title = `${siteConfig.title}${siteConfig.titleHighlight} - ${siteConfig.tagline}`

createApp(App).mount('#app')
