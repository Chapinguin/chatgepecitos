# 🪐 Planetary Analog Explorer

> **Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"*  
> **Team:** **chatgepecitos** 🚀  
> **NASA Space Apps Challenge / Hackathon 36h Edition**

An interactive geospatial and multispectral intelligence platform designed to identify, cross-match, and visualize terrestrial analog field locations on Earth that mirror environmental, mineralogical, and geomechanical conditions of **Permanent Lunar Base locations** (e.g., Shackleton Crater, Marius Hills lava tubes) and **Martian exploration sites** (e.g., Jezero and Gale Craters).

---

## ⚡ Key Architecture & Features

- **Decoupled Heavy Image Processing:** Heavy multispectral TIFF files (>1 GB) are processed in Python/Jupyter notebooks without saturating browser memory. Only calculated indices, spectral matches, and variables are synchronized into the React frontend.
- **Planetary Analog Switch (`Earth with Mars` vs `Earth with Moon`):** A high-impact toggle that re-calibrates all metrics, multispectral radar curves, candidate sites, and AI insights between Moon and Mars conditions.
- **Terrestrial Analog Sites Database:** Verified scientific locations (Atacama Desert, Rio Tinto Basin, Devon Island, Haleakala Volcanic Complex, Cinder Lake, Lanzarote lava tubes) mapped with overall match scores, mineralogy fidelity, and terrain roughness.
- **Chatgepecitos AI Copilot:** Interactive reasoning assistant capable of answering contextual questions about analog matches, regolith proxies, and permanent habitat feasibility.
- **Direct Repo CSV Synchronization:** The frontend dynamically reads `outputs/earth_with_mars_variables.csv` and `outputs/earth_with_moon_variables.csv`, allowing the data science team to update the live dashboard with a single `df.to_csv()` call from their notebooks.

---

## 📁 Repository Structure

```
chatgepecitos/
├── frontend/                   # React + Vite + TypeScript + Tailwind CSS
│   ├── public/data/            # Planetary analog CSV datasets
│   │   ├── earth_with_mars_variables.csv
│   │   ├── earth_with_moon_variables.csv
│   │   ├── earth_with_mars_layers.csv
│   │   ├── earth_with_moon_layers.csv
│   │   └── planetary_analog_sites.csv
│   ├── src/
│   │   ├── components/         # PlanetarySwitch, MetricsCards, Charts, Tables, Copilot
│   │   ├── services/           # CSV Loader (PapaParse) & API client
│   │   └── types/              # TypeScript schemas for planetary analog matching
│   └── package.json
│
├── backend/                    # Python API & Multispectral Pipeline
│   ├── pipeline.py             # Reusable TIFF & proxy extraction logic
│   ├── main.py                 # FastAPI service (/api/health, /api/process)
│   ├── notebooks/              # Jupyter Notebooks (.ipynb) workspace
│   └── requirements.txt
│
├── outputs/                    # Export directory for notebook CSV results
├── .gitignore                  # Prevents accidental commit of heavy TIFFs & checkpoints
└── README.md
```

---

## 🚀 Quick Start

### 1. Run the Frontend (React Dashboard)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (or `http://localhost:3001`) in your browser.

### 2. Run the Backend API (FastAPI - Optional)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
The API server runs on `http://localhost:8000` with interactive Swagger docs at `/docs`.

---

## 🔬 How the Backend Team Exports Data from Notebooks

In your Jupyter Notebook (`.ipynb`), append this cell at the end of your analysis:

```python
import pandas as pd

# Export your calculated analog match DataFrame:
target_body = "mars"  # or "moon"
df_analogs.to_csv(f"outputs/earth_with_{target_body}_variables.csv", index=False)
print("✅ CSV updated for Chatgepecitos Frontend")
```

Click **"Sync CSV"** in the frontend header to immediately render the updated variables across the entire dashboard!
