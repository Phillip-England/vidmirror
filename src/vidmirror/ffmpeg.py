import platform
import shutil
import subprocess
import sys
from pathlib import Path


def ensure_ffmpeg() -> str:
    """Check for ffmpeg on PATH; attempt auto-install if missing. Returns the path to ffmpeg."""
    path = shutil.which("ffmpeg")
    if path:
        return path

    system = platform.system()
    print("ffmpeg not found on PATH – attempting auto-install …")

    if system == "Darwin":
        if shutil.which("brew"):
            subprocess.run(["brew", "install", "ffmpeg"], check=True)
        else:
            sys.exit("ffmpeg is not installed and Homebrew is not available. Install ffmpeg manually.")
    elif system == "Linux":
        if shutil.which("apt-get"):
            subprocess.run(["sudo", "apt-get", "install", "-y", "ffmpeg"], check=True)
        elif shutil.which("dnf"):
            subprocess.run(["sudo", "dnf", "install", "-y", "ffmpeg"], check=True)
        else:
            sys.exit("ffmpeg is not installed and no supported package manager found. Install ffmpeg manually.")
    else:
        sys.exit(f"ffmpeg is not installed. Please install it manually for {system}.")

    path = shutil.which("ffmpeg")
    if not path:
        sys.exit("ffmpeg installation attempted but ffmpeg still not found on PATH.")
    print(f"ffmpeg installed at {path}")
    return path


# ---------------------------------------------------------------------------
# Mirror effect processors
# ---------------------------------------------------------------------------

def _run_ffmpeg(args: list[str]) -> None:
    result = subprocess.run(
        args, capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{result.stderr}")


def horizontal_mirror(input_path: Path, output_path: Path) -> None:
    """Side-by-side: original on left, horizontally flipped on right."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-filter_complex",
        "[0]split[a][b];[b]hflip[b];[a][b]hstack",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def vertical_mirror(input_path: Path, output_path: Path) -> None:
    """Top-bottom: original on top, vertically flipped on bottom."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-filter_complex",
        "[0]split[a][b];[b]vflip[b];[a][b]vstack",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def quad_mirror(input_path: Path, output_path: Path) -> None:
    """2x2 grid: original, hflip, vflip, hflip+vflip."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-filter_complex",
        "[0]split=4[a][b][c][d];"
        "[b]hflip[b];[c]vflip[c];[d]hflip,vflip[d];"
        "[a][b]hstack[top];[c][d]hstack[bot];"
        "[top][bot]vstack",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def diagonal_mirror(input_path: Path, output_path: Path) -> None:
    """Diagonal from top-left: arranged so flips radiate from top-left corner."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-filter_complex",
        "[0]split=4[a][b][c][d];"
        "[b]hflip[b];[c]vflip[c];[d]hflip,vflip[d];"
        "[a][d]hstack[top];[b][c]hstack[bot];"
        "[top][bot]vstack",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def kaleidoscope(input_path: Path, output_path: Path) -> None:
    """4-way symmetry radiating from center."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-filter_complex",
        "[0]split=4[a][b][c][d];"
        "[b]hflip[b];[c]vflip[c];[d]hflip,vflip[d];"
        "[d][c]hstack[top];[b][a]hstack[bot];"
        "[top][bot]vstack",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


# ---------------------------------------------------------------------------
# Color effects
# ---------------------------------------------------------------------------

def grayscale(input_path: Path, output_path: Path) -> None:
    """Convert to black and white."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "hue=s=0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def sepia(input_path: Path, output_path: Path) -> None:
    """Warm vintage sepia tone."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def negative(input_path: Path, output_path: Path) -> None:
    """Invert all colors."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "negate",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def color_swap(input_path: Path, output_path: Path) -> None:
    """Swap red and blue channels for a psychedelic look."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "colorchannelmixer=0:0:1:0:0:1:0:0:1:0:0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


# ---------------------------------------------------------------------------
# Speed effects
# ---------------------------------------------------------------------------

def reverse_vid(input_path: Path, output_path: Path) -> None:
    """Reverse the video playback."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "reverse",
        "-af", "areverse",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def speed_2x(input_path: Path, output_path: Path) -> None:
    """Double the playback speed."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "setpts=0.5*PTS",
        "-af", "atempo=2.0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def slow_mo(input_path: Path, output_path: Path) -> None:
    """Half the playback speed for slow motion."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "setpts=2.0*PTS",
        "-af", "atempo=0.5",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


# ---------------------------------------------------------------------------
# Stylization effects
# ---------------------------------------------------------------------------

def blur(input_path: Path, output_path: Path) -> None:
    """Apply a soft gaussian blur."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "boxblur=8:4",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def edge_detect(input_path: Path, output_path: Path) -> None:
    """Highlight edges for a sketch-like look."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "edgedetect=low=0.1:high=0.4",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def vignette_effect(input_path: Path, output_path: Path) -> None:
    """Dark vignette around the edges."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "vignette=PI/4",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def pixelate(input_path: Path, output_path: Path) -> None:
    """Mosaic pixelation effect."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "scale=iw/10:ih/10,scale=iw*10:ih*10:flags=neighbor",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def sharpen(input_path: Path, output_path: Path) -> None:
    """Increase sharpness for a crisp look."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "unsharp=5:5:2.0:5:5:0.0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def emboss(input_path: Path, output_path: Path) -> None:
    """3D emboss / relief effect."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf", "convolution=-2 -1 0 -1 1 1 0 1 2:-2 -1 0 -1 1 1 0 1 2:-2 -1 0 -1 1 1 0 1 2:-2 -1 0 -1 1 1 0 1 2",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def retro(input_path: Path, output_path: Path) -> None:
    """VHS-style retro look with noise and color shift."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf",
        "noise=alls=25:allf=t+u,"
        "eq=saturation=0.7:contrast=1.3:brightness=0.05,"
        "unsharp=5:5:0.5:5:5:0.0,"
        "vignette=PI/4",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


def glitch(input_path: Path, output_path: Path) -> None:
    """RGB channel offset glitch effect."""
    _run_ffmpeg([
        "ffmpeg", "-y", "-i", str(input_path),
        "-vf",
        "split=3[r][g][b];"
        "[r]lutrgb=g=0:b=0,crop=iw:ih:0:0[r];"
        "[g]lutrgb=r=0:b=0,crop=iw:ih:0:0[g];"
        "[b]lutrgb=r=0:g=0,crop=iw:ih:0:0[b];"
        "[r]pad=iw+8:ih[rp];"
        "[rp][g]overlay=4:0[rg];"
        "[rg][b]overlay=8:0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac",
        str(output_path),
    ])


EFFECTS = {
    "horizontal": horizontal_mirror,
    "vertical": vertical_mirror,
    "quad": quad_mirror,
    "diagonal": diagonal_mirror,
    "kaleidoscope": kaleidoscope,
    "grayscale": grayscale,
    "sepia": sepia,
    "negative": negative,
    "color_swap": color_swap,
    "reverse": reverse_vid,
    "speed_2x": speed_2x,
    "slow_mo": slow_mo,
    "blur": blur,
    "edge_detect": edge_detect,
    "vignette": vignette_effect,
    "pixelate": pixelate,
    "sharpen": sharpen,
    "emboss": emboss,
    "retro": retro,
    "glitch": glitch,
}
