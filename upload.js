// ============================================================================
// WEDDING PHOTO UPLOAD — upload.js
// ============================================================================
// Reemplaza la URL de abajo con la que te da Google Apps Script al desplegar.
// Instrucciones en: apps-script/README.md
// ============================================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBDDfjiiNIIvQ5uZNIjiAGLXSFKLN3ziM8Hga31OeSUBea73Qk6gz9BsjENPGyo7ieUQ/exec';

// ── Límites ──────────────────────────────────────────────────────────────────
const MAX_FILES        = 30;          // máximo de fotos por sesión
const MAX_SIZE_MB      = 15;          // tamaño máximo por archivo (MB)
const COMPRESS_MAX_PX  = 1920;        // lado más largo tras comprimir (px)
const COMPRESS_QUALITY = 0.82;        // calidad JPEG (0–1)

// ── Referencias al DOM ───────────────────────────────────────────────────────
const uploadZone       = document.getElementById('uploadZone');
const fileInput        = document.getElementById('fileInput');
const previewGrid      = document.getElementById('previewGrid');
const uploadCount      = document.getElementById('uploadCount');
const uploadBtn        = document.getElementById('uploadBtn');
const uploadBtnText    = document.getElementById('uploadBtnText');
const progressContainer= document.getElementById('progressContainer');
const progressText     = document.getElementById('progressText');
const progressPercent  = document.getElementById('progressPercent');
const progressBarFill  = document.getElementById('progressBarFill');
const successState     = document.getElementById('successState');
const successText      = document.getElementById('successText');
const uploadAgainBtn   = document.getElementById('uploadAgainBtn');
const errorMsg         = document.getElementById('errorMsg');

// ── Estado de la aplicación ──────────────────────────────────────────────────
let selectedFiles = []; // Array de { file: File, objectURL: string }

// ── Eventos de UI ────────────────────────────────────────────────────────────

// Clic / teclado en la zona de drop
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});

// Drag & drop (para desktop)
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('upload-zone--active');
});
uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('upload-zone--active');
});
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('upload-zone--active');
    handleFiles(Array.from(e.dataTransfer.files));
});

// Selección de archivos por input
fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = ''; // permite volver a seleccionar los mismos archivos
});

// Botón principal de subida
uploadBtn.addEventListener('click', startUpload);

// Botón "Subir más fotos"
uploadAgainBtn.addEventListener('click', resetUI);

// ── Manejo de archivos seleccionados ─────────────────────────────────────────

function handleFiles(files) {
    hideError();

    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        showError('Por favor selecciona archivos de imagen (JPG, PNG, etc.)');
        return;
    }

    // Verificar tamaño
    const oversized = imageFiles.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
        showError(`Algunos archivos son muy grandes (máx. ${MAX_SIZE_MB}MB). Intenta con otras fotos.`);
        return;
    }

    // Agregar a la lista sin duplicar
    const remaining = MAX_FILES - selectedFiles.length;
    if (remaining <= 0) {
        showError(`Máximo ${MAX_FILES} fotos por sesión. Sube las actuales primero.`);
        return;
    }

    const toAdd = imageFiles.slice(0, remaining);
    toAdd.forEach(file => {
        selectedFiles.push({ file, objectURL: URL.createObjectURL(file) });
    });

    if (imageFiles.length > remaining) {
        showError(`Solo se agregaron ${remaining} fotos (límite: ${MAX_FILES} por sesión).`);
    }

    renderPreviews();
    updateCounter();
    updateUploadButton();
}

// ── Render de miniaturas ─────────────────────────────────────────────────────

function renderPreviews() {
    previewGrid.innerHTML = '';

    selectedFiles.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.dataset.index = index;

        const img = document.createElement('img');
        img.src = item.objectURL;
        img.alt = `Foto ${index + 1}`;
        img.loading = 'lazy';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-item__remove';
        removeBtn.innerHTML = '×';
        removeBtn.setAttribute('aria-label', `Eliminar foto ${index + 1}`);
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile(index);
        });

        div.appendChild(img);
        div.appendChild(removeBtn);
        previewGrid.appendChild(div);
    });
}

function removeFile(index) {
    URL.revokeObjectURL(selectedFiles[index].objectURL);
    selectedFiles.splice(index, 1);
    renderPreviews();
    updateCounter();
    updateUploadButton();
    hideError();
}

function updateCounter() {
    if (selectedFiles.length === 0) {
        uploadCount.textContent = '';
    } else {
        uploadCount.textContent = `${selectedFiles.length} foto${selectedFiles.length > 1 ? 's' : ''} seleccionada${selectedFiles.length > 1 ? 's' : ''}`;
    }
}

function updateUploadButton() {
    if (selectedFiles.length === 0) {
        uploadBtn.disabled = true;
        uploadBtnText.textContent = 'Selecciona fotos primero';
    } else {
        uploadBtn.disabled = false;
        uploadBtnText.textContent = `Compartir ${selectedFiles.length} foto${selectedFiles.length > 1 ? 's' : ''}`;
    }
}

// ── Compresión de imagen ─────────────────────────────────────────────────────

/**
 * Redimensiona y comprime una imagen usando Canvas API.
 * Retorna un Blob JPEG comprimido.
 */
function compressImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Redimensionar si es más grande que COMPRESS_MAX_PX
            if (width > COMPRESS_MAX_PX || height > COMPRESS_MAX_PX) {
                if (width >= height) {
                    height = Math.round(height * (COMPRESS_MAX_PX / width));
                    width  = COMPRESS_MAX_PX;
                } else {
                    width  = Math.round(width * (COMPRESS_MAX_PX / height));
                    height = COMPRESS_MAX_PX;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                COMPRESS_QUALITY
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file); // fallback: usar original
        };

        img.src = url;
    });
}

/**
 * Convierte un Blob a string base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // quitar "data:...;base64,"
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ── Proceso de subida ────────────────────────────────────────────────────────

async function startUpload() {
    if (selectedFiles.length === 0) return;

    // Verificar que la URL está configurada
    if (APPS_SCRIPT_URL === 'REEMPLAZA_CON_TU_URL_DE_APPS_SCRIPT') {
        showError('⚙️ La URL de Apps Script no está configurada. Sigue las instrucciones en apps-script/README.md');
        return;
    }

    hideError();
    setUploading(true);

    let uploaded = 0;
    let failed   = 0;
    const total  = selectedFiles.length;

    showProgress(0, total);

    for (let i = 0; i < total; i++) {
        const item  = selectedFiles[i];
        const thumb = previewGrid.querySelector(`[data-index="${i}"]`);

        if (thumb) thumb.classList.add('preview-item--uploading');
        updateProgressText(i + 1, total);

        try {
            // 1. Comprimir la imagen
            const compressed = await compressImage(item.file);

            // 2. Convertir a base64
            const base64 = await blobToBase64(compressed);

            // 3. Enviar al Apps Script
            await uploadToScript({
                fileName: item.file.name,
                mimeType: 'image/jpeg',
                base64:   base64
            });

            if (thumb) {
                thumb.classList.remove('preview-item--uploading');
                thumb.classList.add('preview-item--done');
            }
            uploaded++;

        } catch (err) {
            console.error('Error subiendo foto', i, err);
            if (thumb) {
                thumb.classList.remove('preview-item--uploading');
                thumb.classList.add('preview-item--error');
            }
            failed++;
        }

        // Actualizar barra de progreso
        showProgress(i + 1, total);
    }

    setUploading(false);

    // Mostrar resultado
    if (uploaded > 0) {
        showSuccess(uploaded, failed);
    } else {
        showError('No se pudo subir ninguna foto. Verifica tu conexión e inténtalo de nuevo.');
    }
}

/**
 * Hace el fetch POST al Google Apps Script
 */
async function uploadToScript(payload) {
    const response = await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        // Google Apps Script no acepta 'application/json' con CORS,
        // se envía como text/plain y se parsea manualmente en el servidor
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Error desconocido del servidor');
    }

    return result;
}

// ── Estados de la UI ─────────────────────────────────────────────────────────

function setUploading(isUploading) {
    uploadBtn.disabled        = isUploading;
    uploadZone.style.pointerEvents = isUploading ? 'none' : '';
    uploadZone.style.opacity       = isUploading ? '0.5' : '';

    if (isUploading) {
        uploadBtn.classList.add('upload-btn--loading');
        uploadBtnText.textContent = 'Subiendo fotos...';
    } else {
        uploadBtn.classList.remove('upload-btn--loading');
    }
}

function showProgress(current, total) {
    progressContainer.classList.add('progress-container--visible');
    const pct = Math.round((current / total) * 100);
    progressBarFill.style.width = pct + '%';
    progressPercent.textContent = pct + '%';
}

function updateProgressText(current, total) {
    progressText.textContent = `Subiendo foto ${current} de ${total}...`;
}

function showSuccess(uploaded, failed) {
    progressContainer.classList.remove('progress-container--visible');
    uploadZone.style.display    = 'none';
    uploadCount.style.display   = 'none';
    previewGrid.style.display   = 'none';
    uploadBtn.style.display     = 'none';

    if (failed > 0) {
        successText.innerHTML = `
            <strong>${uploaded}</strong> foto${uploaded > 1 ? 's' : ''} guardada${uploaded > 1 ? 's' : ''} con éxito.<br>
            ${failed} foto${failed > 1 ? 's no pudieron' : ' no pudo'} subirse. Puedes intentar de nuevo.<br>
            ¡Gracias por compartir este momento especial!
        `;
    } else {
        successText.innerHTML = `
            ${uploaded > 1
                ? `Tus <strong>${uploaded} fotos</strong> han sido guardadas.`
                : 'Tu foto ha sido guardada.'
            }<br>¡Gracias por compartir este momento especial! 💍
        `;
    }

    successState.classList.add('success-state--visible');
}

function resetUI() {
    // Limpiar URLs de objeto en memoria
    selectedFiles.forEach(item => URL.revokeObjectURL(item.objectURL));
    selectedFiles = [];

    // Restablecer DOM
    previewGrid.innerHTML = '';
    uploadCount.textContent = '';
    progressBarFill.style.width = '0%';

    uploadZone.style.display  = '';
    uploadCount.style.display = '';
    previewGrid.style.display = '';
    uploadBtn.style.display   = '';

    progressContainer.classList.remove('progress-container--visible');
    successState.classList.remove('success-state--visible');
    hideError();
    updateUploadButton();
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('error-msg--visible');
}

function hideError() {
    errorMsg.textContent = '';
    errorMsg.classList.remove('error-msg--visible');
}
