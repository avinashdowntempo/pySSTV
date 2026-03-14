import os

# SSTV conversion settings
ALLOWED_MODES = frozenset({
    "MartinM1", "MartinM2",
    "ScottieS1", "ScottieS2", "ScottieDX",
    "Robot36", "Robot72",
    "PasokonP3", "PasokonP5", "PasokonP7",
    "PD90", "PD120", "PD160", "PD180", "PD240", "PD290",
    "WraaseSC2120", "WraaseSC2180",
    "Robot8BW", "Robot24BW",
})

DEFAULT_MODE = "MartinM1"
DEFAULT_SAMPLE_RATE = 22050
DEFAULT_BITS = 16

# Upload limits
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_UPLOAD_SIZE_MB", 10)) * 1024 * 1024
ALLOWED_EXTENSIONS = frozenset({"jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"})
ALLOWED_FORMATS = frozenset({"wav", "ogg"})
DEFAULT_FORMAT = "ogg"
