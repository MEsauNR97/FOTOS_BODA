# 📸 QR Fotos de Boda

Sistema completo para que los invitados suban fotos escaneando un código QR.  
Las fotos van directo a tu Google Drive — sin login, sin apps, sin costo.

---

## ¿Cómo funciona?

```
Invitado escanea QR
  → Abre la página web (upload.html en GitHub Pages)
    → Selecciona/toma fotos en su celular
      → Las fotos se envían a Google Apps Script
        → Apps Script las guarda en tu Google Drive ✅
```

---

## 📋 Guía de configuración completa

Sigue estos pasos **en orden**. No saltes ninguno.

---

### Paso 1 — Configurar Google Apps Script (el backend)

> Lee las instrucciones detalladas en **[apps-script/README.md](apps-script/README.md)**

Resumen:
1. Crea una carpeta en Google Drive para las fotos
2. Copia el ID de esa carpeta (de la URL)
3. Ve a [script.google.com](https://script.google.com) → Nuevo proyecto
4. Pega el código de `apps-script/Code.gs`
5. Reemplaza `REEMPLAZA_CON_TU_FOLDER_ID` con el ID de tu carpeta
6. Despliega como **Web App pública** (Ejecutar como: Yo · Acceso: Cualquier persona)
7. Copia la URL del deploy (empieza con `https://script.google.com/macros/s/...`)

---

### Paso 2 — Configurar la URL en el frontend

Abre `upload.js` y reemplaza la primera línea:

```javascript
// Antes:
const APPS_SCRIPT_URL = 'REEMPLAZA_CON_TU_URL_DE_APPS_SCRIPT';

// Después (con tu URL real):
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw.../exec';
```

---

### Paso 3 — Publicar en GitHub Pages

1. Crea una cuenta en [github.com](https://github.com) si no tienes una (es gratis)
2. Crea un repositorio nuevo — puede ser **público** o **privado**
3. Sube todos estos archivos al repositorio:
   ```
   Styles.css
   upload.html
   upload.js
   qr.html
   apps-script/
   README.md
   ```
4. Ve a **Settings** → **Pages** (en el menú izquierdo)
5. En **Source**, selecciona: `Deploy from a branch`
6. En **Branch**, selecciona: `main` · `/root`
7. Haz clic en **Save**
8. Espera 1-2 minutos y recarga la página
9. GitHub te mostrará tu URL, que se ve así:
   ```
   https://tu-usuario.github.io/nombre-del-repo/
   ```
10. Tu página de subida estará en:
    ```
    https://tu-usuario.github.io/nombre-del-repo/upload.html
    ```

---

### Paso 4 — Generar el código QR

1. Abre **`qr.html`** en tu navegador (puedes abrirlo como archivo local o desde GitHub Pages)
2. Pega la URL de `upload.html` en el campo correspondiente
3. Escribe los nombres de los novios y la fecha de la boda
4. Haz clic en **Generar Código QR**
5. Descarga el QR como PNG o imprime directamente desde el navegador
6. ¡Coloca el QR en las mesas, en la entrada, o en el photobooth!

---

## 📁 Estructura del proyecto

```
├── Styles.css              ← CSS principal (design system de la boda)
├── upload.html             ← Página que ven los invitados al escanear el QR
├── upload.js               ← Lógica de selección, compresión y subida
├── qr.html                 ← Generador del código QR (solo para el organizador)
├── apps-script/
│   ├── Code.gs             ← Código del backend (se pega en Google Apps Script)
│   └── README.md           ← Instrucciones detalladas del backend
└── README.md               ← Este archivo
```

---

## ⚙️ Configuración técnica

| Parámetro | Valor por defecto | Dónde cambiarlo |
|---|---|---|
| URL de Apps Script | *(requerida)* | `upload.js` línea 8 |
| Máximo de fotos por sesión | 10 | `upload.js` línea 12 |
| Tamaño máximo por foto | 15 MB | `upload.js` línea 13 |
| Resolución máxima tras comprimir | 1920px | `upload.js` línea 14 |
| Calidad JPEG | 82% | `upload.js` línea 15 |

---

## ❓ Preguntas frecuentes

**¿Los invitados necesitan cuenta de Google?**  
No. Simplemente escanean el QR y suben sus fotos.

**¿Los invitados pueden ver las fotos de otros?**  
No. Solo tienen permiso de enviar. Nadie accede a tu Drive.

**¿Funciona desde iPhone y Android?**  
Sí. La página usa el input nativo del teléfono, que abre la galería o la cámara según el sistema operativo.

**¿Cuántas fotos pueden subir en total?**  
La cuota gratuita de Google Apps Script permite ~20,000 solicitudes por día — más que suficiente para cualquier boda.

**¿Qué pasa si un invitado sube la misma foto dos veces?**  
Cada foto se guarda con un timestamp único al inicio del nombre, así que nunca se sobreescriben.

**¿Hay un límite de tamaño por foto?**  
Sí, 15 MB por archivo, pero las fotos se comprimen automáticamente a ~500KB-1MB antes de subirse, así que el proceso es rápido incluso con conexión lenta.

---

## 💍 Con amor para Manuel & Esaú
