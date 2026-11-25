<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useCustomData } from '../composables/useCustomData'
import { useUserData } from '../composables/useUserData'
import {
  buildBackup,
  downloadBackup,
  parseBackup,
  parseBookmarks,
} from '../utils/dataTransfer'
import { buildShareUrl } from '../utils/share'
import { buildSyncCode, parseSyncCode, applySyncPayload } from '../utils/syncCode'
import {
  loadWebDavConfig,
  saveWebDavConfig,
  isWebDavConfigValid,
  uploadSyncCodeToWebDav,
  downloadSyncCodeFromWebDav,
  WebDavError,
  type WebDavConfig,
} from '../utils/webdav'
import { copyText } from '../utils/clipboard'
import { useI18n } from '../i18n'

const { t } = useI18n()

const { customCategories, importCategories } = useCustomData()
const { favorites, recent, importUserData } = useUserData()

const open = ref(false)
// 桌面端面板定位：内容变高后（同步码/WebDAV 区）向下展开可能超出视口底部，
// 打开时实测按钮上下可用空间——下方不足时向上展开，并按可用空间动态限高。
// 移动端（<640px）是 fixed 底部抽屉、走 CSS 既有口径，不参与此计算。
const panelUp = ref(false)
const panelMaxH = ref<number | undefined>(undefined)

function layoutPanel() {
  if (window.innerWidth < 640 || !rootEl.value) {
    panelUp.value = false
    panelMaxH.value = undefined
    return
  }
  const rect = rootEl.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom - 12
  const above = rect.top - 12
  panelUp.value = below < 360 && above > below
  const space = panelUp.value ? above : below
  panelMaxH.value = Math.max(200, Math.min(Math.round(window.innerHeight * 0.85), space))
}

watch(open, (v) => {
  if (v) void nextTick(layoutPanel)
})
const mode = ref<'merge' | 'replace'>('merge')
const message = ref('')
const isError = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const shareUrl = ref('')
const syncCode = ref('')
/** 同步加密口令：只在本次面板会话内使用、不落盘；生成与导入/WebDAV 共用 */
const syncPassphrase = ref('')

async function onGenerateSync() {
  const encrypted = syncPassphrase.value.length > 0
  const code = await buildSyncCode(syncPassphrase.value)
  if (!code) {
    message.value = t('dt.msgSyncEmpty')
    isError.value = true
    return
  }
  syncCode.value = code
  const ok = await copyText(code)
  message.value = encrypted
    ? ok
      ? t('dt.msgSyncEncryptedCopied')
      : t('dt.msgSyncEncryptedReady')
    : ok
      ? t('dt.msgSyncCopied')
      : t('dt.msgSyncReady')
  isError.value = false
}

async function onImportSync() {
  const result = await parseSyncCode(syncCode.value, syncPassphrase.value)
  if (result.status !== 'ok') {
    message.value =
      result.status === 'needs-passphrase'
        ? t('dt.errSyncNeedsPass')
        : result.status === 'wrong-passphrase'
          ? t('dt.errSyncWrongPass')
          : t('dt.errSyncInvalid')
    isError.value = true
    return
  }
  if (!window.confirm(t('dt.syncConfirm'))) return
  applySyncPayload(result.payload)
  // 偏好类 composable 都是启动时读取的单例，整表写入后刷新页面统一生效
  window.location.reload()
}

// ---- WebDAV 同步：配置只存本机（不进同步码），凭据不离开用户自己的服务器 ----
const webdav = ref<WebDavConfig>(loadWebDavConfig())
const webdavBusy = ref(false)

function persistWebDav() {
  saveWebDavConfig(webdav.value)
}

function webdavErrorMessage(err: unknown): string {
  if (err instanceof WebDavError) {
    if (err.message === 'network') return t('dt.errWebdavNetwork')
    if (err.message === 'notfound') return t('dt.errWebdavNotFound')
    if (err.message === 'invalid') return t('dt.errSyncInvalid')
    return t('dt.errWebdavHttp', { status: err.status ?? '' })
  }
  return t('dt.errWebdavNetwork')
}

async function onWebDavUpload() {
  persistWebDav()
  if (!isWebDavConfigValid(webdav.value)) {
    message.value = t('dt.errWebdavConfig')
    isError.value = true
    return
  }
  const code = await buildSyncCode(syncPassphrase.value)
  if (!code) {
    message.value = t('dt.msgSyncEmpty')
    isError.value = true
    return
  }
  webdavBusy.value = true
  try {
    await uploadSyncCodeToWebDav(webdav.value, code)
    message.value = t('dt.msgWebdavUploaded')
    isError.value = false
  } catch (err) {
    message.value = webdavErrorMessage(err)
    isError.value = true
  } finally {
    webdavBusy.value = false
  }
}

