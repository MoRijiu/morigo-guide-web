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
import { applyThemePrefs } from './composables/useThemePrefs'

// 挂载前先把主题偏好（强调色/背景/毛玻璃）落到 <html> 数据属性，避免首屏闪烁
applyThemePrefs()
import siteConfig from './config/site'

document.title = `${siteConfig.title}${siteConfig.titleHighlight} - ${siteConfig.tagline}`

createApp(App).mount('#app')
