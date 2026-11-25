<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import siteConfig from '../config/site'
import { useI18n } from '../i18n'

const { locale, setLocale, t } = useI18n()

const isDark = ref(false)

// 语言下拉（三语后改下拉：按钮显示当前语言，菜单里当前项打勾高亮）
const langOpen = ref(false)
const langRoot = ref<HTMLElement | null>(null)
const LANG_OPTIONS = [
  { value: 'zh', label: '中文', titleKey: 'header.toZh' },
  { value: 'en', label: 'English', titleKey: 'header.toEn' },
  { value: 'ja', label: '日本語', titleKey: 'header.toJa' },
] as const
const currentLangLabel = () =>
  LANG_OPTIONS.find((o) => o.value === locale.value)?.label ?? '中文'

function pickLocale(next: 'zh' | 'en' | 'ja') {
  setLocale(next)
  langOpen.value = false
}

function onLangDocPointerDown(e: PointerEvent) {
  if (langRoot.value && !langRoot.value.contains(e.target as Node)) langOpen.value = false
}
function onLangDocKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') langOpen.value = false
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  // 命令面板等外部入口通过事件请求切换主题，状态仍由顶栏统一持有
  window.addEventListener('morigo:toggle-theme', toggleDark)
  document.addEventListener('pointerdown', onLangDocPointerDown)
  document.addEventListener('keydown', onLangDocKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('morigo:toggle-theme', toggleDark)
  document.removeEventListener('pointerdown', onLangDocPointerDown)
  document.removeEventListener('keydown', onLangDocKeyDown)
})

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
}
</script>

<template>
  <header class="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-surface-950/70 border-b border-surface-100 dark:border-surface-800/60">
    <div class="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 select-none group/logo">
        <span class="w-7 h-7 rounded-md bg-accent-600 dark:bg-accent-500 flex items-center justify-center">
          <DynamicIcon :icon="siteConfig.logoIcon" class="text-white text-base" />
        </span>
        <span class="font-display font-bold text-base tracking-tight text-surface-800 dark:text-surface-100">
          {{ siteConfig.title }}<span class="text-accent-600 dark:text-accent-400">{{ siteConfig.titleHighlight }}</span>
        </span>
        <Icon icon="mdi:chevron-right" class="text-xs text-surface-300 dark:text-surface-600 -ml-1.5 group-hover/logo:translate-x-0.5 transition-transform" />
      </a>

      <div class="flex items-center gap-1">
        <a
          v-if="siteConfig.githubUrl"
          :href="siteConfig.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-8 h-8 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="GitHub"
          :aria-label="t('header.github')"
        >
          <Icon icon="mdi:github" class="text-lg" />
        </a>
        <button
          @click="toggleDark"
          class="w-8 h-8 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          :title="isDark ? t('header.light') : t('header.dark')"
          :aria-label="isDark ? t('header.toLight') : t('header.toDark')"
        >
          <Icon :icon="isDark ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" :class="['text-lg', !isDark && '-rotate-[24deg]']" />
        </button>
        <!-- 语言切换：下拉式（三语），按钮显示当前语言、菜单当前项打勾——直接呈现当前状态 -->
        <div ref="langRoot" class="relative">
          <button
            type="button"
            class="h-8 pl-2 pr-1.5 rounded-md flex items-center gap-1 border border-surface-200 dark:border-surface-700 text-[11px] font-medium text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            :aria-label="t('header.langGroup')"
            :title="t('header.langGroup')"
            aria-haspopup="listbox"
            :aria-expanded="langOpen"
            @click="langOpen = !langOpen"
          >
            <Icon icon="mdi:translate" class="text-sm" />
            <span>{{ currentLangLabel() }}</span>
            <Icon icon="mdi:chevron-down" class="text-sm text-surface-400" />
          </button>
          <div
            v-if="langOpen"
            class="absolute right-0 top-full mt-1.5 w-32 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg shadow-surface-900/5 py-1 z-50"
            role="listbox"
            :aria-label="t('header.langGroup')"
          >
            <button
              v-for="opt in LANG_OPTIONS"
              :key="opt.value"
              type="button"
              role="option"
              class="w-full px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors"
              :class="locale === opt.value
                ? 'text-accent-600 dark:text-accent-400 font-semibold'
                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'"
              :aria-selected="locale === opt.value"
              :aria-current="locale === opt.value ? 'true' : undefined"
              :title="t(opt.titleKey)"
              @click="pickLocale(opt.value)"
            >
              <span>{{ opt.label }}</span>
              <Icon v-if="locale === opt.value" icon="mdi:check" class="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
