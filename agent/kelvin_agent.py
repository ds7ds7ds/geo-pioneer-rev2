"""
Project Kelvin — Python HTTP Agent for Celsius Design v6.2d
============================================================
v5.0 — Delegates ALL Celsius UI interaction to AutoHotkey v2.

Architecture
------------
  ┌──────────┐   HTTP    ┌──────────────┐  subprocess  ┌─────────────────────┐
  │ Frontend  │ ───────▶ │ kelvin_agent  │ ──────────▶ │ celsius_automation  │
  │ (browser) │ ◀─────── │   (Python)    │ ◀────────── │       (AHK v2)      │
  └──────────┘   JSON    └──────────────┘   JSON file  └─────────────────────┘

Python handles:
  - HTTP server on port 5000 (Flask)
  - Receiving INI files from the frontend
  - Calling the AHK script via subprocess for each pipeline step
  - Reading the JSON status file written by AHK
  - Returning results to the frontend

AHK handles:
  - All Celsius window interaction (WinActivate, Click, SendText, etc.)
  - Tab navigation, password entry, file dialogs
  - Screenshots at every step

Requirements:
    pip install flask

Usage:
    python kelvin_agent.py
"""

import json
import logging
import os
import shutil
import subprocess
import sys
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

try:
    from flask import Flask, request, jsonify, send_file
except ImportError:
    print("Flask not installed. Run: pip install flask")
    sys.exit(1)

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Configuration                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

AGENT_PORT = 5000
AGENT_VERSION = "5.0.0"

# Paths
HOME = Path(os.environ.get("USERPROFILE", Path.home()))
WORK_DIR   = HOME / "KelvinAgent"
INPUT_DIR  = WORK_DIR / "input"
OUTPUT_DIR = WORK_DIR / "output"
LOG_DIR    = WORK_DIR / "logs"

# AHK paths
AHK_EXE    = r"C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
AHK_SCRIPT = Path(__file__).parent / "celsius_automation.ahk"

# Status file written by AHK after each action
STATUS_FILE = WORK_DIR / "ahk_status.json"

# Create directories
for d in [WORK_DIR, INPUT_DIR, OUTPUT_DIR, LOG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Logging                                                                 ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

LOG_FILE = LOG_DIR / f"kelvin_agent_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
    ],
)
log = logging.getLogger("KelvinAgent")

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  AHK Interface                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def run_ahk(action: str, *args, timeout: int = 300) -> dict:
    """
    Run the AHK script with the given action and arguments.

    Returns the parsed JSON status dict written by the AHK script,
    or an error dict if the call failed.

    Parameters
    ----------
    action : str
        One of: launch, load_ini, run_sim, export_results, click_tab,
                screenshot, close
    *args : str
        Additional arguments (e.g., INI path for load_ini)
    timeout : int
        Maximum seconds to wait for the AHK process to finish.
    """
    # Verify AHK is installed
    if not Path(AHK_EXE).exists():
        log.error(f"AutoHotkey v2 not found at: {AHK_EXE}")
        return {
            "action": action,
            "status": "error",
            "message": f"AutoHotkey v2 not found at: {AHK_EXE}",
        }

    # Verify AHK script exists
    if not AHK_SCRIPT.exists():
        log.error(f"AHK script not found at: {AHK_SCRIPT}")
        return {
            "action": action,
            "status": "error",
            "message": f"AHK script not found at: {AHK_SCRIPT}",
        }

    # Clear previous status file
    if STATUS_FILE.exists():
        try:
            STATUS_FILE.unlink()
        except Exception:
            pass

    # Build command
    cmd = [str(AHK_EXE), str(AHK_SCRIPT), action] + [str(a) for a in args]
    log.info(f"Running AHK: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(WORK_DIR),
        )
        log.info(f"AHK exit code: {result.returncode}")
        if result.stdout.strip():
            log.debug(f"AHK stdout: {result.stdout[:500]}")
        if result.stderr.strip():
            log.warning(f"AHK stderr: {result.stderr[:500]}")
    except subprocess.TimeoutExpired:
        log.error(f"AHK timed out after {timeout}s for action: {action}")
        return {
            "action": action,
            "status": "error",
            "message": f"AHK timed out after {timeout}s",
        }
    except Exception as e:
        log.error(f"AHK subprocess error: {e}")
        return {
            "action": action,
            "status": "error",
            "message": f"AHK subprocess error: {e}",
        }

    # Read the status file written by AHK
    return read_ahk_status(action)


