<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import siteConfig from '../config/site'
import { useI18n } from '../i18n'

const { locale, setLocale, t } = useI18n()

const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  // 命令面板等外部入口通过事件请求切换主题，状态仍由顶栏统一持有
  window.addEventListener('morigo:toggle-theme', toggleDark)
})

onBeforeUnmount(() => {
  window.removeEventListener('morigo:toggle-theme', toggleDark)
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
          <Icon :icon="isDark ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" class="text-lg" />
        </button>
        <!-- 语言切换：双段式，当前语言高亮——按钮直接呈现当前状态，不再只显示目标语言 -->
        <div
          class="flex items-center rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden"
          role="group"
          :aria-label="t('header.langGroup')"
        >
          <button
            type="button"
            class="h-8 px-2 text-[11px] font-medium transition-colors"
            :class="locale === 'zh'
              ? 'bg-accent-600 text-white'
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'"
            :aria-pressed="locale === 'zh'"
            :aria-current="locale === 'zh' ? 'true' : undefined"
            :title="t('header.toZh')"
            :aria-label="t('header.toZh')"
            @click="setLocale('zh')"
          >中文</button>
          <button
            type="button"
            class="h-8 px-2 text-[11px] font-medium transition-colors"
            :class="locale === 'en'
              ? 'bg-accent-600 text-white'
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'"
            :aria-pressed="locale === 'en'"
            :aria-current="locale === 'en' ? 'true' : undefined"
            :title="t('header.toEn')"
            :aria-label="t('header.toEn')"
            @click="setLocale('en')"
          >EN</button>
        </div>
      </div>
    </div>
  </header>
</template>
