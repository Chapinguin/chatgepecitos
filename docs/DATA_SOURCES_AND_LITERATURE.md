# 📚 Scientific Data Sources, NASA Literature & Ground-Truth Benchmarks

This document details the scientific datasets, mission telemetry, mathematical models, and peer-reviewed literature used in the **Planetary Analog Explorer** for the NASA Space Apps Challenge (*"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"*).

---

## 1. Remote Sensing Datasets & Planetary Imagery

All satellite, orbital, and aerial datasets utilized in this platform originate from open-access scientific archives and space agency missions:

### 🌕 Moon (Permanent Lunar Base Proxies)
* **Mission:** NASA Lunar Reconnaissance Orbiter (LRO)
* **Instrument:** Lunar Reconnaissance Orbiter Camera (LROC) Narrow Angle Camera (NAC)
* **Data Products:**
  * Shaded Relief & Digital Terrain Models (DTMs) at 1.5 m/px resolution (`LRO_NAC_Shade_00N234E_150cmp`, `LRO_NAC_Shade_19S070E_150cmp`).
  * Lunar South Pole illumination maps and Shackleton / Faustini crater rim topography proxies.
* **Archival Source:** NASA Planetary Data System (PDS) Geosciences Node / Arizona State University (ASU) LROC Science Operations Center ([lroc.sese.asu.edu](https://lroc.sese.asu.edu)).
* **License:** Public Domain (U.S. Government work under 17 U.S.C. § 105).

### 🔴 Mars (Jezero & Gale Crater Basemaps)
* **Mission:** NASA Mars Reconnaissance Orbiter (MRO)
* **Instruments:**
  * **Context Camera (CTX):** Global mosaic at 6 m/pixel (`Jezero_CTX_Mosaic_6m`).
  * **High Resolution Imaging Science Experiment (HiRISE):** Sub-meter orthorectified imagery (0.25–0.5 m/pixel) capturing layered delta scarps, yardangs, and inverted fluvial channels.
* **Archival Source:** NASA PDS Cartography and Imaging Sciences Node / USGS Astrogeology Science Center / University of Arizona HiRISE team ([hirise.lpl.arizona.edu](https://hirise.lpl.arizona.edu)).
* **License:** Public Domain (17 U.S.C. § 105).

### 🌍 Earth (Terrestrial Analog Orthophotography)
* **Agency:** United States Geological Survey (USGS) & National Agriculture Imagery Program (NAIP)
* **Instrument:** Airborne High-Resolution Digital Sensor Systems (0.5 m/pixel ground sample distance).
* **Sampled Analog Locations (5,175 evaluated orthophoto tiles across New Mexico):**
  * **Valles / Jemez Caldera Complex (`GLORTHO_NM_Jimez2`):** Volcanic tuff, ignimbrite sheets, rhyolitic domes, and hydrothermal silica deposits. High-fidelity proxy for lunar highland mass wasting and Martian volcanic / hydrothermal alteration.
  * **Blue Water Escarpment (`GLORTHO_NM_Blue_Water`):** Arid sandstone cuestas, wind-sculpted yardangs, and scree aprons. Morphological analog to Jezero crater floor, delta scarps, and basaltic plateau fracturing.
  * **Manzanos Outflow Apron (`GLORTHO_NM_Manzanos`):** Coarse-grained alluvial fans and dry braided ephemeral channels mimicking ancient Martian fluvial networks (Ares Vallis, Jezero delta distributaries).
* **Archival Source:** USGS EarthExplorer ([earthexplorer.usgs.gov](https://earthexplorer.usgs.gov)).
* **License:** Public Domain.

---

## 2. In-Situ Ground-Truth Benchmarks (External Controls)

To ensure scientific integrity and comply with the NASA challenge criteria (demonstrating explicitly *"where the analogy breaks down"*), the dashboard integrates ground-truth benchmarks from surface missions:

| Target Body | Mission / Instrument | Dataset / Benchmark | Key Ground-Truth Metrics | Platform Role |
| :--- | :--- | :--- | :--- | :--- |
| **Moon** | **Apollo 16** (Descartes Highlands, Stations 4 & 8) | Regolith Core Samples 64001/64002 | Agglutinates (42%), Anorthosite (85%), bulk density 1.52–1.90 g/cm³, median grain size $70\,\mu\text{m}$ | External Ground-Truth Control (`[EXTERNAL KEY]` badge) |
| **Mars** | **MSL Curiosity** (Gale Crater / Yellowknife Bay) | REMS (Rover Environmental Monitoring Station) & APXS | Atmospheric surface pressure $7.5-8.5\,\text{hPa}$, daily $\Delta T \approx 85\,\text{K}$, basaltic silt | External Ground-Truth Control (`[EXTERNAL KEY]` badge) |
| **Mars** | **Mars 2020 Perseverance** (Jezero Crater) | SuperCam, PIXL, RIMFAX | Smectite clays, carbonate-bearing delta sediments, olivine-rich crater floor units | Target comparative reference |

---

## 3. Mathematical & Algorithmic Formulation

### Multi-Scale Feature Extraction
For each $128 \times 128$ pixel raster tile ($5,175$ tiles generated across Earth scenes and planetary basemaps), the pipeline calculates a 6-dimensional spatial-texture feature vector:
1. **Luminance ($\mu_L$):** Mean normalized surface albedo / reflectance.
2. **Local Standard Deviation ($\sigma_3, \sigma_7, \sigma_{15}$):** Multi-scale spatial variance capturing surface roughness and micro-relief at $3\times3$, $7\times7$, and $15\times15$ pixel windows.
3. **Gradient Magnitude ($G_{\text{mag}}$):** Sobel edge intensity detecting linear faults, fracture scarps, and crater rims.
4. **Directional Coherence ($C_{\text{dir}}$):** Eigenvalue ratio of the local structural tensor measuring wind-streak and flow orientation.

### Multivariate Bhattacharyya Matching
Each region is modeled as a multivariate Gaussian distribution $\mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Sigma})$. The statistical divergence between Earth candidate $p$ and Target planetary reference $q$ is computed via the **Bhattacharyya Distance** ($D_B$):

$$D_B(p, q) = \frac{1}{8} (\boldsymbol{\mu}_p - \boldsymbol{\mu}_q)^T \boldsymbol{\Sigma}^{-1} (\boldsymbol{\mu}_p - \boldsymbol{\mu}_q) + \frac{1}{2} \ln \left( \frac{\det \boldsymbol{\Sigma}}{\sqrt{\det \boldsymbol{\Sigma}_p \det \boldsymbol{\Sigma}_q}} \right)$$

where $\boldsymbol{\Sigma} = \frac{\boldsymbol{\Sigma}_p + \boldsymbol{\Sigma}_q}{2}$.

The final **Bhattacharyya Similarity Coefficient ($BC$)** is normalized to a percentage:
$$\text{Score} = BC(p, q) \times 100 = \exp\left( -D_B(p, q) \right) \times 100$$

---

## 4. Key Scientific Literature & Peer-Reviewed References

1. **Léveillé, R. (2010).** *A validation strategy for terrestrial analogues in planetary exploration.* Planetary and Space Science, 58(4), 631–638.  
   DOI: [10.1016/j.pss.2009.11.001](https://doi.org/10.1016/j.pss.2009.11.001)
2. **NASA Technical Report (2011).** *Terrestrial Analogs for Lunar and Martian Surface Exploration.* NASA/SP-2011-3419. NASA Johnson Space Center & NASA Headquarters.  
   NASA Technical Reports Server (NTRS).
3. **Heiken, G., Vaniman, D., & French, B. M. (1991).** *Lunar Sourcebook: A User's Guide to the Moon.* Cambridge University Press, New York. (Apollo lunar soils and regolith mechanics).
4. **Grotzinger, J. P., et al. (2014).** *A Habitable Fluvio-Lacustrine Environment at Yellowknife Bay, Gale Crater, Mars.* Science, 343(6169), 1242777.  
   DOI: [10.1126/science.1242777](https://doi.org/10.1126/science.1242777)
5. **Bhattacharyya, A. (1943).** *On a measure of divergence between two statistical populations defined by their probability distributions.* Bulletin of the Calcutta Mathematical Society, 35, 99–109.
6. **Farr, T. G. (2004).** *Terrestrial analogues—guidelines for research.* Planetary and Space Science, 52(1–3), 3–10.  
   DOI: [10.1016/j.pss.2003.08.013](https://doi.org/10.1016/j.pss.2003.08.013)
7. **Robinson, M. S., et al. (2010).** *Lunar Reconnaissance Orbiter Camera (LROC) Instrument Overview.* Space Science Reviews, 150(1–4), 81–124.  
   DOI: [10.1007/s11214-010-9634-2](https://doi.org/10.1007/s11214-010-9634-2)
8. **Malin, M. C., et al. (2007).** *Context Camera Investigation on board the Mars Reconnaissance Orbiter.* Journal of Geophysical Research: Planets, 112(E5).  
   DOI: [10.1029/2006JE002808](https://doi.org/10.1029/2006JE002808)

---

## 5. Third-Party Mapping & Basemap Providers

* **OpenPlanetaryMap (OPM):** Open-source cartographic tile services for Mars (`opm-mars-basemap-v0-2`) and the Moon (`opm-moon-basemap-v0-1`) licensed under CC-BY / OpenStreetMap contributors.
* **Google Maps & Google Maps Space 3D:** Interactive browser embed & direct 3D celestial celestial navigation (`google.com/maps/space/mars` and `google.com/maps/space/moon`).