def read_ahk_status(action: str) -> dict:
    """Read and parse the JSON status file written by the AHK script."""
    if not STATUS_FILE.exists():
        log.warning("AHK status file not found — AHK may have crashed")
        return {
            "action": action,
            "status": "error",
            "message": "AHK status file not found (script may have crashed)",
        }

    try:
        raw = STATUS_FILE.read_text(encoding="utf-8")
        status = json.loads(raw)
        log.info(f"AHK status: {json.dumps(status, indent=2)}")
        return status
    except json.JSONDecodeError as e:
        log.error(f"Failed to parse AHK status JSON: {e}")
        log.error(f"Raw content: {raw[:500]}")
        return {
            "action": action,
            "status": "error",
            "message": f"Failed to parse AHK status: {e}",
        }


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Job Management                                                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# In-memory job store (single-threaded for simplicity)
jobs = {}
current_job_id = None


def create_job(ini_content: str) -> dict:
    """Create a new job, save the INI file, return the job dict."""
    job_id = datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:6]
    job_dir = OUTPUT_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    ini_path = INPUT_DIR / f"kelvin_{job_id}.ini"
    ini_path.write_text(ini_content, encoding="utf-8")

    job = {
        "id": job_id,
        "status": "created",
        "ini_path": str(ini_path),
        "output_dir": str(job_dir),
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "steps": [],
        "result_path": None,
        "error": None,
    }
    jobs[job_id] = job
    log.info(f"Job created: {job_id} — INI saved to {ini_path}")
    return job


