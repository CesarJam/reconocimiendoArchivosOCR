<script setup>
import { ref, computed, onMounted } from 'vue'
import { CloudArrowUpIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline'
import * as pdfjsLib from 'pdfjs-dist'

// Mantenemos la misma configuración estable del worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`

// Estados
const filesData = ref([])
const storageRoute = ref('')
const selectedTrimester = ref(0)
const isCopying = ref(false)
const tableRef = ref(null) // Referencia a la tabla para copiarla

// Configuración de Fechas
const currentYear = new Date().getFullYear()
const trimesters = [
  { value: 0, label: 'Enero - Marzo', start: `${currentYear}-01-01`, end: `${currentYear}-03-31` },
  { value: 1, label: 'Abril - Junio', start: `${currentYear}-04-01`, end: `${currentYear}-06-30` },
  { value: 2, label: 'Julio - Septiembre', start: `${currentYear}-07-01`, end: `${currentYear}-09-30` },
  { value: 3, label: 'Octubre - Diciembre', start: `${currentYear}-10-01`, end: `${currentYear}-12-31` }
]

const currentDates = computed(() => {
  return trimesters.find(t => t.value === selectedTrimester.value)
})

// Asignar el trimestre actual por defecto al cargar
onMounted(() => {
  const currentMonth = new Date().getMonth()
  selectedTrimester.value = Math.floor(currentMonth / 3)
})

// Procesar PDFs para contar páginas
const getPdfPageCount = async (file) => {
  const url = URL.createObjectURL(file)
  try {
    const loadingTask = pdfjsLib.getDocument({ url })
    const pdf = await loadingTask.promise
    const pages = pdf.numPages
    URL.revokeObjectURL(url)
    return pages
  } catch (err) {
    console.error("Error al leer PDF:", file.name, err)
    URL.revokeObjectURL(url)
    return 'Error'
  }
}

const onFileChange = async (e) => {
  const selectedFiles = Array.from(e.target.files)
  
  // Agregar archivos con estado inicial
  const newFiles = selectedFiles.map(file => ({
    id: crypto.randomUUID(),
    name: file.name,
    pages: 'Calculando...',
    raw: file
  }))
  
  filesData.value = [...filesData.value, ...newFiles]
  e.target.value = '' // Reset input

  // Calcular páginas asíncronamente
  for (const rawItem of newFiles) {
    // Obtenemos el resultado (ya sea el número o 'Error')
    const pageCount = await getPdfPageCount(rawItem.raw)
    
    // 💡 CLAVE: Buscar el objeto REACTIVO en filesData.value usando el ID
    const reactiveItem = filesData.value.find(f => f.id === rawItem.id)
    if (reactiveItem) {
      reactiveItem.pages = pageCount // Ahora Vue sí detectará este cambio
    }
  }
}

// Lógica para copiar la tabla a Excel (Mantiene el formato HTML que le gusta a Excel)
const copyTableToExcel = () => {
  if (!tableRef.value || filesData.value.length === 0) return

  try {
    const range = document.createRange()
    range.selectNode(tableRef.value)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
    document.execCommand('copy')
    window.getSelection().removeAllRanges()

    isCopying.value = true
    setTimeout(() => { isCopying.value = false }, 2000)
  } catch (err) {
    console.error('Error al copiar la tabla: ', err)
    alert("Hubo un error al intentar copiar la tabla.")
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
      <h2 class="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
        <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm">1</span> 
        Configuración de Metadatos
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Trimestre del Expediente:</label>
          <select v-model="selectedTrimester" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all">
            <option v-for="t in trimesters" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobiliario o Ruta de Almacenamiento:</label>
          <input v-model="storageRoute" type="text" placeholder="Ej: http://sharepoint/ruta/..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-center hover:border-blue-500 transition-all group">
      <input type="file" multiple accept="application/pdf" @change="onFileChange" class="hidden" id="metadataFileInput" />
      <label for="metadataFileInput" class="cursor-pointer flex flex-col items-center">
        <CloudArrowUpIcon class="w-16 h-16 text-slate-400 group-hover:text-blue-500 transition-colors" />
        <p class="mt-4 text-slate-600 dark:text-slate-300 font-medium text-lg">Suelta tus archivos PDF aquí</p>
        <p class="text-sm text-slate-400">para extraer sus metadatos y contar sus páginas</p>
      </label>
    </div>

    <div v-if="filesData.length" class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden">
      <div class="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h3 class="font-semibold dark:text-white">Vista previa de Excel ({{ filesData.length }} archivos)</h3>
        
        <button @click="copyTableToExcel" :class="isCopying ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'" class="text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
          <DocumentDuplicateIcon class="w-5 h-5" />
          {{ isCopying ? '¡Tabla Copiada!' : 'Copiar Tabla a Excel' }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table ref="tableRef" class="w-full text-left border-collapse min-w-max">
          <thead class="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs uppercase border-b dark:border-slate-700">
            <tr>
              <th class="p-3 font-semibold">Nombre del Archivo</th>
              <th class="p-3 font-semibold text-right">Páginas</th>
              <th class="p-3 font-semibold text-center">Papel</th>
              <th class="p-3 font-semibold text-center">Electrónico</th>
              <th class="p-3 font-semibold text-center">Administrativo</th>
              <th class="p-3 font-semibold text-center">Legal</th>
              <th class="p-3 font-semibold text-center">Fiscal</th>
              <th class="p-3 font-semibold text-center">Contable</th>
              <th class="p-3 font-semibold text-center">Años Trámite</th>
              <th class="p-3 font-semibold text-center">Años Concentración</th>
              <th class="p-3 font-semibold text-center">Original</th>
              <th class="p-3 font-semibold text-center">Copia</th>
              <th class="p-3 font-semibold text-center">Pública</th>
              <th class="p-3 font-semibold text-center">Reserva</th>
              <th class="p-3 font-semibold text-center">Años Reserva</th>
              <th class="p-3 font-semibold text-center">Confidencial</th>
              <th class="p-3 font-semibold text-center">Apertura</th>
              <th class="p-3 font-semibold text-center">Cierre</th>
              <th class="p-3 font-semibold">Inmueble</th>
              <th class="p-3 font-semibold">Almacenamiento</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-slate-700/50 text-sm dark:text-slate-300">
            <tr v-for="file in filesData" :key="file.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <td class="p-3 font-medium text-slate-800 dark:text-slate-200">{{ file.name }}</td>
              <td class="p-3 text-right" :class="{'text-slate-400 italic': file.pages === 'Calculando...', 'font-bold': typeof file.pages === 'number'}">{{ file.pages }}</td>
              <td class="p-3 text-center">X</td>
              <td class="p-3 text-center">X</td>
              <td class="p-3 text-center">X</td>
              <td class="p-3 text-center"></td>
              <td class="p-3 text-center"></td>
              <td class="p-3 text-center"></td>
              <td class="p-3 text-center">2</td>
              <td class="p-3 text-center">6</td>
              <td class="p-3 text-center">X</td>
              <td class="p-3 text-center">X</td>
              <td class="p-3 text-center">X</td>
              <td class="p-3 text-center"></td>
              <td class="p-3 text-center"></td>
              <td class="p-3 text-center"></td>
              <td class="p-3 text-center whitespace-nowrap">{{ currentDates.start }}</td>
              <td class="p-3 text-center whitespace-nowrap">{{ currentDates.end }}</td>
              <td class="p-3">OFICINAS DE LA CONSEJERIA JURIDICA DEL PODER EJECUTIVO</td>
              <td class="p-3">{{ storageRoute }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>