async function onWebDavDownload() {
  persistWebDav()
  if (!isWebDavConfigValid(webdav.value)) {
    message.value = t('dt.errWebdavConfig')
    isError.value = true
    return
  }
  webdavBusy.value = true
  try {
    syncCode.value = await downloadSyncCodeFromWebDav(webdav.value)
    message.value = t('dt.msgWebdavDownloaded')
    isError.value = false
    // 拉回后复用手动导入同一确认与整表覆盖路径
    onImportSync()
  } catch (err) {
    message.value = webdavErrorMessage(err)
    isError.value = true
  } finally {
    webdavBusy.value = false
  }
}

async function onShare() {
  if (!customCategories.value.length && !favorites.value.length) {
    message.value = t('dt.msgNoShare')
    isError.value = true
    return
  }
  shareUrl.value = buildShareUrl({
    customCategories: customCategories.value,
    favorites: favorites.value,
  })
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    message.value = t('dt.msgShareCopied')
    isError.value = false
  } catch {
    message.value = t('dt.msgShareReady')
    isError.value = false
  }
}

function onOpenShareEvent() {
  open.value = true
  void onShare()
}

// 关闭口径与其它弹层统一：按钮开关 + 点面板外关闭 + Esc 关闭。
// 用 pointerdown 在按下时判定：触发按钮在本组件根元素内，不会误关；
// 面板（移动端为 fixed 底部抽屉）同为根元素子节点，面板内操作不误伤。
const rootEl = ref<HTMLElement | null>(null)

function onDocPointerDown(e: PointerEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onDocKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

function onResize() {
  if (open.value) layoutPanel()
}

onMounted(() => {
  window.addEventListener('morigo:open-share', onOpenShareEvent)
  window.addEventListener('resize', onResize)
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onDocKeyDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('morigo:open-share', onOpenShareEvent)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onDocKeyDown)
})

function onExport() {
  downloadBackup(buildBackup(customCategories.value, favorites.value, recent.value))
  message.value = t('dt.msgExported')
  isError.value = false
}