def add_step(job_id: str, step_name: str, status: str, message: str = ""):
    """Add a step entry to the job's step log."""
    if job_id not in jobs:
        return
    entry = {
        "name": step_name,
        "status": status,
        "message": message,
        "time": datetime.now().isoformat(),
    }
    jobs[job_id]["steps"].append(entry)
    jobs[job_id]["status"] = f"{step_name}: {status}"
    log.info(f"[{job_id}] {step_name}: {status} — {message}")


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Pipeline — Full automation sequence                                     ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def run_pipeline(job_id: str):
    """
    Full automation pipeline (runs in a background thread):
      1. launch    — Start Celsius + enter password
      2. load_ini  — Load the INI file
      3. run_sim   — Run the simulation
      4. export    — Export results
    """
    global current_job_id
    current_job_id = job_id
    job = jobs[job_id]

    try:
        # ── Step 1: Launch & Unlock ──────────────────────────────────
        add_step(job_id, "launch", "running", "Launching Celsius Design …")
        result = run_ahk("launch", timeout=120)
        if result.get("status") == "error":
            add_step(job_id, "launch", "failed", result.get("message", ""))
            job["status"] = "failed"
            job["error"] = result.get("message")
            return
        add_step(job_id, "launch", "done", result.get("message", ""))

        # ── Step 2: Load INI ─────────────────────────────────────────
        add_step(job_id, "load_ini", "running", f"Loading {Path(job['ini_path']).name} …")
        result = run_ahk("load_ini", job["ini_path"], timeout=120)
        if result.get("status") == "error":
            add_step(job_id, "load_ini", "failed", result.get("message", ""))
            job["status"] = "failed"
            job["error"] = result.get("message")
            return
        add_step(job_id, "load_ini", "done", result.get("message", ""))

        # ── Step 3: Run Simulation ───────────────────────────────────
        add_step(job_id, "simulate", "running", "Running thermal simulation …")
        result = run_ahk("run_sim", timeout=300)
        if result.get("status") == "error":
            add_step(job_id, "simulate", "failed", result.get("message", ""))
            job["status"] = "failed"
            job["error"] = result.get("message")
            return
        add_step(job_id, "simulate", "done", result.get("message", ""))

        # ── Step 4: Export Results ───────────────────────────────────
        output_path = str(Path(job["output_dir"]) / f"results_{job_id}.ini")
        add_step(job_id, "export", "running", f"Exporting to {output_path} …")
        result = run_ahk("export_results", output_path, timeout=120)

        # Check for the result file
        result_path = result.get("path", output_path)
        found_path = None
        for candidate in [result_path, output_path, output_path + ".ini"]:
            if Path(candidate).exists():
                found_path = candidate
                break

        if found_path:
            job["result_path"] = found_path
            add_step(job_id, "export", "done", f"Saved: {found_path}")
        else:
            add_step(job_id, "export", "warning",
                     "Export sent but file not confirmed")
            job["result_path"] = output_path

        job["status"] = "complete"
        job["completed_at"] = datetime.now().isoformat()
        log.info(f"[{job_id}] Pipeline complete!")

    except Exception as e:
        add_step(job_id, "error", "failed", str(e))
        job["status"] = "failed"
        job["error"] = str(e)
        log.error(f"[{job_id}] Pipeline exception: {e}", exc_info=True)
    finally:
        current_job_id = None


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Flask HTTP Server                                                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    """Add CORS headers to every response."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


# ── GET /api/status ──────────────────────────────────────────────────────

@app.route("/api/status", methods=["GET"])
def api_status():
    """Return agent status and environment info."""
    ahk_ok = Path(AHK_EXE).exists()
    ahk_script_ok = AHK_SCRIPT.exists()
    return jsonify({
        "agent_version": AGENT_VERSION,
        "status": "ready" if (ahk_ok and ahk_script_ok) else "missing_deps",
        "ahk_exe_found": ahk_ok,
        "ahk_exe_path": str(AHK_EXE),
        "ahk_script_found": ahk_script_ok,
        "ahk_script_path": str(AHK_SCRIPT),
        "work_dir": str(WORK_DIR),
        "log_dir": str(LOG_DIR),
        "current_job": current_job_id,
        "total_jobs": len(jobs),
    })


# ── POST /api/run ────────────────────────────────────────────────────────

@app.route("/api/run", methods=["POST"])
def api_run():
    """Start a full automation pipeline.

    Request JSON:
        {
            "ini": "<INI file content as string>",
            "job_id": "optional_custom_id"
        }

    Response JSON:
        {
            "status": "accepted",
            "job_id": "20260331_120000_abc123"
        }
    """
    data = request.get_json(force=True, silent=True) or {}
    ini_content = data.get("ini", "")

    if not ini_content:
        return jsonify({"error": "No INI content provided"}), 400

    # Create job
    job = create_job(ini_content)

    # Optionally override job_id
    custom_id = data.get("job_id")
    if custom_id:
        old_id = job["id"]
        job["id"] = custom_id
        jobs[custom_id] = jobs.pop(old_id)

    # Start pipeline in background thread
    thread = threading.Thread(
        target=run_pipeline,
        args=(job["id"],),
        daemon=True,
    )
    thread.start()

    return jsonify({
        "status": "accepted",
        "job_id": job["id"],
        "message": "Pipeline started in background",
    })


# ── GET /api/job ─────────────────────────────────────────────────────────

@app.route("/api/job", methods=["GET"])
@app.route("/api/job/<job_id>", methods=["GET"])
def api_job(job_id=None):
    """Return the status of a specific job, or the current/latest job."""
    if job_id and job_id in jobs:
        return jsonify(jobs[job_id])

    if current_job_id and current_job_id in jobs:
        return jsonify(jobs[current_job_id])

    if jobs:
        latest = max(jobs.values(), key=lambda j: j["started_at"])
        return jsonify(latest)

    return jsonify({"status": "no_jobs"})


# ── GET /api/results/<job_id> ────────────────────────────────────────────

@app.route("/api/results/<job_id>", methods=["GET"])
def api_results(job_id):
    """Return the exported INI content for a completed job."""
    if job_id not in jobs:
        return jsonify({"error": f"Job not found: {job_id}"}), 404

    job = jobs[job_id]
    if job["status"] != "complete":
        return jsonify({
            "status": job["status"],
            "message": "Job not yet complete",
        })

    result_path = job.get("result_path")
    if result_path and Path(result_path).exists():
        content = Path(result_path).read_text(encoding="utf-8")
        return jsonify({
            "status": "complete",
            "job_id": job_id,
            "ini_content": content,
            "path": result_path,
        })

    return jsonify({
        "status": "error",
        "message": "Result file not found",
        "expected_path": result_path,
    })


# ── Manual step endpoints (for debugging / testing) ──────────────────────

@app.route("/api/launch", methods=["POST"])
def api_launch():
    """Manually trigger: launch Celsius + enter password."""
    result = run_ahk("launch", timeout=120)
    return jsonify(result)


@app.route("/api/load", methods=["POST"])
def api_load():
    """Manually trigger: load an INI file.

    Request JSON: {"path": "C:\\path\\to\\file.ini"}
    """
    data = request.get_json(force=True, silent=True) or {}
    ini_path = data.get("path", "")
    if not ini_path:
        return jsonify({"error": "No path provided"}), 400
    result = run_ahk("load_ini", ini_path, timeout=120)
    return jsonify(result)


@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    """Manually trigger: run simulation."""
    result = run_ahk("run_sim", timeout=300)
    return jsonify(result)


@app.route("/api/export", methods=["POST"])
def api_export():
    """Manually trigger: export results.

    Request JSON: {"path": "C:\\path\\to\\output.ini"}
    """
    data = request.get_json(force=True, silent=True) or {}
    output_path = data.get("path", str(OUTPUT_DIR / "manual_export.ini"))
    result = run_ahk("export_results", output_path, timeout=120)
    return jsonify(result)


@app.route("/api/click_tab", methods=["POST"])
def api_click_tab():
    """Manually click a specific tab (for testing).

    Request JSON: {"tab": "Well placement"}
    """
    data = request.get_json(force=True, silent=True) or {}
    tab_name = data.get("tab", "")
    if not tab_name:
        return jsonify({"error": "No tab name provided"}), 400
    result = run_ahk("click_tab", tab_name, timeout=30)
    return jsonify(result)


@app.route("/api/screenshot", methods=["GET", "POST"])
def api_screenshot():
    """Take a screenshot via AHK."""
    label = request.args.get("label", "manual")
    result = run_ahk("screenshot", label, timeout=30)
    return jsonify(result)


@app.route("/api/close", methods=["POST"])
def api_close():
    """Close Celsius."""
    result = run_ahk("close", timeout=30)
    return jsonify(result)


# ── Log access ───────────────────────────────────────────────────────────

@app.route("/api/log", methods=["GET"])
def api_log():
    """Return the tail of the current Python log file."""
    tail = int(request.args.get("tail", 200))
    if LOG_FILE.exists():
        lines = LOG_FILE.read_text(encoding="utf-8").splitlines()
        tail_lines = lines[-tail:] if len(lines) > tail else lines
        return jsonify({
            "status": "ok",
            "log_file": str(LOG_FILE),
            "total_lines": len(lines),
            "showing": len(tail_lines),
            "lines": tail_lines,
        })
    return jsonify({"status": "error", "message": "Log file not found"})


@app.route("/api/ahk_log", methods=["GET"])
def api_ahk_log():
    """Return the tail of today's AHK log file."""
    tail = int(request.args.get("tail", 200))
    ahk_log = LOG_DIR / f"ahk_{datetime.now().strftime('%Y%m%d')}.log"
    if ahk_log.exists():
        lines = ahk_log.read_text(encoding="utf-8").splitlines()
        tail_lines = lines[-tail:] if len(lines) > tail else lines
        return jsonify({
            "status": "ok",
            "log_file": str(ahk_log),
            "total_lines": len(lines),
            "showing": len(tail_lines),
            "lines": tail_lines,
        })
    return jsonify({"status": "error", "message": "AHK log file not found"})


