from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pipeline import extract_variables_from_tiff

app = FastAPI(
    title="Chatgepecitos Planetary Analog API",
    description="Backend service for multispectral TIFF extraction and planetary analog matching (Earth vs Moon / Mars)",
    version="1.0.0"
)

# Enable CORS for local Vite React frontend (localhost:3000 / 3001 / 5173)
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
        "service": "Chatgepecitos Planetary Analog Engine",
        "team": "chatgepecitos",
        "version": "1.0.0"
    }

@app.post("/api/process")
def process_tiff(req: ProcessRequest):
    target = req.config.get("targetBody", "Mars") if req.config else "Mars"
    algo = req.config.get("algorithm", "Multispectral Band Ratio + Mineral Match") if req.config else "Multispectral Band Ratio + Mineral Match"
    thresh = float(req.config.get("threshold", 2.2)) if req.config else 2.2
    
    result = extract_variables_from_tiff(
        filepath=req.filename,
        target_body=target,
        algorithm=algo,
        threshold=thresh
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
