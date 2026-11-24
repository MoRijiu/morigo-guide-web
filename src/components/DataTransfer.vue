<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
import { useI18n } from '../i18n'

const { t } = useI18n()

const { customCategories, importCategories } = useCustomData()
const { favorites, recent, importUserData } = useUserData()

const open = ref(false)
const mode = ref<'merge' | 'replace'>('merge')
const message = ref('')
const isError = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const shareUrl = ref('')

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

onMounted(() => window.addEventListener('morigo:open-share', onOpenShareEvent))
onBeforeUnmount(() => window.removeEventListener('morigo:open-share', onOpenShareEvent))

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
  <div class="relative">
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
      class="absolute right-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
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
      <p
        v-if="message"
        class="px-2 mt-2 text-[11px]"
        :class="isError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
        role="status"
      >{{ message }}</p>
    </div>
  </div>
</template>
