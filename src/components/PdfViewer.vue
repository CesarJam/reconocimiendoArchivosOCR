<script setup>
import { DocumentTextIcon } from '@heroicons/vue/24/outline'

defineProps({
  fileUrl: String
})
</script>

<template>
  <div class="bg-slate-200 dark:bg-slate-900 rounded-2xl h-[calc(100vh-140px)] sticky top-6 overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
    <iframe v-if="fileUrl" :src="fileUrl" class="w-full h-full border-none"></iframe>
    <div v-else class="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
      <DocumentTextIcon class="w-20 h-20 opacity-20" />
      <p class="font-medium">Selecciona un archivo para previsualizar</p>
    </div>
  </div>
</template>