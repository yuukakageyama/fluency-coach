from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from openai import OpenAI
import uuid
import os
import json

app = FastAPI(title="Fluency Coach API")

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
RESULT_DIR = DATA_DIR / "results"
PLOTS_DIR = DATA_DIR / "plots"

for d in [UPLOAD_DIR, RESULT_DIR, PLOTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

ALLOWED_SUFFIX = {".webm", ".wav", ".mp3", ".m4a", ".ogg"}


def generate_feedback(transcript: str) -> dict:
    prompt = f"""
You are a friendly English fluency coach.

Analyze the following learner's spoken English transcript.

Return JSON with these keys:
- summary: a short 1-2 sentence summary
- fluency_score: integer from 1 to 10
- strengths: array of 2 short bullet points
- improvements: array of 3 short bullet points
- overall_comment: one encouraging comment

Transcript:
\"\"\"{transcript}\"\"\"
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
    )

    text = response.output_text

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "summary": "The speaker talked about a daily-life topic.",
            "fluency_score": 7,
            "strengths": ["Clear main message", "Good effort"],
            "improvements": [
                "Reduce long pauses",
                "Use shorter sentences",
                "Speak with steadier rhythm",
            ],
            "overall_comment": text,
        }


@app.post("/api/sessions")
async def create_session(
    file: UploadFile = File(...),
    text_id: str = Query(default="en_beginner_01"),
):
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    session_id = uuid.uuid4().hex

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIX:
        suffix = ".webm"

    save_path = UPLOAD_DIR / f"{session_id}{suffix}"

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    save_path.write_bytes(content)

    try:
        with open(save_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )

        transcript = transcription.text

        feedback = generate_feedback(transcript)

        result = {
            "transcript": transcript,
            "summary": feedback.get("summary"),
            "fluency_score": feedback.get("fluency_score"),
            "strengths": feedback.get("strengths", []),
            "improvements": feedback.get("improvements", []),
            "overall_comment": feedback.get("overall_comment"),
        }

        result_path = RESULT_DIR / f"{session_id}.json"
        result_path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        return {
            "session_id": session_id,
            "text_id": text_id,
            "status": "done",
            "audio_filename": save_path.name,
            "result": result,
        }

    except Exception as e:
        print("Analysis failed:", repr(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    candidates = list(UPLOAD_DIR.glob(f"{session_id}.*"))
    if not candidates:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_path = candidates[0]
    result_path = RESULT_DIR / f"{session_id}.json"

    if result_path.exists():
        result = json.loads(result_path.read_text(encoding="utf-8"))
        return {
            "session_id": session_id,
            "status": "done",
            "audio_filename": audio_path.name,
            "has_result": True,
            "result": result,
        }

    return {
        "session_id": session_id,
        "status": "uploaded",
        "audio_filename": audio_path.name,
        "has_result": False,
    }