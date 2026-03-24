# 📄 PDF Master Tool | CesarJam®

## Una herramienta poderosa y moderna diseñada para la gestión masiva de documentos PDF, optimizando flujos de trabajo administrativos mediante OCR y extracción de metadatos. Esta aplicación es una evolución técnica desarrollada, pasando de un stack tradicional de Bootstrap a una arquitectura reactiva y modular.

🚀 Tecnologías Utilizadas
Este proyecto utiliza un stack de vanguardia para garantizar velocidad y eficiencia:

* Frontend: Vue 3 (Composition API).
* Bundler: Vite para un desarrollo ultrarrápido.
* Estilos: Tailwind CSS para un diseño responsivo y moderno.
* Iconografía: Heroicons & Lucide Vue.

Procesamiento:

Tesseract.js: Para el reconocimiento óptico de caracteres (OCR).
PDF.js: Para el renderizado y manipulación de documentos.

## 🛠️ Módulos Principales
### 1. Renombrador Masivo (OCR)
Permite cargar múltiples archivos PDF, escanear áreas específicas (como números de oficio o asuntos) y renombrarlos automáticamente basándose en el texto extraído.
Previsualización en tiempo real: Visor integrado para verificar el contenido antes de procesar.
Edición manual: Ajusta los nombres sugeridos antes de guardar.
Guardado Local: Utiliza la API de sistema de archivos para guardar directamente en tu equipo.

### 2. Extractor para Excel
Diseñado para generar inventarios documentales rápidamente.
Conteo de páginas: Calcula automáticamente la extensión de cada archivo.
Metadatos Automatizados: Configuración de rutas de almacenamiento y periodos trimestrales.
Copiado Inteligente: Formato optimizado para pegar directamente en celdas de Excel.

💻 Instalación y Desarrollo
Si deseas ejecutar este proyecto localmente:

Clonar el repositorio:

```
git clone https://github.com/tu-usuario/reconocimiendoArchivosOCR.git
```

Instalar dependencias:

```
npm install
```

Iniciar modo desarrollo:

```
npm run dev
```

Compilar para producción:

```
npm run build
```
🌙 Características Adicionales
* Modo Oscuro Nativo: Interfaz adaptativa para reducir la fatiga visual.
* Arquitectura Modular: Lógica de negocio separada en utilerías (ocrLogic.js) y componentes reutilizables.
* Diseño CesarJam®: Estética limpia y profesional con enfoque en la experiencia de usuario.
