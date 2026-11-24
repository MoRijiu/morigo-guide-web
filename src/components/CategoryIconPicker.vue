<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CATEGORY_ICON_PRESETS } from '../utils/categoryIcons'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [icon: string]
}>()
</script>

<template>
  <div class="grid grid-cols-8 gap-1" role="radiogroup">
    <button
      v-for="icon in CATEGORY_ICON_PRESETS"
      :key="icon"
      type="button"
      role="radio"
      :aria-checked="modelValue === icon"
      :aria-label="icon"
      :title="icon"
      class="flex items-center justify-center p-1.5 rounded-md text-base transition-colors"
      :class="
        modelValue === icon
          ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300 ring-1 ring-accent-400'
          : 'text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-600 dark:hover:text-surface-300'
      "
      @click="emit('update:modelValue', icon)"
    >
      <Icon :icon="icon" />
    </button>
  </div>
</template>
