<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import siteConfig from '../config/site'

const emit = defineEmits<{
  (e: 'search', keyword: string): void
}>()

const engines = siteConfig.search.engines

const activeEngine = ref('site')
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const currentEngine = computed(() => engines.find(e => e.key === activeEngine.value)!)

const placeholder = computed(() => {
  if (activeEngine.value === 'site') return '搜索站内导航...（按 / 快速聚焦）'
  return `在${currentEngine.value.label}中搜索...`
})

function switchEngine(key: string) {
  activeEngine.value = key
  if (key === 'site') {
    emit('search', inputValue.value)
  } else {
    emit('search', '')
  }
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  inputValue.value = val
  if (activeEngine.value === 'site') {
    emit('search', val)
  }
}

function clearInput() {
  inputValue.value = ''
  if (activeEngine.value === 'site') {
    emit('search', '')
  }
}

function onEnter() {
  if (activeEngine.value !== 'site' && inputValue.value.trim()) {
    window.open(currentEngine.value.url + encodeURIComponent(inputValue.value.trim()), '_blank')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    // 有内容先清空，没内容失焦；阻止冒泡避免 App 的全局 Esc 再处理一次
    e.stopPropagation()
    if (inputValue.value) {
      clearInput()
    } else {
      inputRef.value?.blur()
    }
  }
}

function focusInput() {
  inputRef.value?.focus()
  inputRef.value?.select()
}

defineExpose({ focusInput })
</script>

<template>
  <div class="max-w-xl mx-auto">
    <div class="flex items-center gap-1 mb-2.5 px-1" role="tablist" aria-label="搜索引擎切换">
      <button
        v-for="engine in engines"
        :key="engine.key"
        role="tab"
        :aria-selected="activeEngine === engine.key"
        @click="switchEngine(engine.key)"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
        :class="activeEngine === engine.key
          ? 'bg-accent-600 text-white dark:bg-accent-500'
          : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'"
      >
        <DynamicIcon :icon="engine.icon" class="text-sm" />
        {{ engine.label }}
      </button>
    </div>

    <div class="relative">
      <Icon icon="mdi:magnify" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-300 dark:text-surface-500 text-lg pointer-events-none" />
      <input
        ref="inputRef"
        id="morigo-search-input"
        type="text"
        class="search-box !pl-10 !pr-10"
        :placeholder="placeholder"
        :value="inputValue"
        aria-label="搜索站内导航"
        autocomplete="off"
        spellcheck="false"
        @input="onInput"
        @keydown.enter="onEnter"
        @keydown="onKeydown"
      />
      <button
        v-if="inputValue"
        type="button"
        @click="clearInput"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-surface-300 dark:text-surface-500 hover:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        aria-label="清空搜索"
        title="清空（Esc）"
      >
        <Icon icon="mdi:close" class="text-sm" />
      </button>
      <kbd
        v-else-if="activeEngine === 'site'"
        class="hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded border border-surface-200 dark:border-surface-700 text-[10px] leading-none text-surface-300 dark:text-surface-500 pointer-events-none select-none"
        title="按 / 快速聚焦搜索框"
      >/</kbd>
      <div
        v-else
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-surface-300 dark:text-surface-600 pointer-events-none select-none"
      >
        Enter &crarr;
      </div>
    </div>
  </div>
</template>
