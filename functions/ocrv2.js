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
  const dateT = extractDate(excerpt);
  const dateI = dateT !== 'No encontrada' ? formatDateToISO(dateT) : 'SinFecha';
  const safe  = s => s.replace(/[/\\?%*:|"<>]/g,'_');

  nombreJustificante="";

 if (/justificante/i.test(subj)) {  
    nombreJustificante += " - "+extractNameJustificante(excerpt)|| '';
  }


  const newName = safe(`${dateI} ${num} - ${subj}${nombreJustificante}.pdf`);

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
    const m = /C\.\s*([^,]*)/i.exec(text);
    return m ? m[1].trim() : 'No encontrado';
}


function extractDate(text) {
    // 1) Día-Mes-Año tras "Chilpancingo"
    //let m = /Chilpancingo[\s\S]*?(\d{1,2})\s+de\s+(\w+)\s+(?:del\s+)?(\d{4})/i.exec(text);
    let m = /Chilpancingo[\s\S]*?(\d{1,2})\s+de\s+(\w+)\s+(?:de|del)\s+(\d{4})/i.exec(text);

    if (m) {
        const day = m[1].padStart(2, '0');
        const month = m[2].toLowerCase();
        const year = m[3];
        return `${day} ${month} ${year}`;
    }

    // 2) Mes-Día-Año tras "Chilpancingo"
    m = /Chilpancingo[\s\S]*?(\w+)\s+(\d{1,2})\s+de\s+(\d{4})/i.exec(text);
    if (m) {
        const month = m[1].toLowerCase();
        const day = m[2].padStart(2, '0');
        const year = m[3];
        return `${day} ${month} ${year}`;
    }

    return 'No encontrada';
}

function formatDateToISO(text) {
    const meses = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
        'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    // Normalizar eliminando 'del' y 'de'
    const norm = text.replace(/del/gi, ' ').replace(/\bde\b/gi, ' ').replace(/,/g, ' ').trim();
    // Intentar día, mes, año o mes, día, año
    const part = /(\d{1,2})\s+(\w+)\s+(\d{4})/.exec(norm) ||
        /(\w+)\s+(\d{1,2})\s+(\d{4})/.exec(norm);
    if (!part) return null;
    let day, monthTxt, year;
    if (/^\d/.test(part[1])) {
        day = part[1].padStart(2, '0');
        monthTxt = part[2];
        year = part[3];
    } else {
        monthTxt = part[1];
        day = part[2].padStart(2, '0');
        year = part[3];
    }
    const mm = meses[monthTxt.toLowerCase()];
    return mm ? `${year}-${mm}-${day}` : null;
}
    