import * as pdfjsLib from 'pdfjs-dist'
import Tesseract from 'tesseract.js'

// Configuración del Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`

// --- FUNCIONES PRIVADAS DE EXTRACCIÓN ---
function extractCjDaNumber(text) {
    const regex = /(\d+)\/\d{4}/;
    const m = regex.exec(text);
    return m ? m[1] : null;
}

function extractSubject(text) {
    const m = /Asunto\s*:\s*([\s\S]*?)(?:\.|\r?\n)/i.exec(text);
    return m ? m[1].trim() : 'No encontrado';
}

function extractNameJustificante(text) {
    const regex = /(?:el|la)\s+(?:C\.|Ing\.|Lic\.)\s*([^,]*)/ig;
    let lastMatch = null, m;
    while ((m = regex.exec(text)) !== null) { lastMatch = m; }
    return lastMatch ? lastMatch[1].trim() : 'No encontrado';
}

function extractDateISO(text) {
    const meses = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
        'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    let m;
    
    m = /Chilpancingo[\s\S]*?(\d{1,2})\s+de\s+(\w+)\s+(?:(?:de|del)\s+)?(\d{4})/i.exec(text);
    if (m && meses[m[2].toLowerCase()]) return `${m[3]}-${meses[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;

    m = /Chilpancingo[\s\S]*?(\w+)\s+(\d{1,2})\s+de\s+(\d{4})/i.exec(text);
    if (m && meses[m[1].toLowerCase()]) return `${m[3]}-${meses[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;
    
    m = /Chilpancingo[\s\S]*?(\w+)\s+(\d{1,2})\s+(?:(?:de|del)\s+)?(\d{4})/i.exec(text);
    if (m && meses[m[1].toLowerCase()]) return `${m[3]}-${meses[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;

    return null;
}

// --- FUNCIÓN PÚBLICA EXPORTADA ---
export const performOCR = async (fileRaw) => {
  const url = URL.createObjectURL(fileRaw)
  
  try {
    const loadingTask = pdfjsLib.getDocument({ url: url })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)

    const vpFull = page.getViewport({ scale: 2 })
    const fullCanvas = document.createElement('canvas')
    fullCanvas.width = vpFull.width
    fullCanvas.height = vpFull.height
    const fullCtx = fullCanvas.getContext('2d')
    await page.render({ canvasContext: fullCtx, viewport: vpFull }).promise

    const pagePts = page.view[3] - page.view[1]
    const regionPx = Math.floor(((15 * 72/2.54) / pagePts) * vpFull.height)
    const regionCanvas = document.createElement('canvas')
    regionCanvas.width = vpFull.width
    regionCanvas.height = regionPx
    const regionCtx = regionCanvas.getContext('2d')
    regionCtx.putImageData(fullCtx.getImageData(0, 0, vpFull.width, regionPx), 0, 0)

    const { data:{ text } } = await Tesseract.recognize(
      regionCanvas, 'spa', { tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK }
    )
    
    const excerpt = text.slice(0, 2000)
    console.log(`[OCR Texto Extraído]:\n`, excerpt)

    const num = extractCjDaNumber(excerpt) || 'NoOficio'
    const subj = extractSubject(excerpt)
    const dateI = extractDateISO(excerpt) || 'SinFecha'
    const safe = s => s.replace(/[/\\?%*:|"<>]/g,'_')

    let nombreJustificante = ""
    if (/(justificante|guardia|incapacidad)/i.test(subj)) {  
      nombreJustificante += " - " + (extractNameJustificante(excerpt) || '')
    }
    const prefix = /(justificante|guardia|incapacidad)/i.test(subj) ? "Desarrollo de Personal - " : ""
    
    URL.revokeObjectURL(url)
    return safe(`${dateI} ${num} ${prefix}${subj}${nombreJustificante}.pdf`)

  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}