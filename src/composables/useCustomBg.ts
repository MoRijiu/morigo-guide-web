import { ref } from 'vue'

/**
 * 自定义本地图片背景：用户上传的图片经 canvas 压缩后存 IndexedDB
 * （localStorage 容量太小、且会拖慢每次偏好读写），通过 CSS 变量
 * --custom-bg-image 供 style.css 的 html[data-bg='custom'] 规则使用。
 * 图片只留在本机浏览器、不上传任何服务器。IndexedDB 不可用时静默降级。
 */

const DB_NAME = 'morigo-db'
const STORE = 'assets'
const KEY = 'custom-bg'

const customBgUrl = ref<string | null>(null)
const customBgReady = ref(false)

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbGet(): Promise<string | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbSet(value: string): Promise<boolean> {
  const db = await openDb()
  if (!db) return false
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, KEY)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

async function idbDelete(): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

function applyVar() {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  if (customBgUrl.value) {
    el.style.setProperty('--custom-bg-image', `url("${customBgUrl.value}")`)
  } else {
    el.style.removeProperty('--custom-bg-image')
  }
}

/** 应用启动时调用一次：从 IndexedDB 读回已保存的背景图 */
export async function initCustomBg() {
  const saved = await idbGet()
  if (saved) customBgUrl.value = saved
  customBgReady.value = true
  applyVar()
}

/**
 * 把用户选的图片压到最长边 1920px、JPEG 0.85，返回 data URL。
 * 大图原样存会撑爆存储且解码慢，背景图这个尺寸足够。
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1920
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(1, Math.round(img.naturalWidth * scale))
      const h = Math.max(1, Math.round(img.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas unavailable'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}

export function useCustomBg() {
  async function setCustomBg(dataUrl: string): Promise<boolean> {
    customBgUrl.value = dataUrl
    applyVar()
    return idbSet(dataUrl)
  }

  async function clearCustomBg() {
    customBgUrl.value = null
    applyVar()
    await idbDelete()
  }

  return { customBgUrl, customBgReady, setCustomBg, clearCustomBg }
}