@app.route("/api/logs", methods=["GET"])
def api_logs():
    """List all log and screenshot files."""
    files = []
    for f in sorted(LOG_DIR.iterdir(),
                    key=lambda p: p.stat().st_mtime, reverse=True):
        files.append({
            "name": f.name,
            "size": f.stat().st_size,
            "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            "path": str(f),
            "is_image": f.suffix.lower() in [".png", ".jpg", ".jpeg", ".bmp"],
        })
    return jsonify({"status": "ok", "files": files[:100]})


@app.route("/api/logs/<filename>", methods=["GET"])
def api_log_file(filename):
    """Serve a specific log/screenshot file."""
    file_path = LOG_DIR / filename
    if file_path.exists() and file_path.is_file():
        return send_file(str(file_path))
    return jsonify({"error": "File not found"}), 404


# ── Backward-compatible endpoints (no /api prefix) ──────────────────────
# These match the old kelvin_agent.py v4 API for frontend compatibility.

@app.route("/status", methods=["GET"])
def compat_status():
    return api_status()

@app.route("/run", methods=["POST"])
def compat_run():
    return api_run()

@app.route("/job", methods=["GET"])
def compat_job():
    return api_job()

@app.route("/results", methods=["GET"])
def compat_results():
    if current_job_id and current_job_id in jobs:
        return api_results(current_job_id)
    if jobs:
        latest = max(jobs.values(), key=lambda j: j["started_at"])
        return api_results(latest["id"])
    return jsonify({"status": "no_jobs"})

