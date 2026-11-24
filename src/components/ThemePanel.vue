<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useThemePrefs, ACCENTS, BACKGROUNDS } from '../composables/useThemePrefs'
import { useCustomBg, compressImage } from '../composables/useCustomBg'
import { useI18n } from '../i18n'

const { t } = useI18n()

const { accent, bg, glass, bgDim, bgBlur, bgFixed, setAccent, setBg, setGlass, setBgDim, setBgBlur, setBgFixed } = useThemePrefs()
const { customBgUrl, setCustomBg, clearCustomBg } = useCustomBg()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const bgError = ref('')

function onBgClick(id: string) {
  // 选「自定义」但还没图时直接拉起文件选择，避免选中一个空背景
  if (id === 'custom' && !customBgUrl.value) {
    fileInput.value?.click()
    return
  }
  setBg(id)
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  bgError.value = ''
  if (!file.type.startsWith('image/')) {
    bgError.value = t('theme.bgErrorType')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    bgError.value = t('theme.bgErrorSize')
    return
  }
  try {
    const dataUrl = await compressImage(file)
    const saved = await setCustomBg(dataUrl)
    if (!saved) {
      bgError.value = t('theme.bgErrorSave')
      return
    }
    setBg('custom')
  } catch {
    bgError.value = t('theme.bgErrorType')
  }
}

async function onRemoveBg() {
  await clearCustomBg()
  if (bg.value === 'custom') setBg('none')
}

function onDocClick(e: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
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
      <Icon icon="mdi:palette-outline" class="text-sm" />
      {{ t('theme.button') }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1.5 z-50 w-60 max-h-[85dvh] overflow-y-auto max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:bottom-3 max-sm:top-auto max-sm:w-auto max-sm:max-h-[78dvh] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
      role="group"
      :aria-label="t('theme.aria')"
    >
      <p class="px-1 text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">{{ t('theme.accent') }}</p>
      <div class="flex items-center gap-2 px-1 mb-3" role="radiogroup" :aria-label="t('theme.accent')">
        <button
          v-for="a in ACCENTS"
          :key="a.id"
          type="button"
          role="radio"
          :aria-checked="accent === a.id"
          :aria-label="t('accent.' + a.id)"
          :title="t('accent.' + a.id)"
          class="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          :style="{ backgroundColor: a.swatch, boxShadow: accent === a.id ? `0 0 0 2px var(--tw-ring-offset-color, #fff), 0 0 0 4px ${a.swatch}` : undefined }"
          @click="setAccent(a.id)"
        >
          <Icon v-if="accent === a.id" icon="mdi:check" class="text-white text-sm" />
        </button>
      </div>

      <p class="px-1 text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">{{ t('theme.bg') }}</p>
      <div class="flex flex-wrap gap-1.5 px-1 mb-3" role="radiogroup" :aria-label="t('theme.bgAria')">
        <button
          v-for="b in BACKGROUNDS"
          :key="b.id"
          type="button"
          role="radio"
          :aria-checked="bg === b.id"
          class="px-2 py-1 rounded-md text-[11px] border transition-colors"
          :class="bg === b.id
            ? 'border-accent-500 text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10'
            : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-accent-300'"
          @click="onBgClick(b.id)"
        >{{ t('bg.' + b.id) }}</button>
      </div>

      <div class="px-1 mb-3">
        <p class="text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">{{ t('theme.customBg') }}</p>
        <div v-if="customBgUrl" class="flex items-center gap-2 mb-2">
          <img
            :src="customBgUrl"
            :alt="t('theme.bgPreview')"
            class="w-14 h-9 rounded-md object-cover border border-surface-200 dark:border-surface-700"
          />
          <button
            type="button"
            class="px-2 py-1 rounded-md text-[11px] border border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-accent-300 transition-colors"
            @click="fileInput?.click()"
          >
            <Icon icon="mdi:image-outline" class="inline text-xs -mt-px" /> {{ t('theme.replaceBg') }}
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-md text-[11px] border border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-red-300 hover:text-red-500 transition-colors"
            @click="onRemoveBg"
          >{{ t('theme.removeBg') }}</button>
        </div>
        <button
          v-else
          type="button"
          class="w-full px-2 py-1.5 rounded-md text-[11px] border border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          @click="fileInput?.click()"
        >
          <Icon icon="mdi:upload" class="inline text-xs -mt-px" /> {{ t('theme.uploadBg') }}
        </button>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <div v-if="customBgUrl" class="flex items-center gap-2 mt-2">
          <span class="text-[11px] text-surface-500 dark:text-surface-400 shrink-0">{{ t('theme.bgDim') }}</span>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            :value="bgDim"
            class="w-full accent-accent-500 h-1"
            :aria-label="t('theme.bgDim')"
            @input="setBgDim(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="text-[11px] text-surface-400 w-8 text-right">{{ bgDim }}%</span>
        </div>
        <div v-if="customBgUrl" class="flex items-center gap-2 mt-2">
          <span class="text-[11px] text-surface-500 dark:text-surface-400 shrink-0">{{ t('theme.bgBlur') }}</span>
          <input
            type="range"
            min="0"
            max="20"
            step="2"
            :value="bgBlur"
            class="w-full accent-accent-500 h-1"
            :aria-label="t('theme.bgBlur')"
            @input="setBgBlur(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="text-[11px] text-surface-400 w-8 text-right">{{ bgBlur }}px</span>
        </div>
        <div v-if="customBgUrl" class="flex items-center gap-2 mt-2">
          <span class="text-[11px] text-surface-500 dark:text-surface-400 shrink-0">{{ t('theme.bgMode') }}</span>
          <div class="flex rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden" role="radiogroup" :aria-label="t('theme.bgMode')">
            <button
              type="button"
              role="radio"
              :aria-checked="bgFixed"
              class="px-2 py-1 text-[11px] transition-colors"
              :class="bgFixed ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400' : 'text-surface-500 dark:text-surface-400'"
              @click="setBgFixed(true)"
            >{{ t('theme.bgFixed') }}</button>
            <button
              type="button"
              role="radio"
              :aria-checked="!bgFixed"
              class="px-2 py-1 text-[11px] transition-colors"
              :class="!bgFixed ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400' : 'text-surface-500 dark:text-surface-400'"
              @click="setBgFixed(false)"
            >{{ t('theme.bgScroll') }}</button>
          </div>
        </div>
        <p v-if="bgError" class="mt-1.5 text-[11px] text-red-500" role="alert">{{ bgError }}</p>
        <p class="mt-1.5 text-[11px] text-surface-300 dark:text-surface-600">{{ t('theme.bgHint') }}</p>
      </div>

      <button
        type="button"
        role="switch"
        :aria-checked="glass"
        class="w-full flex items-center justify-between px-1 py-1 rounded-md text-xs text-surface-600 dark:text-surface-300"
        @click="setGlass(!glass)"
      >
        <span>{{ t('theme.glass') }}</span>
        <span
          class="relative w-8 h-[18px] rounded-full transition-colors"
          :class="glass ? 'bg-accent-500' : 'bg-surface-200 dark:bg-surface-700'"
          aria-hidden="true"
        >
          <span
            class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all"
            :style="{ left: glass ? '16px' : '2px' }"
          />
        </span>
      </button>
      <p class="px-1 mt-1.5 text-[11px] text-surface-300 dark:text-surface-600">{{ t('theme.note') }}</p>
    </div>
  </div>
</template>
