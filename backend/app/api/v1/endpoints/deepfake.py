from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from loguru import logger
from app.api.v1.deps import get_current_active_user
from app.services.scanners.deepfake_scanner import DeepfakeScanner

router = APIRouter(prefix="/threats/deepfake", tags=["deepfake"])

@router.post("/scan")
async def scan_deepfake(
    file: UploadFile = File(...),
    user=Depends(get_current_active_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")
    
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")

        verdict, confidence, meta = DeepfakeScanner.analyze_image(content)

        return {
            "verdict": verdict,
            "confidence_score": confidence,
            "meta": meta
        }
    except Exception as e:
        logger.error(f"Deepfake API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process image for deepfake detection")
