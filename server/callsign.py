import json
import logging
import re
import sqlite3
import time
import urllib.request
from pathlib import Path

from flask import Blueprint, Response, jsonify, request

logger = logging.getLogger(__name__)

callsign_bp = Blueprint("callsign", __name__)

# Amateur radio callsign pattern: 1-2 letter/digit prefix, digit, 1-3 letter suffix
_CALLSIGN_RE = re.compile(r"^[A-Z0-9]{1,2}[0-9][A-Z]{1,3}$")
_CALLOOK_URL = "https://callook.info/{callsign}/json"
_DB_PATH = Path("/app/data/callsigns.db")


def _get_db() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            callsign TEXT NOT NULL,
            name TEXT NOT NULL,
            oper_class TEXT NOT NULL DEFAULT '',
            gridsquare TEXT NOT NULL DEFAULT '',
            checked_in_at REAL NOT NULL
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_checkins_time
        ON checkins (checked_in_at DESC)
    """)
    conn.commit()
    return conn


def _validate_callsign(callsign: str) -> str | None:
    """Normalize and validate a callsign. Returns uppercase or None if invalid."""
    normalized = callsign.strip().upper()
    if _CALLSIGN_RE.match(normalized):
        return normalized
    return None


def _lookup_callsign(callsign: str) -> dict | None:
    """Look up a callsign via callook.info (backed by FCC ULS)."""
    url = _CALLOOK_URL.format(callsign=callsign)
    req = urllib.request.Request(url, headers={"User-Agent": "WavePix/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
    except Exception:
        logger.exception("callook.info lookup failed for %s", callsign)
        return None

    if data.get("status") != "VALID":
        return None

    return {
        "callsign": data.get("current", {}).get("callsign", callsign),
        "name": data.get("name", ""),
        "type": data.get("type", ""),
        "operClass": data.get("current", {}).get("operClass", ""),
        "gridsquare": data.get("location", {}).get("gridsquare", ""),
        "trustee": data.get("trustee", {}).get("name", ""),
    }


@callsign_bp.route("/callsign/lookup", methods=["GET"])
def lookup() -> Response | tuple[Response, int]:
    raw = request.args.get("callsign", "")
    callsign = _validate_callsign(raw)
    if not callsign:
        return jsonify({"error": "Invalid call sign format"}), 400

    result = _lookup_callsign(callsign)
    if result is None:
        return jsonify({"error": "Call sign not found in FCC ULS database"}), 404

    return jsonify(result)


@callsign_bp.route("/callsign/checkin", methods=["POST"])
def checkin() -> Response | tuple[Response, int]:
    body = request.get_json(silent=True)
    if not body or "callsign" not in body:
        return jsonify({"error": "Missing callsign field"}), 400

    callsign = _validate_callsign(body["callsign"])
    if not callsign:
        return jsonify({"error": "Invalid call sign format"}), 400

    # Verify against ULS before accepting
    result = _lookup_callsign(callsign)
    if result is None:
        return jsonify({"error": "Call sign not found in FCC ULS database"}), 404

    db = _get_db()
    try:
        existing = db.execute(
            "SELECT 1 FROM checkins WHERE callsign = ?", (result["callsign"],)
        ).fetchone()
        if existing:
            return jsonify({"error": f"{result['callsign']} is already checked in"}), 409

        db.execute(
            "INSERT INTO checkins (callsign, name, oper_class, gridsquare, checked_in_at) VALUES (?, ?, ?, ?, ?)",
            (result["callsign"], result["name"], result["operClass"], result["gridsquare"], time.time()),
        )
        db.commit()
    finally:
        db.close()

    return jsonify({"ok": True, **result})


@callsign_bp.route("/callsign/board", methods=["GET"])
def board() -> Response:
    limit = min(int(request.args.get("limit", 50)), 200)
    db = _get_db()
    try:
        rows = db.execute(
            "SELECT callsign, name, oper_class, gridsquare, checked_in_at FROM checkins ORDER BY checked_in_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    finally:
        db.close()

    entries = [
        {
            "callsign": r["callsign"],
            "name": r["name"],
            "operClass": r["oper_class"],
            "gridsquare": r["gridsquare"],
            "checkedInAt": r["checked_in_at"],
        }
        for r in rows
    ]
    return jsonify({"entries": entries})
