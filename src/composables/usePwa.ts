import { ref } from 'vue'

/**
 * PWA 状态（模块级单例）：安装提示 + 在线状态。
 * - beforeinstallprompt 只在满足安装条件（manifest/SW/HTTPS）时由浏览器派发，
 *   没派发就保持 canInstall=false，页面不显示安装入口（不假装可安装）。
 * - isOnline 跟随 online/offline 事件，离线时页面给出提示（内容已缓存可继续浏览）。
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const canInstall = ref(false)
const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
let listenersBound = false

function bindListeners() {
  if (listenersBound || typeof window === 'undefined') return
  listenersBound = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    canInstall.value = true
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    canInstall.value = false
  })
  window.addEventListener('online', () => {
    isOnline.value = true
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })
}

export function usePwa() {
  bindListeners()

  async function promptInstall(): Promise<void> {
    const ev = deferredPrompt.value
    if (!ev) return
    await ev.prompt()
    const choice = await ev.userChoice.catch(() => null)
    if (choice?.outcome === 'accepted') {
      deferredPrompt.value = null
      canInstall.value = false
    }
  }

  return { canInstall, isOnline, promptInstall }
}

/** 注册 Service Worker（仅生产构建；dev 下注册会干扰 HMR 与模块更新）。 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW 注册失败不影响站点使用，静默降级为普通网页。 */
    })
  })
}
