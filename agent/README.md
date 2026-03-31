# Project Kelvin Agent v5.0

This package provides the local automation agent for **Celsius Design v6.2d**. 

Due to the non-standard nature of LabVIEW UI controls, traditional Python automation libraries (like `pyautogui` and `pywinauto`) cannot reliably interact with the Celsius interface. This version (v5.0) completely replaces the Python-driven UI interaction with an **AutoHotkey v2** script, which has proven to be the only reliable method for driving this specific application.

The architecture consists of two parts:
1. **`celsius_automation.ahk`**: An AutoHotkey v2 script that handles all direct interaction with the Celsius window (clicking tabs, entering passwords, handling file dialogs).
2. **`kelvin_agent.py`**: A Python Flask HTTP server that receives requests from the Kelvin frontend and orchestrates the AHK script via command-line arguments.

---

## Prerequisites

### 1. Install AutoHotkey v2
You **must** install AutoHotkey v2 for the UI automation to work.
1. Download **AutoHotkey v2** from [autohotkey.com](https://www.autohotkey.com/).
2. Run the installer. Ensure it installs to the default location: `C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe`.

### 2. Install Python Dependencies
The Python agent requires Flask to run the HTTP server.
Open a command prompt or PowerShell and run:
```cmd
pip install flask
```

### 3. Screen Resolution & Window State
The AHK script uses absolute screen coordinates based on a **1920x1080** display (plus standard Windows taskbar). 
- The script automatically attempts to bring the Celsius window to the foreground and maximise it before interacting.
- If your display resolution is different, you may need to adjust the coordinates in `celsius_automation.ahk`.

---

## Running the Agent

1. Place both `kelvin_agent.py` and `celsius_automation.ahk` in the same directory.
2. Run the Python server:
```cmd
python kelvin_agent.py
```
3. The server will start on `http://localhost:5000` (or port 8765 if you modify the script configuration).

---

## How It Works

When the frontend sends a simulation request to the agent, the following pipeline executes:

1. **HTTP Request**: The frontend sends an INI file via `POST /api/run`.
2. **Python Orchestrator**: `kelvin_agent.py` saves the INI file and starts a background thread.
3. **Launch Phase**: Python calls `AutoHotkey64.exe celsius_automation.ahk launch`. AHK starts Celsius, waits for the password dialog, enters the password ("Go, Celsius, go!"), and maximises the window.
4. **Load Phase**: Python calls `AutoHotkey64.exe celsius_automation.ahk load_ini <path>`. AHK clicks the "Export and load" tab, clicks the folder icon, handles the Windows file dialog to load the INI, and clicks LOAD.
5. **Simulate Phase**: Python calls `AutoHotkey64.exe celsius_automation.ahk run_sim`. AHK clicks the "Well placement" tab, clicks "Optimize placement", and waits for completion.
6. **Export Phase**: Python calls `AutoHotkey64.exe celsius_automation.ahk export_results <path>`. AHK navigates back to "Export and load", handles the save dialog, and confirms the file creation.
7. **Result Delivery**: The frontend polls `GET /api/job` until complete, then fetches the final INI via `GET /api/results/<job_id>`.

### Logging and Debugging

The agent creates a working directory at `%USERPROFILE%\KelvinAgent` (usually `C:\Users\YourName\KelvinAgent`).
- **Logs**: Both Python and AHK write logs to `%USERPROFILE%\KelvinAgent\logs\`.
- **Screenshots**: The AHK script takes screenshots at every significant step (e.g., before/after clicking tabs, handling dialogs). These are saved in the logs directory. If the agent fails, check the screenshots to see what the screen looked like at the time of failure.
- **Status File**: AHK writes a temporary `ahk_status.json` file in the working directory to pass results back to Python.

---

## API Endpoints

The Python server exposes the following endpoints (available with or without the `/api` prefix for backward compatibility):

- `GET /api/status` — Check if AHK and the script are found.
- `POST /api/run` — Start the full automation pipeline (expects JSON: `{"ini": "..."}`).
- `GET /api/job` — Get the status of the current running job.
- `GET /api/results/<job_id>` — Retrieve the exported INI file content.
- `GET /api/logs` — List all logs and screenshots.

**Manual Control (for testing):**
- `POST /api/launch` — Start Celsius and unlock.
- `POST /api/load` — Load an INI file (expects `{"path": "..."}`).
- `POST /api/simulate` — Run the simulation.
- `POST /api/export` — Export results (expects `{"path": "..."}`).
- `POST /api/click_tab` — Click a specific tab (expects `{"tab": "Well placement"}`).
- `GET /api/screenshot` — Force a screenshot.
- `POST /api/close` — Close the Celsius application.
