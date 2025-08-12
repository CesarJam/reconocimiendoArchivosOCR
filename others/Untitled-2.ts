// Paso 2: Generar renombrados y mostrar preview en lista 2
        renameBtn.addEventListener('click', () => {
            renamedFiles = files.map(f => {
                const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
                return { file: f, oldName: f.name, newName: `${rnd}` };
            });

            renamedList.innerHTML = '';
            renamedFiles.forEach((item, idx) => {
                const li = document.createElement('li');
                li.className = 'list-group-item';

                li.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="fw-bold me-3">${item.oldName}</div>
                    <input
                    type="text"
                    class="form-control form-control-sm flex-grow-1 me-3 edit-name"
                    data-idx="${idx}"
                    value="${item.newName}"
                    >
                    <button
                    class="btn btn-sm btn-outline-secondary preview-btn"
                    data-idx="${idx}"
                    >Vista previa</button>
                </div>
                <canvas class="preview-canvas mt-2 border" style="display:none; max-width:100%;"></canvas>
                `;

                renamedList.appendChild(li);

                // Listener para preview
                const btn = li.querySelector('.preview-btn');
                const canvas = li.querySelector('.preview-canvas');
                const ctx = canvas.getContext('2d');

                btn.addEventListener('click', async () => {
                    if (canvas.style.display === 'none') {
                        btn.disabled = true;
                        const url = URL.createObjectURL(item.file);
                        const pdf = await pdfjsLib.getDocument(url).promise;
                        const page = await pdf.getPage(1);

                        // 1) Elige una escala base más alta (p.ej. 1.5 o 2)
                        const baseScale = 1.5;
                        const viewport = page.getViewport({ scale: baseScale });

                        // 2) Ajusta por el devicePixelRatio para pantallas Retina
                        const outputScale = window.devicePixelRatio || 1;
                        canvas.width = Math.floor(viewport.width * outputScale);
                        canvas.height = Math.floor(viewport.height * outputScale);
                        // CSS mantiene el tamaño lógico
                        canvas.style.width = viewport.width + 'px';
                        canvas.style.height = viewport.height + 'px';

                        const ctx = canvas.getContext('2d');
                        // Transforma el contexto para la resolución física
                        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

                        // 3) Renderiza
                        await page.render({ canvasContext: ctx, viewport }).promise;
                        URL.revokeObjectURL(url);

                        canvas.style.display = 'block';
                        btn.textContent = 'Ocultar vista previa';
                        btn.disabled = false;
                    } else {
                        canvas.style.display = 'none';
                        btn.textContent = 'Vista previa';
                    }
                });

            });

            // Listener para inputs editables
            renamedList.querySelectorAll('.edit-name').forEach(input => {
                input.addEventListener('input', e => {
                    const i = e.target.dataset.idx;
                    renamedFiles[i].newName = e.target.value;
                });
            });

            confirmBtn.disabled = renamedFiles.length === 0;
        });
