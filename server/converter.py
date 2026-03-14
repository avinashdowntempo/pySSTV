import io
import logging
import os
import subprocess
import tempfile

from PIL import Image

from pysstv import color, grayscale

logger = logging.getLogger(__name__)

SSTV_MODULES = [color, grayscale]


def _build_mode_map():
    mode_map = {}
    for module in SSTV_MODULES:
        for mode in module.MODES:
            mode_map[mode.__name__] = mode
    return mode_map


MODE_MAP = _build_mode_map()


def convert_image_to_wav(
    image_bytes: bytes,
    mode_name: str = "MartinM1",
    sample_rate: int = 48000,
    bits: int = 16,
    resize: bool = True,
    vox: bool = False,
    fskid: str | None = None,
) -> bytes:
    """Convert image bytes to SSTV-modulated WAV bytes.

    Args:
        image_bytes: Raw image file content.
        mode_name: SSTV mode name (e.g. MartinM1, ScottieS1).
        sample_rate: Audio sampling rate in Hz.
        bits: Bits per sample (8 or 16).
        resize: Whether to resize the image to fit the mode.
        vox: Whether to prepend VOX tones.
        fskid: Optional FSK ID string to append.

    Returns:
        WAV file content as bytes.

    Raises:
        ValueError: If mode_name is not recognised or image can't be opened.
    """
    if mode_name not in MODE_MAP:
        raise ValueError(f"Unknown SSTV mode: {mode_name}")

    mode_cls = MODE_MAP[mode_name]

    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError(f"Cannot open image: {exc}") from exc

    try:
        if resize:
            target_w, target_h = mode_cls.WIDTH, mode_cls.HEIGHT
            if image.size != (target_w, target_h):
                image = image.resize((target_w, target_h), Image.LANCZOS)
        elif image.width < mode_cls.WIDTH or image.height < mode_cls.HEIGHT:
            raise ValueError(
                f"Image must be at least {mode_cls.WIDTH}x{mode_cls.HEIGHT} "
                f"pixels for mode {mode_name}, got {image.width}x{image.height}"
            )

        sstv = mode_cls(image, sample_rate, bits)
        sstv.vox_enabled = vox
        if fskid:
            sstv.add_fskid_text(fskid)

        fd, tmp_path = tempfile.mkstemp(suffix=".wav")
        try:
            os.close(fd)
            sstv.write_wav(tmp_path)
            with open(tmp_path, "rb") as f:
                wav_bytes = f.read()
        finally:
            os.unlink(tmp_path)
    finally:
        image.close()

    logger.info(
        "Converted image (%dx%d) to WAV using %s (%d Hz, %d-bit) — %d bytes",
        image.size[0], image.size[1], mode_name, sample_rate, bits, len(wav_bytes),
    )
    return wav_bytes


def wav_to_ogg(wav_bytes: bytes, quality: int = 3) -> bytes:
    """Convert WAV bytes to OGG Vorbis using ffmpeg.

    Args:
        wav_bytes: Raw WAV file content.
        quality: Vorbis quality level (0–10, default 3 ≈ 112 kbps).

    Returns:
        OGG Vorbis file content as bytes.
    """
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", "pipe:0",
            "-c:a", "libvorbis",
            "-q:a", str(quality),
            "-f", "ogg",
            "pipe:1",
        ],
        input=wav_bytes,
        capture_output=True,
        timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr.decode(errors='replace')}")

    logger.info("Encoded OGG: %d → %d bytes (%.0f%% reduction)",
                len(wav_bytes), len(result.stdout),
                (1 - len(result.stdout) / len(wav_bytes)) * 100)
    return result.stdout
