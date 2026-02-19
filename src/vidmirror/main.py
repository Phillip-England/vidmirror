import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from vidmirror.ffmpeg import EFFECTS, ensure_ffmpeg

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # project root
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    ensure_ffmpeg()
    yield


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


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


@app.post("/process")
async def process(file_id: str = Form(...), effect: str = Form(...)):
    if effect not in EFFECTS:
        raise HTTPException(400, f"Unknown effect: {effect}")

    matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(404, "Uploaded file not found")

    input_path = matches[0]
    output_name = f"{file_id}_{effect}.mp4"
    output_path = OUTPUT_DIR / output_name

    try:
        EFFECTS[effect](input_path, output_path)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))

    return {"download_url": f"/download/{output_name}"}


@app.get("/download/{filename}")
async def download(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(path, media_type="video/mp4", filename=filename)
