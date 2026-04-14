<script setup>
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import FilePanel from './components/FilePanel.vue'
import PdfViewer from './components/PdfViewer.vue'
import MetadataExtractor from './components/MetadataExtractor.vue'
import { performOCR } from './utils/ocrLogic.js'
import { DocumentTextIcon, TableCellsIcon } from '@heroicons/vue/24/outline'

// Estado de navegación (Pestañas)
const activeTab = ref('renamer') // Puede ser 'renamer' o 'extractor'

// Estados reactivos globales
const files = ref([])
const selectedFileUrl = ref(null)
const isDarkMode = ref(false)
const isProcessing = ref(false)

// --- MÉTODOS GLOBALES ---
const toggleDark = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark')
}

// --- MÉTODOS DEL RENOMBRADOR ---
const handleFilesSelected = (selectedFiles) => {
  const mapped = selectedFiles.map(file => ({
    id: crypto.randomUUID(),
    name: file.name,
    newName: '', 
    status: 'Pendiente',
    raw: file,
    previewUrl: URL.createObjectURL(file)
  }))
  files.value = [...files.value, ...mapped]
  
  if (!selectedFileUrl.value && mapped.length > 0) {
    selectedFileUrl.value = mapped[0].previewUrl
  }
}

const removeFile = (id) => {
  files.value = files.value.filter(f => f.id !== id)
  if (files.value.length === 0) selectedFileUrl.value = null
}

const previewFile = (url) => {
  selectedFileUrl.value = url
}

const startMassiveRename = async () => {
  if (isProcessing.value || files.value.length === 0) return
  isProcessing.value = true

  for (const file of files.value) {
    if (file.status === 'Pendiente' || file.status === 'Error') {
      file.status = 'Procesando...'
      try {
        const newName = await performOCR(file.raw)
        file.newName = newName
        file.status = 'Completado'
      } catch (error) {
        console.error(`Error procesando ${file.name}:`, error)
        file.status = 'Error'
      }
    }
  }
  
  isProcessing.value = false
}

const saveFiles = async () => {
  const completados = files.value.filter(f => f.status === 'Completado' || f.newName)
  if (!completados.length) return

  try {
    const dirHandle = await window.showDirectoryPicker()
    const perm = await dirHandle.requestPermission({ mode: 'readwrite' })
    if (perm !== 'granted') throw new Error('Permiso denegado por el usuario.')

    for (const fileObj of completados) {
      const nuevoNombre = fileObj.newName.trim() || fileObj.name
      const buffer = await fileObj.raw.arrayBuffer()
      const fh = await dirHandle.getFileHandle(nuevoNombre, { create: true })
      const w = await fh.createWritable()
      await w.write(buffer)
      await w.close()
    }

    try {
        const audio = new Audio('/success.mp3');
        audio.play();
    } catch(e) {}

    alert(`✅ ${completados.length} archivos guardados correctamente.`)
  } catch (error) {
    console.error("Error al guardar:", error)
    alert('❌ Error al guardar: ' + error.message)
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-8">
    <AppHeader :is-dark-mode="isDarkMode" @toggle-dark="toggleDark" />

    <main class="w-full px-2">
      
      <div class="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        <button 
          @click="activeTab = 'renamer'" 
          :class="[
            'flex items-center gap-2 py-4 px-6 font-medium text-sm focus:outline-none transition-colors border-b-2',
            activeTab === 'renamer' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          ]"
        >
          <DocumentTextIcon class="w-5 h-5" />
          Renombrador OCR
        </button>
        
        <button 
          @click="activeTab = 'extractor'" 
          :class="[
            'flex items-center gap-2 py-4 px-6 font-medium text-sm focus:outline-none transition-colors border-b-2',
            activeTab === 'extractor' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          ]"
        >
        
          <TableCellsIcon class="w-5 h-5" />
          Extractor para Excel
        </button>
      </div>
      

      <div v-show="activeTab === 'renamer'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7">
          <FilePanel 
            :files="files" 
            :is-processing="isProcessing"
            @files-selected="handleFilesSelected"
            @remove-file="removeFile"
            @preview-file="previewFile"
            @start-rename="startMassiveRename"
            @save-files="saveFiles"
          />
        </div>

        <div class="lg:col-span-5">
          <PdfViewer :file-url="selectedFileUrl" />
        </div>
      </div>

      <div v-if="activeTab === 'extractor'" class="w-full animate-fade-in">
        <MetadataExtractor />
      </div>

    </main>
  </div>
</template>

<style scoped>
/* Pequeña animación para la transición de pestañas */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>