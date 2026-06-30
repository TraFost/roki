import io
import os
import wave
import logging
from pathlib import Path
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tts-server")

VOICES_DIR = Path(__file__).parent / "voices"
VOICE_NAME = os.environ.get("ROKI_TTS_VOICE", "en_US-ryan-medium")
VOICE_CACHE = Path(os.path.expanduser(f"~/.cache/piper-voices/{VOICE_NAME}"))

model = None
sample_rate = 22050

app = FastAPI()


class TTSRequest(BaseModel):
    text: str


@app.on_event("startup")
async def startup():
    global model, sample_rate
    onnx_path = VOICE_CACHE.with_suffix(".onnx")
    json_path = VOICE_CACHE.with_suffix(".onnx.json")

    if not onnx_path.exists():
        raise RuntimeError(
            f"Piper voice model not found at {onnx_path}. "
            f"Download it from https://huggingface.co/rhasspy/piper-voices"
        )

    logger.info(f"Loading Piper voice: {VOICE_NAME}...")
    from piper import PiperVoice
    model = PiperVoice.load(str(onnx_path), config_path=str(json_path) if json_path.exists() else None)
    sample_rate = model.config.sample_rate
    logger.info(f"Voice loaded ({sample_rate} Hz)")


@app.get("/health")
async def health():
    return {
        "status": "ok" if model else "loading",
        "voice": VOICE_NAME,
        "sample_rate": sample_rate,
    }


@app.post("/tts")
async def tts(req: TTSRequest):
    if model is None:
        raise HTTPException(503, "Model not loaded yet")

    logger.info(f"Generating TTS: text='{req.text[:50]}...'")

    try:
        chunks = list(model.synthesize(req.text))
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(500, f"TTS generation failed: {e}")

    audio = np.concatenate([chunk.audio_int16_array for chunk in chunks])

    buf = io.BytesIO()
    with wave.open(buf, "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(audio.tobytes())
    buf.seek(0)

    return StreamingResponse(buf, media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
