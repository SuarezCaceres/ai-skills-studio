# 🧠 Códice Studio · Ecosistema Neuronal IA

> Entorno interactivo y suite de ingeniería para inspección de paquetes `.rar` en memoria, benchmarking de modelos de IA (Claude Opus 5.5, Gemini 3.8, GPT Astra), catálogo UI/UX y sincronización bidireccional con Obsidian.

---

## 🚀 Características Principales

- **🎨 Interfaz Cyber Violet & Noche Obsidiana:** Diseño de alta gama optimizado para desarrollo prolongado, con red neuronal reactiva al cursor en Canvas 2D (60–120 FPS).
- **📦 Descompresión Binaria de Paquetes `.RAR` en Memoria:** Análisis de cabeceras binarias y árboles de código sin dependencias nativas de servidor.
- **💎 Integración con Bóveda de Obsidian:** Registro automático y sincronización bidireccional de notas `.md` mediante protocolo `obsidian://open`.
- **⚡ Telemetría y Benchmarking IA:** Comparativa de rendimiento real (velocidad en tok/s, precisión TypeScript y checks de validación).
- **🛡️ Seguridad Reforzada:** Hashing criptográfico `PBKDF2` vía WebCrypto Subtle, sesiones con TTL de 12 horas, rate-limiting contra fuerza bruta y sanitización de rutas contra Path Traversal.

---

## 🛠️ Tecnologías

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Persistencia Local:** `localStorage` cifrado + Archivos Markdown en Obsidian.
- **CI/CD:** GitLab CI/CD (`.gitlab-ci.yml`) con compilación y despliegue automatizado en GitLab Pages / Vercel.

---

## 💻 Instalación y Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd ai-skills-studio

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 🌐 Despliegue en la Nube

Este proyecto cuenta con soporte listo para producción:
- **GitLab Pages:** Mediante el pipeline `.gitlab-ci.yml` configurado en la rama `main`.
- **Vercel / Cloudflare Pages:** Conectar el repositorio de GitLab; comando de build: `npm run build`, directorio de salida: `dist`.
