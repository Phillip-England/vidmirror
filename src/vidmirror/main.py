import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import mimetypes
import threading
import time
import uuid
import zipfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from vidmirror.ffmpeg import (
    COLLAGE_EFFECTS,
    EFFECT_OUTPUT_EXTENSIONS,
    EFFECTS,
    chunk_video,
    ensure_ffmpeg,
    ffmpeg_progress,
    get_duration,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # project root
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
STATIC_DIR = Path(__file__).resolve().parent / "static"
PROCESS_JOBS = {}
PROCESS_JOBS_LOCK = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    ensure_ffmpeg()
    yield


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def _update_process_job(job_id: str, **updates):
    with PROCESS_JOBS_LOCK:
        PROCESS_JOBS[job_id].update(updates)


def _run_process_job(
    job_id: str,
    effect: str,
    input_path: Path,
    output_path: Path,
    output_name: str,
    duration: float | None,
):
    started_at = time.monotonic()

    def report_progress(processed_seconds: float):
        if duration and duration > 0:
            progress = min(max(processed_seconds / duration, 0), 0.99)
            elapsed = time.monotonic() - started_at
            eta = (elapsed / progress) - elapsed if progress > 0 else None
        else:
            progress = None
            eta = None
        _update_process_job(
            job_id,
            state="processing",
            progress=progress,
            processed_seconds=processed_seconds,
            elapsed_seconds=time.monotonic() - started_at,
            eta_seconds=eta,
        )

    try:
        _update_process_job(job_id, state="processing", progress=0, eta_seconds=None)
        with ffmpeg_progress(report_progress):
            EFFECTS[effect](input_path, output_path)
        _update_process_job(
            job_id,
            state="done",
            progress=1,
            eta_seconds=0,
            download_url=f"/download/{output_name}",
            filename=output_name,
            media_type=mimetypes.guess_type(output_name)[0] or "application/octet-stream",
        )
    except RuntimeError as exc:
        _update_process_job(job_id, state="error", error=str(exc), eta_seconds=None)


@app.get("/", response_class=HTMLResponse)
async def index():
    return (STATIC_DIR / "index.html").read_text()


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    ext = Path(file.filename or "video.mp4").suffix or ".mp4"
    file_id = uuid.uuid4().hex
    dest = UPLOAD_DIR / f"{file_id}{ext}"
    content = await file.read()
    dest.write_bytes(content)
    return {"file_id": file_id, "filename": file.filename, "ext": ext}


@app.get("/preview/{file_id}")
async def preview(file_id: str):
    matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(404, "File not found")
    return FileResponse(matches[0], media_type="video/mp4")


@app.get("/preview_collage/{file_ids}")
async def preview_collage(file_ids: str):
    first_id = file_ids.split(",")[0]
    matches = list(UPLOAD_DIR.glob(f"{first_id}.*"))
    if not matches:
        raise HTTPException(404, "File not found")
    return FileResponse(matches[0], media_type="video/mp4")


@app.post("/upload_multiple")
async def upload_multiple(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(400, "At least 2 videos required for collage")

    file_ids = []
    for file in files:
        ext = Path(file.filename or "video.mp4").suffix or ".mp4"
        file_id = uuid.uuid4().hex
        dest = UPLOAD_DIR / f"{file_id}{ext}"
        content = await file.read()
        dest.write_bytes(content)
        file_ids.append(file_id)

    return {"file_ids": file_ids}


@app.post("/process_collage")
async def process_collage(file_ids: str = Form(...), effect: str = Form(...)):
    if effect not in COLLAGE_EFFECTS:
        raise HTTPException(400, f"Unknown collage effect: {effect}")

    file_id_list = file_ids.split(",")

    collage_fn = COLLAGE_EFFECTS[effect]
    required = {
        "collage_2x1": 2,
        "collage_1x2": 2,
        "collage_2x2": 4,
        "collage_3x3": 9,
        "collage_3x2": 6,
        "collage_4x4": 16,
    }

    if len(file_id_list) != required[effect]:
        raise HTTPException(400, f"This collage requires {required[effect]} videos")

    input_paths = []
    for file_id in file_id_list:
        matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
        if not matches:
            raise HTTPException(404, f"File {file_id} not found")
        input_paths.append(matches[0])

    output_name = f"{file_id_list[0]}_{effect}.mp4"
    output_path = OUTPUT_DIR / output_name

    try:
        collage_fn(input_paths, output_path)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))

    return {"download_url": f"/download/{output_name}"}


@app.post("/process")
async def process(file_id: str = Form(...), effect: str = Form(...)):
    if effect not in EFFECTS:
        raise HTTPException(400, f"Unknown effect: {effect}")

    matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(404, "Uploaded file not found")

    input_path = matches[0]
    output_ext = EFFECT_OUTPUT_EXTENSIONS.get(effect, ".mp4")
    output_name = f"{file_id}_{effect}{output_ext}"
    output_path = OUTPUT_DIR / output_name

    try:
        EFFECTS[effect](input_path, output_path)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))

    return {
        "download_url": f"/download/{output_name}",
        "filename": output_name,
        "media_type": mimetypes.guess_type(output_name)[0] or "application/octet-stream",
    }


@app.post("/process_start")
async def process_start(file_id: str = Form(...), effect: str = Form(...)):
    if effect not in EFFECTS:
        raise HTTPException(400, f"Unknown effect: {effect}")

    matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(404, "Uploaded file not found")

    input_path = matches[0]
    output_ext = EFFECT_OUTPUT_EXTENSIONS.get(effect, ".mp4")
    output_name = f"{file_id}_{effect}_{uuid.uuid4().hex[:8]}{output_ext}"
    output_path = OUTPUT_DIR / output_name

    try:
        duration = get_duration(input_path)
    except RuntimeError:
        duration = None

    job_id = uuid.uuid4().hex
    with PROCESS_JOBS_LOCK:
        PROCESS_JOBS[job_id] = {
            "state": "queued",
            "progress": 0,
            "processed_seconds": 0,
            "elapsed_seconds": 0,
            "eta_seconds": None,
            "download_url": None,
            "filename": None,
            "media_type": None,
            "error": None,
        }

    thread = threading.Thread(
        target=_run_process_job,
        args=(job_id, effect, input_path, output_path, output_name, duration),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id}


@app.get("/process_status/{job_id}")
async def process_status(job_id: str):
    with PROCESS_JOBS_LOCK:
        job = PROCESS_JOBS.get(job_id)
        if job is None:
            raise HTTPException(404, "Processing job not found")
        return dict(job)


@app.post("/process_chunks")
async def process_chunks(file_id: str = Form(...), clip_length: float = Form(...)):
    if clip_length <= 0:
        raise HTTPException(400, "Clip length must be greater than zero")
    if clip_length > 3600:
        raise HTTPException(400, "Clip length must be one hour or less")

    matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(404, "Uploaded file not found")

    input_path = matches[0]
    chunk_id = uuid.uuid4().hex[:8]
    chunk_dir = OUTPUT_DIR / f"{file_id}_chunks_{chunk_id}"
    length_label = f"{clip_length:g}".replace(".", "p")
    zip_name = f"{file_id}_chunks_{length_label}s_{chunk_id}.zip"
    zip_path = OUTPUT_DIR / zip_name

    try:
        clips = chunk_video(input_path, chunk_dir, clip_length)
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for clip in clips:
                archive.write(clip, arcname=clip.name)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))

    return {
        "download_url": f"/download/{zip_name}",
        "filename": zip_name,
        "clip_count": len(clips),
    }


@app.get("/download/{filename}")
async def download(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    return FileResponse(path, media_type=media_type, filename=filename)