function pickFile() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const text = await file.text()
    if (/\.html?$/i.test(file.name)) {
      const cats = parseBookmarks(text)
      const count = importCategories(cats, mode.value)
      message.value = t('dt.msgBookmarks', { count, cats: cats.length })
    } else {
      const backup = parseBackup(text)
      const count = importCategories(backup.customCategories, mode.value)
      importUserData(backup.favorites, backup.recent, mode.value)
      message.value = t('dt.msgImported', { count, fav: backup.favorites.length })
    }
    isError.value = false
  } catch (err) {
    message.value = err instanceof Error ? err.message : t('dt.msgImportFail')
    isError.value = true
  }
}
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon icon="mdi:swap-horizontal" class="text-sm" />
      {{ t('dt.button') }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-50 w-72 max-w-[calc(100vw-2.5rem)] max-h-[85dvh] overflow-y-auto max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:bottom-3 max-sm:top-auto max-sm:w-auto max-sm:max-w-none max-sm:max-h-[78dvh] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
      :class="panelUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'"
      :style="panelMaxH ? { maxHeight: panelMaxH + 'px' } : undefined"
    >
      <button
        type="button"
        class="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        @click="onExport"
      >
        <Icon icon="mdi:download" class="text-sm" />
        {{ t('dt.export') }}
      </button>

      <button
        type="button"
        class="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        @click="onShare"
      >
        <Icon icon="mdi:share-variant" class="text-sm" />
        {{ t('dt.share') }}
      </button>
      <input
        v-if="shareUrl"
        :value="shareUrl"
        readonly
        :aria-label="t('dt.shareAria')"
        class="w-full mt-1 px-2 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-[11px] text-surface-500 dark:text-surface-400"
        @focus="($event.target as HTMLInputElement).select()"
      />

      <div class="flex items-center gap-1.5 mt-2 px-2">
        <span class="text-[11px] text-surface-400 dark:text-surface-500">{{ t('dt.importMode') }}</span>
        <div class="flex rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden" role="radiogroup" :aria-label="t('dt.importMode')">
          <button
            type="button"
            role="radio"
            :aria-checked="mode === 'merge'"
            class="px-2 py-1 text-[11px]"
            :class="mode === 'merge' ? 'bg-accent-600 text-white' : 'text-surface-500 dark:text-surface-400'"
            @click="mode = 'merge'"
          >{{ t('dt.merge') }}</button>
          <button
            type="button"
            role="radio"
            :aria-checked="mode === 'replace'"
            class="px-2 py-1 text-[11px]"
            :class="mode === 'replace' ? 'bg-accent-600 text-white' : 'text-surface-500 dark:text-surface-400'"
            @click="mode = 'replace'"
          >{{ t('dt.replace') }}</button>
        </div>
      </div>

      <button
        type="button"
        class="w-full flex items-center gap-1.5 px-2 py-1.5 mt-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        @click="pickFile"
      >
        <Icon icon="mdi:upload" class="text-sm" />
        {{ t('dt.import') }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,.html,.htm,application/json,text/html"
        class="hidden"
        @change="onFile"
      />
      <p class="px-2 mt-1 text-[11px] text-surface-300 dark:text-surface-600">{{ t('dt.replaceWarn') }}</p>

      <div class="mt-3 pt-2 border-t border-surface-100 dark:border-surface-800">
        <p class="px-2 text-[11px] font-medium text-surface-500 dark:text-surface-400">{{ t('dt.syncTitle') }}</p>
        <button
          type="button"
          class="w-full flex items-center gap-1.5 px-2 py-1.5 mt-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          @click="onGenerateSync"
        >
          <Icon icon="mdi:sync" class="text-sm" />
          {{ t('dt.syncGenerate') }}
        </button>
        <textarea
          v-model="syncCode"
          rows="3"
          :placeholder="t('dt.syncPlaceholder')"
          :aria-label="t('dt.syncTitle')"
          class="w-full mt-1 px-2 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-[11px] text-surface-500 dark:text-surface-400 break-all"
        />
        <div class="relative mt-1.5">
          <Icon
            icon="mdi:lock-outline"
            class="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-surface-400 pointer-events-none"
          />
          <input
            v-model="syncPassphrase"
            type="password"
            autocomplete="off"
            :placeholder="t('dt.syncPass')"
            :aria-label="t('dt.syncPass')"
            class="w-full pl-7 pr-2 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-[11px] text-surface-600 dark:text-surface-300"
          />
        </div>
        <button
          type="button"
          class="w-full flex items-center gap-1.5 px-2 py-1.5 mt-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-40"
          :disabled="!syncCode.trim()"
          @click="onImportSync"
        >
          <Icon icon="mdi:cloud-sync-outline" class="text-sm" />
          {{ t('dt.syncImport') }}
        </button>
        <p class="px-2 mt-1 text-[11px] text-surface-300 dark:text-surface-600">{{ t('dt.syncPassHint') }}</p>
        <p class="px-2 mt-1 text-[11px] text-surface-300 dark:text-surface-600">{{ t('dt.syncHint') }}</p>

        <p class="px-2 mt-3 text-[11px] font-medium text-surface-500 dark:text-surface-400">{{ t('dt.webdavTitle') }}</p>
        <input
          v-model="webdav.url"
          type="url"
          :placeholder="t('dt.webdavUrlPlaceholder')"
          :aria-label="t('dt.webdavUrl')"
          class="w-full mt-1 px-2 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-[11px] text-surface-600 dark:text-surface-300"
          @change="persistWebDav"
        />
        <div class="flex gap-1.5 mt-1.5">
          <input
            v-model="webdav.username"
            type="text"
            autocomplete="username"
            :placeholder="t('dt.webdavUser')"
            :aria-label="t('dt.webdavUser')"
            class="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-[11px] text-surface-600 dark:text-surface-300"
            @change="persistWebDav"
          />
          <input
            v-model="webdav.password"
            type="password"
            autocomplete="current-password"
            :placeholder="t('dt.webdavPass')"
            :aria-label="t('dt.webdavPass')"
            class="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-[11px] text-surface-600 dark:text-surface-300"
            @change="persistWebDav"
          />
        </div>
        <div class="flex gap-1.5 mt-1.5">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-40"
            :disabled="webdavBusy"
            @click="onWebDavUpload"
          >
            <Icon icon="mdi:cloud-upload-outline" class="text-sm" />
            {{ t('dt.webdavUpload') }}
          </button>
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-40"
            :disabled="webdavBusy"
            @click="onWebDavDownload"
          >
            <Icon icon="mdi:cloud-download-outline" class="text-sm" />
            {{ t('dt.webdavDownload') }}
          </button>
        </div>
        <p class="px-2 mt-1 text-[11px] text-surface-300 dark:text-surface-600">{{ t('dt.webdavHint') }}</p>
      </div>
      <p
        v-if="message"
        class="px-2 mt-2 text-[11px]"
        :class="isError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
        role="status"
      >{{ message }}</p>
    </div>
  </div>
</template>
