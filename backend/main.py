from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pipeline import extract_variables_from_tiff

app = FastAPI(
    title="Chatgepecitos TIFF Analytics API",
    description="Backend para extracción y análisis de variables en archivos TIFF pesados",
    version="1.0.0"
)

# Permitir conexión desde Vite React (localhost:3000 o localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessRequest(BaseModel):
    filename: str
    config: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Chatgepecitos Python TIFF Engine",
        "version": "1.0.0"
    }

@app.post("/api/process")
def process_tiff(req: ProcessRequest):
    algo = req.config.get("algorithm", "GLCM + Segmentación Adaptativa") if req.config else "GLCM + Segmentación Adaptativa"
    thresh = float(req.config.get("threshold", 2.2)) if req.config else 2.2
    
    result = extract_variables_from_tiff(
        filepath=req.filename,
        algorithm=algo,
        threshold=thresh
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

