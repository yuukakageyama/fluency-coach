from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid
import time

app = FastAPI(title="Fluency Coach API")

# --- CORS（開発用。後で環境変数化してもOK） ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 保存ディレクトリ設計 ---
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
RESULT_DIR = DATA_DIR / "results"
PLOTS_DIR = DATA_DIR / "plots"

for d in [UPLOAD_DIR, RESULT_DIR, PLOTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# --- 許可する拡張子（最小） ---
ALLOWED_SUFFIX = {".webm", ".wav", ".mp3", ".m4a", ".ogg"}

# 既存の get_session をこれに差し替え
@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    candidates = list(UPLOAD_DIR.glob(f"{session_id}.*"))
    if not candidates:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_path = candidates[0]

    dummy = {
        "duration_sec": 5.0,
        "speech_rate_wpm": 120,
        "pause_ratio": 0.12,
        "volume_stability": 0.82,
        "pitch_variation": 0.35,
        "feedback": [
            "Good job! Try to reduce long pauses.",
            "Your pace is fine. Aim for smoother transitions between words.",
        ],
    }

    return {
        "session_id": session_id,
        "status": "done",
        "audio_filename": audio_path.name,
        "result": dummy,
    }

@app.post("/api/sessions")
async def create_session(
    file: UploadFile = File(...),
    text_id: str = Query(default="en_beginner_01"),
):
    session_id = uuid.uuid4().hex

    # 拡張子の決定（安全側に倒す）
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIX:
        # MediaRecorderはwebmが多いのでデフォルトwebm
        suffix = ".webm"

    save_path = UPLOAD_DIR / f"{session_id}{suffix}"

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    save_path.write_bytes(content)

    # Day1は解析まだなので status=uploaded でOK
    return {
        "session_id": session_id,
        "text_id": text_id,
        "status": "uploaded",
        "audio_filename": save_path.name,
        "bytes": len(content),
    }

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    # Day1は「アップロード済みかどうか」だけ返す（Day2で結果JSONを返す）
    candidates = list(UPLOAD_DIR.glob(f"{session_id}.*"))
    if not candidates:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_path = candidates[0]
    result_path = RESULT_DIR / f"{session_id}.json"

    return {
        "session_id": session_id,
        "status": "done" if result_path.exists() else "uploaded",
        "audio_filename": audio_path.name,
        "has_result": result_path.exists(),
    }