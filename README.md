# 🪐 Planetary Analog Explorer

> **Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"*  
> **Team:** **chatgepecitos** 🚀  
> **NASA Space Apps Challenge**  
> **Live Demo:** [https://chatgepecitos.vercel.app/](https://chatgepecitos.vercel.app/) ([QR Code](docs/qr_vercel.png))  
> **Project Report:** [NASA_Space_Apps_2026_Project_Report.pdf](docs/NASA_Space_Apps_2026_Project_Report.pdf)

An interactive geospatial and multispectral intelligence platform designed to identify, cross-match, and visualize terrestrial analog field locations on Earth that mirror environmental, mineralogical, and geomechanical conditions of **Permanent Lunar Base locations** (e.g., Shackleton Crater, Marius Hills lava tubes) and **Martian exploration sites** (e.g., Jezero and Gale Craters).

---

## Team `chatgepecitos`

- **Daniela Tovar** — Facultad de Ciencias Físico Matemáticas, UAdeC
- **Joshua Olivo** — Facultad de Ciencias Físico Matemáticas, UAdeC
- **Roberto Chavez** — Facultad de Ciencias Físico Matemáticas, UAdeC
- **Sebastian Chapa** — Facultad de Sistemas, UAdeC
- **Ximena Quirino** — Facultad de Sistemas, UAdeC

---

## ⚡ Key Architecture & Features

- **Multi-Scale Spatial & Texture Matching Engine:** Computes high-dimensional feature distributions (surface luminance, multi-scale local standard deviation, Sobel spatial gradient magnitude, and directional structure coherence) over 5,175 GeoTIFF orthophoto tiles ($128\times128$ px) across New Mexico volcanic and sedimentary fields (Jemez Caldera, Blue Water, Manzanos).
- **Multivariate Bhattacharyya Distance:** Robust statistical distance evaluation between multivariate Gaussian distributions (mean vector and covariance matrix) comparing Earth candidates against Mars (CTX/HiRISE) and Moon (LRO NAC) target basemaps.
- **Dual Planetary Switch (`Earth with Mars` vs `Earth with Moon`):** Instant recalibration between Martian surface conditions and Permanent Lunar Base exploration sites with responsive synchronization across KPIs, charts, and candidate sites.
- **High-Density Interactive Datagrid:** Inspects Earth candidates, 3D satellite topography embeds, Google Maps satellite mode links, and extracted geochemical/geomorphological variables.
- **Chatgepecitos AI Copilot:** Interactive reasoning assistant capable of answering contextual questions about analog matches, regolith proxies, and permanent habitat feasibility.
- **Decoupled Data Pipeline:** Heavy raster computations are pre-processed and exported into high-performance GeoJSON and structured CSV feeds (`public/data/`), enabling instant loading and responsive presentation on mobile and desktop.

---

## 📁 Repository Structure

```
chatgepecitos/
├── frontend/                     # React 19 + Vite + TypeScript + Tailwind CSS
│   ├── public/
│   │   ├── data/                 # Live planetary analog datasets & metadata
│   │   │   ├── earth_with_mars_variables.csv
│   │   │   ├── earth_with_moon_variables.csv
│   │   │   ├── earth_with_mars_layers.csv
│   │   │   ├── earth_with_moon_layers.csv
│   │   │   ├── earth_with_mars_histogram.csv
│   │   │   ├── earth_with_moon_histogram.csv
│   │   │   └── planetary_analog_sites.csv
│   │   └── images/patches/       # Real cropped Earth & target satellite imagery
│   ├── src/
│   │   ├── components/           # PlanetarySwitch, MetricsCards, VariableCharts, VariablesTable, Copilot
│   │   ├── services/             # CSV Loader (PapaParse) & backend client
│   │   └── types/                # TypeScript interfaces for planetary analog metrics
│   └── package.json
│
├── backend/                      # Python Multispectral & Geospatial Processing
│   ├── analog_matcher.py         # Multi-scale feature extraction & Bhattacharyya matching engine
│   ├── pipeline.py               # Modular GeoTIFF memory-mapping & proxy extractor
│   ├── main.py                   # FastAPI service (/api/health, /api/process)
│   ├── geo_samples/              # Sample GeoTIFF inspection and test scripts
│   ├── notebooks/                # Jupyter Notebooks workspace
│   └── requirements.txt          # Python dependencies (rasterio, scikit-image, scipy, fastapi)
│
├── out/                          # Pipeline export artifacts (analogues.geojson, top5.json, crops)
├── outputs/                      # Notebook export staging directory
├── .gitignore                    # Prevents tracking heavy TIFFs and local temp files
└── README.md
```

---

## 🎯 Hackathon Challenge Milestones & Issues Resolved

This repository resolves all functional, scientific, and architectural deliverables defined in the project scope:

| Issue | Milestone | Delivered Solution |
| :---: | :--- | :--- |
| **[#2](https://github.com/Chapinguin/chatgepecitos/issues/2)** | **Integración y estabilidad** | Clean decoupled architecture (`frontend/`, `backend/`, `out/`). Zero lint warnings, zero build errors, and verified automated CI/CD pipeline. |
| **[#3](https://github.com/Chapinguin/chatgepecitos/issues/3)** | **Interfaz web y visualización geográfica** | React 19 + Tailwind CSS responsive UI (mobile sidescroll + laptop full-width). Dual Planetary Switch, Lightbox modal with interactive 3D satellite topography embeds (Google Maps & OpenPlanetaryMap). |
| **[#4](https://github.com/Chapinguin/chatgepecitos/issues/4)** | **Desarrollo de API REST y motores científicos** | FastAPI service (`backend/main.py`) with memory-mapped GeoTIFF processing (`backend/pipeline.py`) capable of handling multi-gigabyte rasters without RAM exhaustion. |
| **[#5](https://github.com/Chapinguin/chatgepecitos/issues/5)** | **Análisis de similitud espectral (SAM & Basemap matching)** | Multi-spectral layer decomposition, band ratios, and radar charts evaluating albedo, local variance, and directional texture against Mars CTX/HiRISE and Moon LRO NAC basemaps. |
| **[#6](https://github.com/Chapinguin/chatgepecitos/issues/6)** | **Motor de similitud ambiental y ranking** | Multi-scale feature extraction (`lum`, `std_3/7/15`, `grad_mag`, `coherence`) and Gaussian Bhattacharyya distance ($BC$) ranking 5,175 evaluated orthophoto tiles into validated Top 5 analog sites for Moon & Mars. |
| **[#7](https://github.com/Chapinguin/chatgepecitos/issues/7)** | **Procesamiento, validación y gestión de datos científicos** | Full scientific verification: clear differentiation between raster-calculated parameters and external NASA ground-truth benchmarks (Curiosity REMS, Apollo 16 core samples) highlighted with explicit badges in datagrid. |

---

## 🚀 Quick Start

### 1. Run the Frontend (React Dashboard)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (or `http://localhost:3001`) in your browser.

### 2. Run the Geospatial Matching Engine (Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate         # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python analog_matcher.py --help
```

### 3. Run the FastAPI Backend (Optional)
```bash
cd backend
python main.py
```
API runs on `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

---

## 📚 Scientific Literature, Data Sources & Ground-Truth Benchmarks

This project cross-matches terrestrial remote sensing data with planetary orbital imagery and verified surface mission telemetry. Complete technical citations, mathematical formulations, and PDS archive links are documented in **[docs/DATA_SOURCES_AND_LITERATURE.md](docs/DATA_SOURCES_AND_LITERATURE.md)**:

- **Moon (LROC NAC):** NASA Lunar Reconnaissance Orbiter shaded relief & DEMs (1.5 m/px) from ASU / NASA GSFC ([Robinson et al., 2010](https://doi.org/10.1007/s11214-010-9634-2)).
- **Mars (CTX & HiRISE):** NASA Mars Reconnaissance Orbiter Context Camera (6 m/px) and HiRISE high-resolution imagery ([Malin et al., 2007](https://doi.org/10.1029/2006JE002808)).
- **Earth (USGS NAIP):** High-resolution digital orthophotography (0.5 m/px) across Jemez Caldera, Blue Water Escarpment, and Manzanos Outflows.
- **In-Situ Ground Truth Controls:** Apollo 16 core samples (Stations 4 & 8) and Curiosity REMS/APXS telemetry (Yellowknife Bay, [Grotzinger et al., 2014](https://doi.org/10.1126/science.1242777)) flagged with `[EXTERNAL KEY]` badges in the UI.
- **Statistical Divergence:** Multivariate Gaussian Bhattacharyya distance ($BC = \exp(-D_B)$) evaluating 5,175 raster tiles ([Bhattacharyya, 1943](https://doi.org/10.1007/s11214-010-9634-2); [Léveillé, 2010](https://doi.org/10.1016/j.pss.2009.11.001)).
- **Public Domain Notice:** All NASA and USGS media and mission telemetry are in the Public Domain pursuant to Title 17, U.S. Code § 105.

