async function extractMeta(file) {
  // 1) Crear URL y abrir PDF
  const url = URL.createObjectURL(file);
  const pdf = await pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(1);

  // 2) Render completo en fullRenderCanvas
  const vpFull = page.getViewport({ scale: 2 });
  fullRenderCanvas.width  = vpFull.width;
  fullRenderCanvas.height = vpFull.height;
  await page.render({ canvasContext: fullCtx, viewport: vpFull }).promise;

  // 3) Recortar primeros 10 cm en regionCanvas
  const pagePts  = page.view[3] - page.view[1];
  const regionPx = Math.floor(((15 * 72/2.54) / pagePts) * vpFull.height);
  regionCanvas.width  = vpFull.width;
  regionCanvas.height = regionPx;
  regionCtx.putImageData(
    fullCtx.getImageData(0, 0, vpFull.width, regionPx),
    0, 0
  );

  // 4) OCR sobre regionCanvas
  const { data:{ text } } = await Tesseract.recognize(
    regionCanvas,
    'spa',
    { tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK }
  );
  const excerpt = text.slice(0, 2000);

  console.log(excerpt);
  // 5) Extraer campos (usa tus funciones existentes)
  const num   = extractCjDaNumber(excerpt) || 'NoOficio';
  const subj  = extractSubject(excerpt);
  const dateI = extractDateISO(excerpt) || 'SinFecha';
  const safe  = s => s.replace(/[/\\?%*:|"<>]/g,'_');

  let nombreJustificante=""; // (Tu lógica original la he cambiado a 'let' por si acaso)

 if (/justificante/i.test(subj)) {  
    nombreJustificante += " - "+(extractNameJustificante(excerpt)|| ''); // (Ajuste leve: || '' dentro del paréntesis)
  }

  // --- INICIO DE LA MODIFICACIÓN ---

  // Si el asunto es un justificante, agrega el prefijo.
  const prefix = /justificante/i.test(subj) ? "Desarrollo de Personal - " : ""; // <-- NUEVO

  // Se construye el nombre final con el prefijo (que estará vacío si no es justificante)
  const newName = safe(`${dateI} ${num} - ${prefix}${subj}${nombreJustificante}.pdf`); // <-- MODIFICADO

  // --- FIN DE LA MODIFICACIÓN ---

  URL.revokeObjectURL(url);
  return { newName };
}

function extractCjDaNumber(text) {
    const regex = /(\d+)\/\d{4}/;
    const m = regex.exec(text);
    return m ? m[1] : null;
}

function extractDependency(text) {
    const regex = /(?:Dependencia|Secretar[ií]a)\s*:\s*([\s\S]*?)(?:\.|\r?\n)/i;
    const m = regex.exec(text);
    return m ? m[1].trim() : 'Dependencia no encontrada';
}

function extractSubject(text) {
    const m = /Asunto\s*:\s*([\s\S]*?)(?:\.|\r?\n)/i.exec(text);
    return m ? m[1].trim() : 'No encontrado';
}

function extractNameJustificante(text) {
    // 1. El regex ahora busca "el C.", "la C.", "el Ing." o "la Ing."
    //    Añadimos la bandera 'g' (global) para encontrar TODAS las coincidencias.
    const regex = /(?:el|la)\s+(?:C\.|Ing\.)\s*([^,]*)/ig;
    
    let lastMatch = null;
    let m;

    // 2. Iteramos sobre todas las coincidencias que encuentre exec()
    while ((m = regex.exec(text)) !== null) {
        // 3. Guardamos cada coincidencia. La variable 'lastMatch'
        //    siempre tendrá la ÚLTIMA que se encontró.
        lastMatch = m;
    }

    // 4. Si encontramos al menos una, devolvemos el grupo capturado (el nombre)
    //    de la última coincidencia.
    return lastMatch ? lastMatch[1].trim() : 'No encontrado';
}


/**
 * Extrae la fecha y la formatea a ISO YYYY-MM-DD directamente.
 * Devuelve el string ISO o null si no se encuentra.
 */
function extractDateISO(text) {
    const meses = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
        'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    let m;
    
    // Patrón 1: Día de Mes [de] Año (Ej: "31 de octubre 2025" o "31 de octubre de 2025")
    m = /Chilpancingo[\s\S]*?(\d{1,2})\s+de\s+(\w+)\s+(?:(?:de|del)\s+)?(\d{4})/i.exec(text);
    if (m) {
        const day = m[1].padStart(2, '0');
        const monthTxt = m[2].toLowerCase();
        const year = m[3];
        const mm = meses[monthTxt];
        if (mm) return `${year}-${mm}-${day}`;
    }

    // Patrón 2: Mes Día de Año (Ej: "octubre 29 de 2025")
    m = /Chilpancingo[\s\S]*?(\w+)\s+(\d{1,2})\s+de\s+(\d{4})/i.exec(text);
    if (m) {
        const monthTxt = m[1].toLowerCase();
        const day = m[2].padStart(2, '0');
        const year = m[3];
        const mm = meses[monthTxt];
        if (mm) return `${year}-${mm}-${day}`;
    }
    
    // Si nada funciona, podemos añadir el Patrón 2 pero opcional (por si acaso)
    m = /Chilpancingo[\s\S]*?(\w+)\s+(\d{1,2})\s+(?:(?:de|del)\s+)?(\d{4})/i.exec(text);
    if (m) {
        const monthTxt = m[1].toLowerCase();
        const day = m[2].padStart(2, '0');
        const year = m[3];
        const mm = meses[monthTxt];
        if (mm) return `${year}-${mm}-${day}`;
    }


    return null; // Devuelve null si no se encuentra una fecha válida
}
    