@app.route("/launch", methods=["POST"])
def compat_launch():
    return api_launch()

@app.route("/load", methods=["POST"])
def compat_load():
    return api_load()

@app.route("/simulate", methods=["POST"])
def compat_simulate():
    return api_simulate()

@app.route("/export", methods=["POST"])
def compat_export():
    return api_export()

@app.route("/screenshot", methods=["GET"])
def compat_screenshot():
    return api_screenshot()

@app.route("/log", methods=["GET"])
def compat_log():
    return api_log()

@app.route("/logs", methods=["GET"])
def compat_logs():
    return api_logs()


# ── Index page ───────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    """Serve a simple status page."""
    index_file = Path(__file__).parent / "kelvin_index.html"
    if index_file.exists():
        return send_file(str(index_file))
    return """
    <html>
    <head><title>Project Kelvin Agent v5.0</title></head>
    <body style="font-family: monospace; padding: 2em;">
        <h1>Project Kelvin Agent v5.0</h1>
        <p>AutoHotkey v2 + Python HTTP Server</p>
        <h2>Endpoints</h2>
        <ul>
            <li><a href="/api/status">GET /api/status</a> — Agent status</li>
            <li>POST /api/run — Start full pipeline (send INI)</li>
            <li><a href="/api/job">GET /api/job</a> — Current job status</li>
            <li>GET /api/results/{job_id} — Get results</li>
            <li>POST /api/launch — Manual: launch Celsius</li>
            <li>POST /api/load — Manual: load INI</li>
            <li>POST /api/simulate — Manual: run simulation</li>
            <li>POST /api/export — Manual: export results</li>
            <li>POST /api/click_tab — Manual: click a tab</li>
            <li><a href="/api/screenshot">GET /api/screenshot</a> — Take screenshot</li>
            <li><a href="/api/log">GET /api/log</a> — Python log</li>
            <li><a href="/api/ahk_log">GET /api/ahk_log</a> — AHK log</li>
            <li><a href="/api/logs">GET /api/logs</a> — All log files</li>
        </ul>
    </body>
    </html>
    """


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Entry Point                                                             ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def check_environment():
    """Check that required tools are available."""
    log.info("=" * 64)
    log.info(f"  Project Kelvin Agent v{AGENT_VERSION}")
    log.info(f"  Architecture: Python HTTP + AutoHotkey v2 UI automation")
    log.info(f"  Work dir: {WORK_DIR}")
    log.info(f"  Log file: {LOG_FILE}")
    log.info("=" * 64)

    # Check AHK
    if Path(AHK_EXE).exists():
        log.info(f"  AHK v2: {AHK_EXE} — OK")
    else:
        log.warning(f"  AHK v2: {AHK_EXE} — NOT FOUND")
        log.warning("  Install AutoHotkey v2 from https://www.autohotkey.com/")

    # Check AHK script
    if AHK_SCRIPT.exists():
        log.info(f"  AHK script: {AHK_SCRIPT} — OK")
    else:
        log.warning(f"  AHK script: {AHK_SCRIPT} — NOT FOUND")
        log.warning("  Place celsius_automation.ahk in the same directory as this script")

    log.info("")
    log.info(f"  Server will start on http://localhost:{AGENT_PORT}")
    log.info(f"  Pipeline: POST /api/run  (send INI, auto-run everything)")
    log.info(f"  Manual:   POST /api/launch, /api/load, /api/simulate, /api/export")
    log.info(f"  Debug:    GET /api/screenshot, /api/status, /api/job, /api/log")
    log.info("=" * 64)


if __name__ == "__main__":
    check_environment()
    log.info(f"Starting Flask server on port {AGENT_PORT} …")
    app.run(host="0.0.0.0", port=AGENT_PORT, debug=False, threaded=True)
