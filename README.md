# 🔬 Chatgepecitos — TIFF Analytics Engine

Plataforma rápida para el análisis, extracción y visualización interactiva de variables a partir de archivos TIFF pesados y de alta dimensionalidad (multicanal, hiperespectrales y Z-stacks).

> **Hackathon 36h Edition** 🚀 — Diseñado con desacoplamiento total: la interfaz React no descarga ni renderiza los archivos TIFF de gigabytes en el navegador; únicamente recibe y visualiza las variables numéricas, estadísticas y morfológicas calculadas por el pipeline de Python.

---

## 📁 Estructura del Repositorio

```
chatgepecitos/
├── frontend/               # Aplicación React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/     # Cards de métricas, gráficos Recharts, tablas y Chat Copilot
│   │   ├── services/       # Cliente API con Fallback / Modo Simulación integrado
│   │   ├── data/           # Datasets de prueba para demo en vivo
│   │   └── types/          # Tipado estricto de variables y resultados
│   └── package.json
│
├── backend/                # Servidor FastAPI + Pipeline de extracción matemática
│   ├── pipeline.py         # Módulo central de procesamiento (reutilizable en notebooks)
│   ├── main.py             # Endpoints /api/health y /api/process
│   ├── notebooks/          # Espacio para los Jupyter Notebooks (.ipynb) del equipo
│   └── requirements.txt    # Dependencias de Python
│
├── .gitignore              # Configurado para ignorar TIFFs gigantes y checkpoints
└── README.md
```

---

## ⚡ Inicio Rápido (En menos de 2 minutos)

### 1. Levantar el Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
La aplicación abrirá en `http://localhost:3000`.

*Nota:* Si el backend no está activo aún, la app funciona al 100% en **Modo Simulación (Demo)** para que puedan ensayar la presentación y el pitch sin depender de que los modelos terminen de compilar.

### 2. Levantar el Backend (FastAPI - Opcional para demo en vivo)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
El servidor API estará disponible en `http://localhost:8000` con documentación Swagger en `/docs`.

---

## 🧠 Características Principales

1. **Dashboard de Variables en Tiempo Real:** Visualización de métricas clave (densidad, intensidad espectral, varianza GLCM, entropía espacial, SNR).
2. **Gráficos Interactivos de Capas e Histograma:** Perfiles por canal/Z-stack y distribución de bines dinámicos con `recharts`.
3. **Tabla Completa y Exportador CSV:** Filtros por categoría y descarga en 1 clic de todas las variables analizadas.
4. **Chatgepecitos AI Copilot:** Asistente contextual capaz de responder preguntas y razonar sobre las anomalías de las variables extraídas.
5. **Modo Seguro contra Caídas de Red:** Toggle de Simulación / API Real para garantizar que la presentación del hackathon sea a prueba de fallos.
