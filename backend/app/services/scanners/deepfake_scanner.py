import io
import time
from typing import Tuple, Dict, Any
from loguru import logger

class DeepfakeScanner:
    _pipeline = None

    @classmethod
    def _load_model(cls):
        if cls._pipeline is None:
            logger.info("Loading DeepFake detection model (dima806/deepfake_vs_real_image_detection)...")
            try:
                from transformers import pipeline
                # Using a well-known ViT fine-tuned for deepfake detection
                cls._pipeline = pipeline("image-classification", model="dima806/deepfake_vs_real_image_detection")
                logger.info("DeepFake model loaded successfully.")
            except ImportError as e:
                logger.error(f"Failed to import ML libraries: {e}")
                raise RuntimeError("Machine learning libraries (torch, transformers) are not installed.")

    @classmethod
    def analyze_image(cls, image_bytes: bytes) -> Tuple[str, float, Dict[str, Any]]:
        """
        Analyzes an image to detect if it's a deepfake.
        Returns: (verdict: "REAL" | "FAKE", confidence: float, meta: dict)
        """
        try:
            from PIL import Image
            cls._load_model()

            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            start_time = time.time()
            results = cls._pipeline(image)
            duration_ms = int((time.time() - start_time) * 1000)

            # Results is typically a list of dicts: [{'label': 'real', 'score': 0.99}, {'label': 'fake', 'score': 0.01}]
            # dima806 model outputs 'real' and 'fake'
            top_result = results[0]
            label = top_result['label'].upper()
            confidence = top_result['score'] * 100

            verdict = "REAL" if label == "REAL" else "FAKE"
            
            meta = {
                "duration_ms": duration_ms,
                "model": "dima806/deepfake_vs_real_image_detection",
                "raw_results": results
            }
            
            return verdict, confidence, meta

        except Exception as e:
            logger.error(f"DeepFake scanning error: {e}")
            raise e
