// Configuración PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js';

// Referencias a DOM
const inputsEntradaArchivos = document.getElementById('inputsEntradaArchivos'),
    listaArchivosOriginal = document.getElementById('listaArchivosOriginal'),
    btnRenombrar = document.getElementById('btnRenombrar'),
    listaRenombrada = document.getElementById('listaRenombrada'),
    btnConfirmar = document.getElementById('btnConfirmar'),
    loading = document.getElementById('loading'),
    output = document.getElementById('output'),
    pdfViewer = document.getElementById('pdfViewerIframe');

let archivos = [],
    archivosRenombrados = [],
    currentPdfUrl = null;

// Off-screen canvases
const fullRenderCanvas = document.createElement('canvas'),
    fullCtx = fullRenderCanvas.getContext('2d'),
    regionCanvas = document.createElement('canvas'),
    regionCtx = regionCanvas.getContext('2d', { willReadFrequently: true });

// Event delegation para editar nombres
listaRenombrada.addEventListener('input', e => {
    if (!e.target.classList.contains('edit-name')) return;
    const id = e.target.dataset.id;
    const item = archivosRenombrados.find(x => x.id === id);
    if (item) item.newName = e.target.value;
});

// Event delegation para previsualizar en panel derecho
/*
listaRenombrada.addEventListener('click', e => {
  if (!e.target.classList.contains('preview-btn')) return;
  const id = e.target.dataset.id;
  const item = archivosRenombrados.find(x => x.id === id);
  if (!item) return;
 
  // Revocar URL anterior
  if (currentPdfUrl) {
    URL.revokeObjectURL(currentPdfUrl);
    currentPdfUrl = null;
  }
  // Crear nueva URL y cargar en iframe
  currentPdfUrl = URL.createObjectURL(item.file);
  pdfViewer.src = currentPdfUrl;
 
  // Resaltar fila activa
  listaRenombrada.querySelectorAll('li').forEach(li => li.classList.remove('active'));
  e.target.closest('li').classList.add('active');
});
*/

/*agregado*/


// Utilidad: abre en el visor fijo y resalta la fila
function abrirPreviewPorId(id, liHint) {
    const item = archivosRenombrados.find(x => x.id === id);
    if (!item) return;

    // Revocar la URL anterior
    if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
        currentPdfUrl = null;
    }

    // Nueva URL y cargar en el iframe
    currentPdfUrl = URL.createObjectURL(item.file);
    pdfViewer.src = currentPdfUrl;

    // Resaltar fila activa
    const li = liHint || document.querySelector(`#listaRenombrada [data-id="${id}"]`)?.closest('li');
    listaRenombrada.querySelectorAll('li').forEach(n => n.classList.remove('active'));
    if (li) li.classList.add('active');
}
// 1) Click en botón "Vista previa" (ya lo tienes, puedes simplificarlo así)
listaRenombrada.addEventListener('click', e => {
    if (!e.target.classList.contains('preview-btn')) return;
    const id = e.target.dataset.id;
    abrirPreviewPorId(id, e.target.closest('li'));
});
// 2) NUEVO: al enfocar el input, abrir la vista previa
listaRenombrada.addEventListener('focusin', e => {
    if (!e.target.classList.contains('edit-name')) return;
    const id = e.target.dataset.id;
    abrirPreviewPorId(id, e.target.closest('li'));
});

// Paso 1: selección de archivos
inputsEntradaArchivos.addEventListener('change', () => {
    archivos = Array.from(inputsEntradaArchivos.files);
    listaArchivosOriginal.innerHTML = '';
    listaRenombrada.innerHTML = '';
    btnConfirmar.disabled = true;
    output.style.display = 'none';

    archivos.forEach(f => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = f.name;
        listaArchivosOriginal.appendChild(li);
    });
    btnRenombrar.disabled = archivos.length === 0;
});

// Función extractMeta (render+recorte+OCR)

// Métodos de extracción (extractCjDaNumber, extractSubject, extractDate, formatDateToISO)
// … coloca aquí tus funciones existentes …

// Paso 2: renombrar todos (OCR + montar filas)
btnRenombrar.addEventListener('click', async () => {
    if (!archivos.length) return;
    btnRenombrar.disabled = true;
    btnConfirmar.disabled = true;
    listaRenombrada.innerHTML = '';
    archivosRenombrados = [];
    //output.textContent = 'Procesando OCR en todos los archivos…';
    output.style.display = 'block';
    loading.style.display = 'block';

    for (let i = 0; i < archivos.length; i++) {
        const file = archivos[i];
        output.textContent = `Procesando ${i+1}/${archivos.length} \n${file.name}…`;

        try {
            const { newName } = await extractMeta(file);
            const id = crypto.randomUUID();
            archivosRenombrados.push({ id, file, oldName: file.name, newName });
            
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="fw-bold me-3">${file.name}</div>
          <input
            type="text"
            class="form-control form-control-sm flex-grow-1 me-3 edit-name"
            data-id="${id}"
            value="${newName}"
          >
          <button
            class="btn btn-sm btn-outline-secondary preview-btn"
            data-id="${id}"
          >Vista previa</button>
        </div>
      `;
            listaRenombrada.appendChild(li);
        } catch (err) {
            console.error('OCR error en', file.name, err);
        }
    }

    loading.style.display = 'none';
    output.style.display = 'none';
    btnConfirmar.disabled = archivosRenombrados.length === 0;
    btnRenombrar.disabled = false;
});

// Paso 3: confirmar y guardar
btnConfirmar.addEventListener('click', async () => {
    if (!archivosRenombrados.length) return;
    btnConfirmar.disabled = true;
    output.textContent = 'Guardando archivos…';
    output.style.display = 'block';

    try {
        const dirHandle = await window.showDirectoryPicker();
        const perm = await dirHandle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') throw new Error('Permiso denegado.');

        const inputs = listaRenombrada.querySelectorAll('.edit-name');
        for (const input of inputs) {
            const id = input.dataset.id;
            const item = archivosRenombrados.find(x => x.id === id);
            if (!item) continue;
            const nuevoNombre = input.value.trim() || item.oldName;
            const buffer = await item.file.arrayBuffer();
            const fh = await dirHandle.getFileHandle(nuevoNombre, { create: true });
            const w = await fh.createWritable();
            await w.write(buffer);
            await w.close();
        }

        output.textContent = `✅ ${inputs.length} archivos guardados correctamente.`;
        showSuccessToast(`✅ ${inputs.length} archivos guardados correctamente.`);
    } catch (err) {
        console.error(err);
        output.textContent = '❌ Error al guardar: ' + err.message;
    } finally {
        btnConfirmar.disabled = false;
    }
});

/*Modo Obscuro*/
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleDarkMode');

  // Verificar si hay un valor guardado en localStorage
  const savedMode = localStorage.getItem('theme');
  if (savedMode === 'dark') {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = '☀️ Modo claro';
  }

  // Listener para cambiar de modo
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      toggleBtn.textContent = '☀️ Modo claro';
    } else {
      localStorage.setItem('theme', 'light');
      toggleBtn.textContent = '🌙 Modo oscuro';
    }
  });
});

function showSuccessToast(message) {
  const toastEl  = document.getElementById('successToast');
  const bodyEl   = document.getElementById('successToastBody');
  if (bodyEl) bodyEl.textContent = message;

   // Reproducir audio
  const audio = new Audio('success.mp3');
  audio.play().catch(err => console.warn("No se pudo reproducir el audio:", err));

  // Instancia (o reusa) y muestra
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}
