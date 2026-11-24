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
import { initCustomBg } from './composables/useCustomBg'
import { registerServiceWorker } from './composables/usePwa'
import { initLocale } from './i18n'

// 挂载前先把主题偏好（强调色/背景/毛玻璃）落到 <html> 数据属性，避免首屏闪烁
applyThemePrefs()
// 自定义背景图存 IndexedDB（异步）：尽早读回并注入 CSS 变量
void initCustomBg()
// 语言偏好落 <html lang> 与 document.title（标题随语言走）
initLocale()

createApp(App).mount('#app')

// PWA：生产构建注册 Service Worker（离线缓存 + 可安装），失败静默降级
registerServiceWorker()
