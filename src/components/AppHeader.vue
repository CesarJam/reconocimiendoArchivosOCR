<script setup>
import { DocumentTextIcon, MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

defineProps({
  isDarkMode: Boolean
})
defineEmits(['toggle-dark'])
</script>

<template>
  <header class="bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 shadow-sm">
    <div class="container w-full px-2 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <DocumentTextIcon class="w-8 h-8 text-blue-600" />
        <h1 class="text-xl font-bold dark:text-white text-slate-800">
          PDF Master Tool <span class="text-xs font-normal text-slate-400 block">by CesarJam®</span>
        </h1>
      </div>
      </div>
  </header>
</template>