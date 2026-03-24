<script setup>
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  FolderArrowDownIcon 
} from '@heroicons/vue/24/outline'
import { FileText, Trash2, Eye } from 'lucide-vue-next'

const props = defineProps({
  files: Array,
  isProcessing: Boolean
})

const emit = defineEmits(['files-selected', 'remove-file', 'preview-file', 'start-rename', 'save-files'])

const onFileChange = (e) => {
  emit('files-selected', Array.from(e.target.files))
  e.target.value = '' 
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-center hover:border-blue-500 transition-all group">
      <input type="file" multiple accept="application/pdf" @change="onFileChange" class="hidden" id="fileInput" />
      <label for="fileInput" class="cursor-pointer flex flex-col items-center">
        <CloudArrowUpIcon class="w-16 h-16 text-slate-400 group-hover:text-blue-500 transition-colors" />
        <p class="mt-4 text-slate-600 dark:text-slate-300 font-medium text-lg">Suelta tus archivos PDF aquí</p>
        <p class="text-sm text-slate-400">o haz clic para explorar tu equipo</p>
      </label>
    </div>

    <div v-if="files.length" class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border dark:border-slate-700">
      <div class="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-wrap gap-3">
        <h3 class="font-semibold dark:text-white">Archivos cargados ({{ files.length }})</h3>
        
        <div class="flex gap-2">
          <button @click="$emit('start-rename')" :disabled="isProcessing" class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
            <ArrowPathIcon v-if="isProcessing" class="w-5 h-5 animate-spin" />
            <CheckCircleIcon v-else class="w-5 h-5" /> 
            {{ isProcessing ? 'Procesando...' : 'Iniciar Renombrado' }}
          </button>
          
          <button @click="$emit('save-files')" :disabled="isProcessing" class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
            <FolderArrowDownIcon class="w-5 h-5" />
            Guardar
          </button>
        </div>
      </div>
      
      <ul class="divide-y dark:divide-slate-700 overflow-y-auto max-h-[500px]">
        <li v-for="file in files" :key="file.id" class="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
          <div class="p-2 rounded-lg" :class="file.status === 'Completado' ? 'bg-green-100' : 'bg-red-100 dark:bg-red-900/30'">
            <FileText class="w-6 h-6" :class="file.status === 'Completado' ? 'text-green-600' : 'text-red-600'" />
          </div>
          <div class="flex-grow min-w-0">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 truncate flex justify-between">
              {{ file.name }}
              <span :class="{'text-blue-500 animate-pulse': file.status === 'Procesando...', 'text-green-500': file.status === 'Completado', 'text-red-500': file.status === 'Error'}">
                {{ file.status }}
              </span>
            </p>
            <input v-model="file.newName" @focus="$emit('preview-file', file.previewUrl)" type="text" placeholder="Esperando escaneo..." class="mt-1 w-full bg-transparent border-b border-slate-200 dark:border-slate-600 focus:border-blue-500 outline-none text-sm font-semibold dark:text-white py-1 transition-colors" />
          </div>
          <div class="flex gap-2">
            <button @click="$emit('preview-file', file.previewUrl)" class="p-2 text-slate-400 hover:text-blue-500 transition">
              <Eye class="w-5 h-5" />
            </button>
            <button @click="$emit('remove-file', file.id)" class="p-2 text-slate-400 hover:text-red-500 transition" :disabled="isProcessing">
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>