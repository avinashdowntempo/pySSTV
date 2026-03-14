import logging
import os
from dataclasses import dataclass

from flask import Flask, request, jsonify, send_file, Response
from flask_compress import Compress  # type: ignore[import-untyped]
from werkzeug.exceptions import HTTPException
import io

from server.config import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MODES,
    DEFAULT_BITS,
    DEFAULT_MODE,
    DEFAULT_SAMPLE_RATE,
    MAX_CONTENT_LENGTH,
)
from server.converter import convert_image_to_wav

logger = logging.getLogger(__name__)


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _parse_bool_field(value: str, default: str) -> bool:
    return value.lower() in ("true", "1", "yes") if value else default.lower() in ("true", "1", "yes")


def _validate_upload() -> tuple[Response, int] | None:
    if "image" not in request.files:
        return jsonify({"error": "No 'image' file part in the request"}), 400

    file = request.files["image"]
    if file.filename == "" or file.filename is None:
        return jsonify({"error": "No file selected"}), 400

    if not _allowed_file(file.filename):
        return jsonify({
            "error": f"File type not allowed. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 400

    return None


@dataclass
class ConversionParams:
    mode: str
    sample_rate: int
    bits: int
    resize: bool
    vox: bool
    fskid: str | None


def _parse_conversion_params() -> ConversionParams | tuple[Response, int]:
    mode: str = request.form.get("mode", DEFAULT_MODE)
    if mode not in ALLOWED_MODES:
        return jsonify({
            "error": f"Unknown mode '{mode}'. Use GET /modes for available modes."
        }), 400

    try:
        sample_rate = int(request.form.get("sample_rate", DEFAULT_SAMPLE_RATE))
        bits = int(request.form.get("bits", DEFAULT_BITS))
    except (ValueError, TypeError):
        return jsonify({"error": "sample_rate and bits must be integers"}), 400

    if bits not in (8, 16):
        return jsonify({"error": "bits must be 8 or 16"}), 400

    if not 8000 <= sample_rate <= 96000:
        return jsonify({"error": "sample_rate must be between 8000 and 96000"}), 400

    resize = _parse_bool_field(request.form.get("resize", "true"), "true")
    vox = _parse_bool_field(request.form.get("vox", "false"), "false")
    fskid: str | None = request.form.get("fskid") or None

    if fskid and len(fskid) > 128:
        return jsonify({"error": "fskid must be 128 characters or fewer"}), 400

    return ConversionParams(mode=mode, sample_rate=sample_rate, bits=bits, resize=resize, vox=vox, fskid=fskid)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
    Compress(app)

    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    @app.route("/health", methods=["GET"])
    def health() -> Response:
        return jsonify({"status": "ok"})

    @app.route("/modes", methods=["GET"])
    def list_modes() -> Response:
        return jsonify({"modes": sorted(ALLOWED_MODES)})

    @app.route("/convert", methods=["POST"])
    def convert() -> Response | tuple[Response, int]:  # noqa: F811
        upload_error = _validate_upload()
        if upload_error is not None:
            return upload_error

        params = _parse_conversion_params()
        if not isinstance(params, ConversionParams):
            return params

        file = request.files["image"]
        image_bytes: bytes = file.read()

        try:
            wav_bytes = convert_image_to_wav(
                image_bytes=image_bytes,
                mode_name=params.mode,
                sample_rate=params.sample_rate,
                bits=params.bits,
                resize=params.resize,
                vox=params.vox,
                fskid=params.fskid,
            )
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception("Unexpected error during conversion")
            return jsonify({"error": "Internal server error during conversion"}), 500

        base_name = file.filename.rsplit(".", 1)[0] if file.filename else "output"
        output_filename = f"{base_name}_{params.mode}.wav"

        return send_file(
            io.BytesIO(wav_bytes),
            mimetype="audio/wav",
            as_attachment=True,
            download_name=output_filename,
        )

    @app.errorhandler(413)
    def request_entity_too_large(error: HTTPException) -> tuple[Response, int]:
        max_mb = MAX_CONTENT_LENGTH // (1024 * 1024)
        return jsonify({"error": f"File too large. Maximum size is {max_mb} MB."}), 413

    @app.errorhandler(404)
    def not_found(error: HTTPException) -> tuple[Response, int]:
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error: HTTPException) -> tuple[Response, int]:
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_server_error(error: HTTPException) -> tuple[Response, int]:
        logger.exception("Unhandled server error")
        return jsonify({"error": "Internal server error"}), 500

    return app
