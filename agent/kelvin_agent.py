"""
Project Kelvin — Local Agent for Celsius Design v6.2d Automation
=================================================================
v4.1 — Production rebuild using DIRECT MOUSE CLICKS at confirmed tab
       coordinates.  Python aiohttp async HTTP server + pyautogui.

Proven working approach (from v4.0 log analysis, 2026-03-30):
  - Password dialog found as separate window 'master_password.vi'
    with real rect (661, 507, 1260, 645) while main window shows (0,0,0,0).
  - Clipboard set via clip.exe → triple-click → Ctrl+V → Enter.
  - Tab clicks at confirmed screen-absolute X coords, Y swept 28–40.
  - Simulation completed in 101 s.
  - File dialogs handled via Alt+N → Ctrl+A → Ctrl+V → Enter.

Tab positions (screen-absolute, window maximised to 1920×1080+taskbar):
    Sub-surface:              x=40,  y=34
    Well placement:           x=113, y=34  ← CONFIRMED
    Building loads:           x=192, y=34  ← CONFIRMED
    Energy production:        x=271, y=34
    Heat pumps:               x=350, y=34
    Optimize length:          x=426, y=34
    Hourly plots:             x=500, y=34
    Results -Heat pump loads: x=593, y=34
    More results:             x=687, y=34
    Yearly results:           x=755, y=34
    Economics:                x=820, y=34
    Export and load:          x=889, y=34

Requirements:
    pip install pyautogui aiohttp pywinauto Pillow

Usage:
    python kelvin_agent.py
"""

import asyncio
import ctypes
import json
import logging
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
#  Third-party imports (graceful fallback so the module loads on non-Windows)
# ---------------------------------------------------------------------------
try:
    import pyautogui
    pyautogui.PAUSE = 0.25
    pyautogui.FAILSAFE = True   # Move mouse to top-left corner to abort
except ImportError:
    pyautogui = None

try:
    import win32gui
    import win32con
    import win32api
except ImportError:
    win32gui = win32con = win32api = None


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Configuration                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

AGENT_VERSION   = "4.1.0"
AGENT_PORT      = 8765
WORK_DIR        = Path.home() / "KelvinAgent"
INPUT_DIR       = WORK_DIR / "input"
OUTPUT_DIR      = WORK_DIR / "output"
LOG_DIR         = WORK_DIR / "logs"

CELSIUS_EXE      = r"C:\Planner\Celsius.design.v6.2d"
CELSIUS_PASSWORD = "Go, Celsius, go!"

# Window title regex — matches the main app, splash, and password dialog
TITLE_RE = r".*[Cc]elsius.*|.*master_password.*"

# ---------------------------------------------------------------------------
#  Confirmed tab positions (screen coords, window maximised to 1920×1080)
# ---------------------------------------------------------------------------
TAB_POSITIONS = {
    "Sub-surface":              40,
    "Well placement":           113,
    "Building loads":           192,
    "Energy production":        271,
    "Heat pumps":               350,
    "Optimize length":          426,
    "Hourly plots":             500,
    "Results -Heat pump loads": 593,
    "More results":             687,
    "Yearly results":           755,
    "Economics":                820,
    "Export and load":          889,
}
TAB_Y_VALUES = [28, 30, 32, 34, 36, 38, 40]

TAB_NAMES = list(TAB_POSITIONS.keys())
NUM_TABS  = len(TAB_NAMES)

# Simulation wait time (seconds)
SIMULATION_WAIT = 100

# Button positions (1920-px reference, unverified — agent tries a grid)
EXPORT_TAB_LOAD_FOLDER_ICON = (920, 370)
EXPORT_TAB_LOAD_BUTTON      = (1050, 370)
EXPORT_TAB_SAVE_FOLDER_ICON = (920, 280)
EXPORT_TAB_SAVE_BUTTON      = (1050, 280)

OPTIMIZE_BUTTON_CANDIDATES = [
    (160, 170),
    (160, 200),
    (160, 140),
    (200, 170),
    (120, 170),
    (160, 230),
]

# ---------------------------------------------------------------------------
#  Directory setup
# ---------------------------------------------------------------------------
for _d in [WORK_DIR, INPUT_DIR, OUTPUT_DIR, LOG_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
#  Logging
# ---------------------------------------------------------------------------
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
log.info(f"Log file: {LOG_FILE}")


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Window helpers                                                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def find_celsius_exe():
    """Locate the Celsius Design executable on disk."""
    base = Path(CELSIUS_EXE)
    for candidate in [base, base.with_suffix(".exe"), base.with_suffix(".vi")]:
        if candidate.exists():
            return str(candidate)
    planner = Path(r"C:\Planner")
    if planner.exists():
        for f in planner.iterdir():
            if "celsius" in f.name.lower() and "design" in f.name.lower():
                return str(f)
    return CELSIUS_EXE


def _find_all_windows(title_pattern=None):
    """Return list of (handle, title, rect, visible) for all matching windows.
    Uses win32gui.EnumWindows — the only reliable method for LabVIEW windows."""
    results = []
    pattern = re.compile(title_pattern or TITLE_RE, re.IGNORECASE)

    if not win32gui:
        log.warning("win32gui not available")
        return results

    def _cb(hwnd, _):
        try:
            if not win32gui.IsWindow(hwnd):
                return True
            title = win32gui.GetWindowText(hwnd)
            if not title or not pattern.search(title):
                return True
            rect = win32gui.GetWindowRect(hwnd)
            vis  = win32gui.IsWindowVisible(hwnd)
            results.append((hwnd, title, rect, vis))
            l, t, r, b = rect
            log.debug(f"  Window: '{title}' hwnd={hwnd} rect={rect} "
                      f"vis={vis} size={r-l}x{b-t}")
        except Exception:
            pass
        return True

    try:
        win32gui.EnumWindows(_cb, None)
    except Exception as e:
        log.warning(f"EnumWindows failed: {e}")

    # Fallback: pywinauto
    if not results:
        try:
            from pywinauto import findwindows
            for w in findwindows.find_elements(
                    title_re=title_pattern or TITLE_RE):
                h = w.handle
                try:
                    rect = win32gui.GetWindowRect(h) if win32gui else (0, 0, 0, 0)
                except Exception:
                    rect = (0, 0, 0, 0)
                results.append((h, w.name, rect, True))
        except Exception:
            pass

    return results


def _pick_best_handle(handles_info):
    """Return (handle, name, rect) for the largest visible window."""
    best, best_score = None, -1
    for item in handles_info:
        h, name, rect = item[0], item[1], item[2]
        vis = item[3] if len(item) > 3 else True
        l, t, r, b = rect
        area  = (r - l) * (b - t)
        score = area + (10_000_000 if vis else 0)
        if score > best_score:
            best_score = score
            best = (h, name, rect)
    return best


def get_celsius_handle():
    """Return (handle, name, clamped_rect) for the main Celsius window,
    or None if not found.

    The main Celsius window when maximised reports rect (-8, -8, 1928, 1160).
    We clamp negative values to 0 and cap at screen size so that pixel
    calculations based on the rect are always valid.
    """
    handles = _find_all_windows(TITLE_RE)
    best    = _pick_best_handle(handles)
    if not best:
        return None
    h, name, rect = best
    l, t, r, b = rect
    if (r - l) < 50 or (b - t) < 50:
        return None
    sw, sh  = pyautogui.size()
    clamped = (max(0, l), max(0, t), min(sw, r), min(sh, b))
    return h, name, clamped


def get_window_rect():
    """Return (left, top, right, bottom) for Celsius, clamped to screen."""
    info = get_celsius_handle()
    if info:
        return info[2]
    sw, sh = pyautogui.size()
    log.warning("Celsius window not found — using full screen as fallback")
    return (0, 0, sw, sh)


def force_foreground(handle):
    """Bring *handle* to the foreground using the AttachThreadInput trick.

    Critical: never uses SW_RESTORE (9) on a maximised window — that would
    un-maximise it.  Instead uses SW_SHOWMAXIMIZED (3) to keep it maximised.
    """
    if not win32gui or not handle:
        return
    try:
        user32  = ctypes.windll.user32
        fg_hwnd = user32.GetForegroundWindow()
        fg_tid  = user32.GetWindowThreadProcessId(fg_hwnd, None)
        tgt_tid = user32.GetWindowThreadProcessId(handle, None)

        user32.AttachThreadInput(tgt_tid, fg_tid, True)

        is_iconic = user32.IsIconic(handle)
        is_zoomed = user32.IsZoomed(handle)
        if is_iconic:
            win32gui.ShowWindow(handle, 9)   # SW_RESTORE (from minimised only)
            log.info("Window was minimised → restored")
        elif is_zoomed:
            win32gui.ShowWindow(handle, 3)   # SW_SHOWMAXIMIZED (keeps maximised)
            log.info("Window already maximised → kept maximised")
        else:
            win32gui.ShowWindow(handle, 5)   # SW_SHOW
            log.info("Window in normal state → shown")

        win32gui.BringWindowToTop(handle)
        win32gui.SetForegroundWindow(handle)
        user32.AttachThreadInput(tgt_tid, fg_tid, False)
        time.sleep(0.4)

        if user32.GetForegroundWindow() == handle:
            log.info("Confirmed: window is foreground")
        else:
            log.warning("Window may not be foreground — trying "
                        "SetForegroundWindow again")
            try:
                win32gui.SetForegroundWindow(handle)
                time.sleep(0.3)
            except Exception:
                pass
    except Exception as e:
        log.warning(f"force_foreground failed: {e}")


def ensure_maximized(handle=None):
    """Maximise the Celsius window if it is not already maximised."""
    if handle is None:
        info = get_celsius_handle()
        if not info:
            return
        handle = info[0]
    try:
        if not ctypes.windll.user32.IsZoomed(handle):
            log.warning("Window NOT maximised — re-maximising …")
            win32gui.ShowWindow(handle, 3)   # SW_MAXIMIZE
            time.sleep(0.6)
        else:
            log.debug("Window confirmed maximised")
    except Exception as e:
        log.warning(f"ensure_maximized error: {e}")


def bring_to_front(do_maximize=False):
    """Bring the main Celsius window to the foreground, optionally maximise."""
    info = get_celsius_handle()
    if not info:
        log.warning("No Celsius window found for bring_to_front")
        return None
    handle, name, rect = info
    force_foreground(handle)
    if do_maximize:
        ensure_maximized(handle)
    time.sleep(0.3)
    return handle


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Screenshot helper                                                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def take_screenshot(label="screenshot"):
    """Save a timestamped screenshot to LOG_DIR and return the path."""
    try:
        ts   = datetime.now().strftime("%H%M%S_%f")[:10]
        path = LOG_DIR / f"{label}_{ts}.png"
        pyautogui.screenshot(str(path))
        log.info(f"Screenshot [{label}]: {path}")
        return path
    except Exception as e:
        log.warning(f"Screenshot failed: {e}")
        return None


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Clipboard helper                                                        ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def set_clipboard(text):
    """Set the Windows clipboard via clip.exe (most reliable method).
    Falls back to PowerShell if clip.exe is unavailable."""
    try:
        subprocess.run(["clip"], input=text.encode("utf-8"),
                       check=True, timeout=5)
        log.info(f"Clipboard set via clip.exe ({len(text)} chars)")
    except Exception as e:
        log.warning(f"clip.exe failed: {e} — trying PowerShell")
        try:
            escaped = text.replace("'", "''")
            subprocess.run(
                ["powershell", "-command", f"Set-Clipboard '{escaped}'"],
                check=True, timeout=5,
            )
            log.info("Clipboard set via PowerShell")
        except Exception as e2:
            log.error(f"All clipboard methods failed: {e2}")
            raise


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Tab navigation — direct mouse clicks at confirmed screen coordinates   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

async def click_tab(tab_name: str):
    """Click the named tab using confirmed screen X coordinates.

    Strategy (proven working in v4.0 logs):
    1. Bring Celsius to front and ensure it is maximised.
    2. Look up the confirmed X position for the tab.
    3. Click at (tab_x, y) for each y in TAB_Y_VALUES (28 → 40).
       This sweeps the full height of the tab text row, guaranteeing a hit
       even if the exact pixel row varies slightly between runs.
    4. One final click at the canonical y=34.
    5. Take a verification screenshot.
    """
    if tab_name not in TAB_POSITIONS:
        raise ValueError(f"Unknown tab: '{tab_name}'. "
                         f"Valid names: {list(TAB_POSITIONS.keys())}")

    log.info(f"▸ Clicking tab: '{tab_name}'")

    # Ensure Celsius is foreground and maximised
    handle = bring_to_front(do_maximize=True)
    await asyncio.sleep(0.4)

    # Get window top-left offset (usually 0,0 when maximised, but be safe)
    rect  = get_window_rect()
    win_l = rect[0]   # usually 0
    win_t = rect[1]   # usually 0

    tab_x = win_l + TAB_POSITIONS[tab_name]

    # Sweep Y values to guarantee hitting the tab text
    for y_offset in TAB_Y_VALUES:
        tab_y = win_t + y_offset
        log.debug(f"  click ({tab_x}, {tab_y})")
        pyautogui.click(tab_x, tab_y)
        await asyncio.sleep(0.12)

    # One final click at the canonical confirmed Y=34
    pyautogui.click(tab_x, win_t + 34)
    await asyncio.sleep(0.5)

    take_screenshot(f"tab_{tab_name.replace(' ', '_').replace('-', '_')}")
    await asyncio.sleep(0.3)
    log.info(f"  ✓ Tab click sequence complete for '{tab_name}'")


async def click_tab_by_index(index: int):
    """Click a tab by its 0-based index."""
    if index < 0 or index >= NUM_TABS:
        raise ValueError(f"Tab index {index} out of range 0..{NUM_TABS-1}")
    await click_tab(TAB_NAMES[index])


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  CelsiusAutomation                                                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class CelsiusAutomation:
    """Controls Celsius Design using pyautogui mouse/keyboard automation.

    All UI interaction uses direct pyautogui.click() at screen-absolute
    coordinates.  Window management uses win32gui + ctypes for reliable
    foreground/maximize handling.
    """

    def __init__(self):
        self.celsius_path = find_celsius_exe()
        self.is_running   = False
        self.is_unlocked  = False
        log.info(f"Celsius path: {self.celsius_path}")

    def is_available(self):
        return self.celsius_path and Path(self.celsius_path).exists()

    def get_status(self):
        pyautogui_ok = pyautogui is not None
        try:
            import pywinauto
            pywinauto_ok = True
        except ImportError:
            pywinauto_ok = False
        return {
            "celsius_found":       self.is_available(),
            "celsius_path":        self.celsius_path,
            "pyautogui_installed": pyautogui_ok,
            "pywinauto_installed": pywinauto_ok,
            "is_running":          self.is_running,
            "is_unlocked":         self.is_unlocked,
            "work_dir":            str(WORK_DIR),
        }

    # ── coordinate helpers ────────────────────────────────────────────

    def _scale(self, px_x, px_y):
        """Scale a (px_x, px_y) reference coordinate (1920-px width) to
        actual window coordinates.  When maximised on a 1920-wide display
        this is essentially a no-op, but handles other resolutions."""
        left, top, right, bottom = get_window_rect()
        win_w = right - left
        scale = win_w / 1920.0
        return left + int(px_x * scale), top + int(px_y * scale)

    async def _click_at(self, px_x, px_y, label="click"):
        """Click at a 1920-ref pixel position with logging + screenshot."""
        ax, ay = self._scale(px_x, px_y)
        log.info(f"Clicking [{label}] at screen ({ax},{ay})  "
                 f"[ref ({px_x},{px_y})]")
        pyautogui.click(ax, ay)
        await asyncio.sleep(0.8)
        take_screenshot(f"after_{label}")

    async def _click_candidates(self, candidates, label="button",
                                check_dialog=False, dialog_timeout=2.0):
        """Try clicking a list of (px_x, px_y) reference positions.

        If *check_dialog* is True, stop early when a file dialog appears.
        Each attempt is logged and screenshotted for debugging.

        The candidate grid pattern (from v4 logs):
          center, center-20y, center+20y, center-20x, center+20x,
          center-40x, center+40x, center-40y, center+40y
        """
        for i, (px_x, px_y) in enumerate(candidates):
            ax, ay = self._scale(px_x, px_y)
            log.info(f"Clicking [{label}] attempt {i+1}/{len(candidates)} "
                     f"at screen ({ax},{ay})  [ref ({px_x},{px_y})]")
            pyautogui.click(ax, ay)
            await asyncio.sleep(dialog_timeout if check_dialog else 0.8)
            take_screenshot(f"{label}_attempt_{i+1}")
            if check_dialog and self._file_dialog_visible():
                log.info(f"File dialog detected after attempt {i+1}")
                return True
        return False

    def _file_dialog_visible(self):
        """Return True if a standard Windows file dialog is currently open.
        Checks for the #32770 dialog class and common dialog title keywords."""
        found = False

        def _cb(hwnd, _):
            nonlocal found
            try:
                if not win32gui.IsWindowVisible(hwnd):
                    return True
                title = win32gui.GetWindowText(hwnd).lower()
                cls   = win32gui.GetClassName(hwnd)
                if any(kw in title for kw in
                       ["open", "save", "browse", "select folder",
                        "file name"]):
                    found = True
                    return False
                if cls == "#32770":   # standard Windows dialog class
                    found = True
                    return False
            except Exception:
                pass
            return True

        if win32gui:
            try:
                win32gui.EnumWindows(_cb, None)
            except Exception:
                pass
        return found

    # ── password dialog ───────────────────────────────────────────────

    def _find_password_dialog(self):
        """Find the master_password.vi dialog window.

        The password dialog is a SEPARATE window from the main Celsius window.
        It has a real rect like (661, 507, 1260, 645) = 599×138 while the
        main window may report (0,0,0,0).

        Returns (handle, rect) or (None, None).
        """
        dialogs = []

        def _cb(hwnd, _):
            try:
                if not win32gui.IsWindowVisible(hwnd):
                    return True
                title = win32gui.GetWindowText(hwnd)
                rect  = win32gui.GetWindowRect(hwnd)
                l, t, r, b = rect
                w, h = r - l, b - t
                tl   = title.lower()
                is_pwd  = any(kw in tl for kw in
                              ["master_password", "password", "unlock",
                               "celsius", "go,"])
                is_small = 100 < w < 800 and 50 < h < 400
                if title and (is_pwd or is_small):
                    dialogs.append((hwnd, title, rect, w, h))
                    log.debug(f"  Dialog candidate: '{title}' "
                              f"hwnd={hwnd} {w}x{h}")
            except Exception:
                pass
            return True

        if win32gui:
            try:
                win32gui.EnumWindows(_cb, None)
            except Exception:
                pass

        # Prefer windows with password-specific keywords
        for hwnd, title, rect, w, h in dialogs:
            tl = title.lower()
            if any(kw in tl for kw in
                   ["master_password", "password", "unlock"]):
                log.info(f"Password dialog: '{title}' rect={rect}")
                return hwnd, rect

        # Fallback: any small Celsius-related window
        for hwnd, title, rect, w, h in dialogs:
            tl = title.lower()
            if any(kw in tl for kw in ["celsius", "go,"]):
                if w < 800 and h < 400:
                    log.info(f"Probable password dialog: '{title}' rect={rect}")
                    return hwnd, rect

        return None, None

    async def _enter_password(self):
        """Enter the master password into the Celsius password dialog.

        Confirmed working approach (from v4.0 logs):
        1. Set clipboard with the password FIRST (before any window switching).
        2. Find the password dialog via EnumWindows.
        3. force_foreground() with AttachThreadInput to bring it to front.
        4. Click the password field at 45% from left, 35% from top of dialog.
        5. Triple-click to select all existing text.
        6. Ctrl+V to paste from clipboard.
        7. Press Enter to submit.

        No character-by-character backup — it appended duplicate text.
        """
        await asyncio.sleep(2)
        take_screenshot("before_password")

        # ── 1. Set clipboard FIRST ──────────────────────────────────────
        log.info("Setting clipboard with password …")
        set_clipboard(CELSIUS_PASSWORD)
        await asyncio.sleep(0.3)

        # ── 2. Find the password dialog ─────────────────────────────────
        dialog_handle, dialog_rect = self._find_password_dialog()

        # Retry up to 5 times if not found yet
        for attempt in range(5):
            if dialog_handle:
                break
            log.info(f"Password dialog not found yet, "
                     f"retrying ({attempt+1}/5) …")
            await asyncio.sleep(1.5)
            dialog_handle, dialog_rect = self._find_password_dialog()

        # ── 3. Bring dialog to front ────────────────────────────────────
        if dialog_handle:
            log.info(f"Password dialog found: hwnd={dialog_handle} "
                     f"rect={dialog_rect}")
            force_foreground(dialog_handle)
            await asyncio.sleep(0.5)
        else:
            log.warning("Password dialog not found — "
                        "using screen-centre fallback")

        take_screenshot("password_dialog_focused")

        # ── 4. Determine field coordinates ──────────────────────────────
        if dialog_rect:
            l, t, r, b = dialog_rect
            dlg_w, dlg_h = r - l, b - t
            # Confirmed: field at 45% from left, 35% from top
            field_x = l + int(dlg_w * 0.45)
            field_y = t + int(dlg_h * 0.35)
        else:
            # Fallback: assume dialog centred on screen
            sw, sh  = pyautogui.size()
            field_x = sw // 2
            field_y = sh // 2 - 10

        log.info(f"Password field target: ({field_x}, {field_y})")

        # ── 5. Click the password field ──────────────────────────────────
        pyautogui.click(field_x, field_y)
        await asyncio.sleep(0.4)

        # ── 6. Triple-click to select all existing text ──────────────────
        log.info("Triple-clicking to select all …")
        pyautogui.click(field_x, field_y, clicks=3, interval=0.1)
        await asyncio.sleep(0.3)

        # ── 7. Paste password ────────────────────────────────────────────
        log.info("Pasting password via Ctrl+V …")
        pyautogui.hotkey("ctrl", "v")
        await asyncio.sleep(0.8)
        take_screenshot("after_paste_password")

        # ── 8. Submit with Enter ─────────────────────────────────────────
        log.info("Pressing Enter to submit password …")
        pyautogui.press("enter")
        await asyncio.sleep(3)
        take_screenshot("after_enter_password")

        # ── 9. Check if dialog is still open (wrong password?) ───────────
        still_open, _ = self._find_password_dialog()
        if still_open:
            log.warning("Password dialog still visible after Enter — "
                        "pressing Enter again and Escape …")
            force_foreground(still_open)
            await asyncio.sleep(0.3)
            pyautogui.press("enter")
            await asyncio.sleep(1)
            pyautogui.press("escape")
            await asyncio.sleep(1)

        self.is_unlocked = True
        log.info("Password entry complete")

    # ── launch ────────────────────────────────────────────────────────

    async def launch_and_unlock(self):
        """Launch Celsius Design and handle the password dialog."""
        # Check if already running
        info = get_celsius_handle()
        if info:
            handle, name, rect = info
            log.info(f"Celsius already running: '{name}'")
            force_foreground(handle)
            self.is_running = True
            await asyncio.sleep(1)
        else:
            if not self.is_available():
                return {"status": "error",
                        "message": f"Celsius not found at {self.celsius_path}"}
            log.info(f"Launching: {self.celsius_path}")
            try:
                os.startfile(self.celsius_path)
            except Exception as e:
                log.error(f"Launch failed: {e}")
                return {"status": "error", "message": str(e)}

            # Wait for window to appear (up to 60 s)
            log.info("Waiting for Celsius window …")
            for i in range(60):
                await asyncio.sleep(1)
                info = get_celsius_handle()
                if info:
                    log.info(f"Window found after {i+1}s")
                    break
            else:
                return {"status": "error",
                        "message": "Timeout: Celsius window not found "
                                   "after 60 s"}

            force_foreground(info[0])
            self.is_running = True
            await asyncio.sleep(2)

        # Handle password dialog
        log.info("Handling password dialog …")
        await self._enter_password()

        # Bring main window to front and maximise
        await asyncio.sleep(2)
        handle = bring_to_front(do_maximize=True)
        await asyncio.sleep(1)
        ensure_maximized(handle)
        take_screenshot("after_launch_maximized")

        return {"status": "success",
                "message": "Celsius launched and unlocked"}

    # ── file dialog ───────────────────────────────────────────────────

    async def _browse_and_select_file(self, file_path):
        """Handle a standard Windows Open / Save file dialog.

        Uses Alt+N to focus the filename field, Ctrl+A to select all,
        pastes the path via clipboard, and presses Enter to confirm.
        A second Enter handles any confirmation prompt.
        """
        await asyncio.sleep(1.5)
        log.info(f"File dialog: selecting '{file_path}'")
        take_screenshot("file_dialog_opened")

        # Focus filename field with Alt+N
        log.info("Focusing filename field with Alt+N …")
        pyautogui.hotkey("alt", "n")
        await asyncio.sleep(0.5)

        # Select all and paste path
        pyautogui.hotkey("ctrl", "a")
        await asyncio.sleep(0.15)
        set_clipboard(str(file_path))
        await asyncio.sleep(0.3)
        pyautogui.hotkey("ctrl", "v")
        await asyncio.sleep(0.5)
        log.info(f"Pasted path: {file_path}")
        take_screenshot("file_dialog_path_pasted")

        # Confirm
        pyautogui.press("enter")
        await asyncio.sleep(1.5)
        # Second Enter in case of a confirmation prompt ("overwrite?")
        pyautogui.press("enter")
        await asyncio.sleep(1)
        log.info("File dialog interaction complete")

    # ── Load INI ──────────────────────────────────────────────────────

    async def load_ini_file(self, ini_path):
        """Load an INI file into Celsius via the 'Export and load' tab.

        Steps (from v4 logs):
        1. Click 'Export and load' tab (x=889, y sweep 28-40)
        2. Click the Load config folder icon → Windows file dialog
        3. Select the INI file via Alt+N, Ctrl+V, Enter
        4. Click the LOAD button
        """
        log.info(f"═══ LOAD INI: {ini_path} ═══")
        bring_to_front()
        await asyncio.sleep(0.3)
        ensure_maximized()
        await asyncio.sleep(0.3)

        try:
            # Step 1: Navigate to "Export and load" tab
            await click_tab("Export and load")
            await asyncio.sleep(1)

            # Step 2: Click the folder icon for "Load config file"
            # Grid: center, ±20y, ±20x, ±40x, ±40y
            load_folder_candidates = [
                EXPORT_TAB_LOAD_FOLDER_ICON,        # (920, 370)
                (920, 350), (920, 390),
                (900, 370), (940, 370),
                (880, 370), (960, 370),
                (920, 330), (920, 410),
            ]
            dialog_opened = await self._click_candidates(
                load_folder_candidates,
                label="load_folder_icon",
                check_dialog=True,
                dialog_timeout=2.0,
            )
            if not dialog_opened:
                log.warning("File dialog did not open — proceeding anyway")

            # Step 3: Handle file dialog
            await self._browse_and_select_file(ini_path)
            await asyncio.sleep(2)

            # Step 4: Click the LOAD button
            load_btn_candidates = [
                EXPORT_TAB_LOAD_BUTTON,             # (1050, 370)
                (1050, 350), (1050, 390),
                (1030, 370), (1070, 370),
                (1080, 370), (1020, 370),
                (1050, 330), (1050, 410),
            ]
            await self._click_candidates(
                load_btn_candidates, label="load_button")
            await asyncio.sleep(3)
            take_screenshot("after_load_ini")

            log.info("INI load sequence completed")
            return {"status": "success",
                    "message": f"Loaded {ini_path}"}

        except Exception as e:
            log.error(f"Load INI failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}

    # ── Simulate ──────────────────────────────────────────────────────

    async def run_simulation(self):
        """Run the simulation by clicking 'Optimize placement' on the
        'Well placement' tab.

        Steps (from v4 logs):
        1. Click 'Well placement' tab (x=113, y sweep 28-40)
        2. Click the Optimize placement button (6 candidate positions)
        3. Wait ~100 s for completion, taking screenshots every 15 s
        """
        log.info("═══ RUN SIMULATION ═══")
        bring_to_front()
        await asyncio.sleep(0.3)
        ensure_maximized()
        await asyncio.sleep(0.3)

        try:
            # Step 1: Navigate to "Well placement" tab
            await click_tab("Well placement")
            await asyncio.sleep(1)

            # Step 2: Click "Optimize placement" button
            log.info("Clicking Optimize placement button candidates …")
            await self._click_candidates(
                OPTIMIZE_BUTTON_CANDIDATES,
                label="optimize_placement",
            )

            # Step 3: Wait for simulation
            log.info(f"Waiting {SIMULATION_WAIT}s for simulation …")
            start = time.time()
            for i in range(SIMULATION_WAIT):
                await asyncio.sleep(1)
                elapsed = int(time.time() - start)
                if elapsed % 15 == 0 and elapsed > 0:
                    log.info(f"  Simulation running … {elapsed}s elapsed")
                    take_screenshot(f"sim_progress_{elapsed}s")

            elapsed_total = int(time.time() - start)
            take_screenshot("sim_complete")
            await asyncio.sleep(2)

            return {"status": "success",
                    "message": f"Simulation completed in {elapsed_total}s"}

        except Exception as e:
            log.error(f"Simulation failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}

    # ── Export results ────────────────────────────────────────────────

    async def export_results(self, output_path):
        """Export results INI from Celsius.

        Steps (from v4 logs):
        1. Click 'Export and load' tab (x=889, y sweep 28-40)
        2. Click the Export config folder icon → Windows Save dialog
        3. Set the output path via Alt+N, Ctrl+V, Enter
        4. Click the SAVE button
        5. Verify the file was created
        """
        log.info(f"═══ EXPORT RESULTS → {output_path} ═══")
        bring_to_front()
        await asyncio.sleep(0.3)
        ensure_maximized()
        await asyncio.sleep(0.3)

        try:
            # Step 1: Navigate to "Export and load" tab
            await click_tab("Export and load")
            await asyncio.sleep(1)

            # Step 2: Click the folder icon for "Export config file"
            export_folder_candidates = [
                EXPORT_TAB_SAVE_FOLDER_ICON,        # (920, 280)
                (920, 260), (920, 300),
                (900, 280), (940, 280),
                (880, 280), (960, 280),
                (920, 240), (920, 320),
            ]
            dialog_opened = await self._click_candidates(
                export_folder_candidates,
                label="export_folder_icon",
                check_dialog=True,
                dialog_timeout=2.0,
            )
            if not dialog_opened:
                log.warning("Save dialog did not open — proceeding anyway")

            # Step 3: Handle Save dialog
            await self._browse_and_select_file(output_path)
            await asyncio.sleep(2)

            # Step 4: Click the SAVE button
            save_btn_candidates = [
                EXPORT_TAB_SAVE_BUTTON,             # (1050, 280)
                (1050, 260), (1050, 300),
                (1030, 280), (1070, 280),
                (1080, 280), (1020, 280),
                (1050, 240), (1050, 320),
            ]
            await self._click_candidates(
                save_btn_candidates, label="save_button")
            await asyncio.sleep(3)
            take_screenshot("after_export")

            # Step 5: Verify file was created
            for ext in ["", ".ini"]:
                p = Path(str(output_path) + ext)
                if p.exists():
                    log.info(f"Results exported: {p}")
                    return {"status": "success", "path": str(p)}

            return {"status": "warning",
                    "message": "Export sent but file not confirmed",
                    "path": str(output_path)}

        except Exception as e:
            log.error(f"Export failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  HTTP Server (aiohttp)                                                   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class KelvinAgentServer:
    """Async HTTP server bridging the Kelvin frontend to Celsius automation.

    Endpoints:
        GET  /status      — agent + environment status
        POST /run         — start full pipeline (accepts INI content)
        GET  /job         — current job status
        GET  /results     — exported INI content
        POST /launch      — manual: launch + unlock
        POST /load        — manual: load INI
        POST /simulate    — manual: run simulation
        POST /export      — manual: export results
        GET  /screenshot  — take a screenshot
        GET  /log         — tail of the log file
        GET  /logs        — list all log/screenshot files
    """

    CORS = {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    def __init__(self):
        self.celsius     = CelsiusAutomation()
        self.current_job = None

    async def handle_http(self, request):
        import aiohttp.web as web

        path    = request.path
        headers = dict(self.CORS)

        # CORS preflight
        if request.method == "OPTIONS":
            return web.Response(status=200, headers=headers)

        # ── GET /status ──────────────────────────────────────────────
        if path == "/status":
            status = self.celsius.get_status()
            status["agent_version"] = AGENT_VERSION
            status["current_job"]   = self.current_job
            return web.json_response(status, headers=headers)

        # ── POST /run ────────────────────────────────────────────────
        if path == "/run" and request.method == "POST":
            try:
                data        = await request.json()
                ini_content = data.get("ini", "")
                job_id      = data.get("job_id",
                                       datetime.now().strftime("%Y%m%d_%H%M%S"))
                if not ini_content:
                    return web.json_response(
                        {"error": "No INI content"},
                        status=400, headers=headers)

                ini_path = INPUT_DIR / f"kelvin_{job_id}.ini"
                ini_path.write_text(ini_content, encoding="utf-8")
                log.info(f"Received INI ({len(ini_content)} chars) → "
                         f"{ini_path}")

                self.current_job = {
                    "id":         job_id,
                    "status":     "starting",
                    "ini_path":   str(ini_path),
                    "started_at": datetime.now().isoformat(),
                    "steps":      [],
                }
                asyncio.create_task(self._run_pipeline(job_id, ini_path))
                return web.json_response(
                    {"status": "accepted", "job_id": job_id},
                    headers=headers)
            except Exception as e:
                return web.json_response(
                    {"error": str(e)}, status=500, headers=headers)

        # ── GET /job ─────────────────────────────────────────────────
        if path == "/job":
            if not self.current_job:
                return web.json_response(
                    {"status": "no_job"}, headers=headers)
            return web.json_response(self.current_job, headers=headers)

        # ── GET /results ─────────────────────────────────────────────
        if path == "/results":
            if not self.current_job or \
                    self.current_job["status"] != "complete":
                return web.json_response(
                    {"status": "not_ready"}, headers=headers)
            result_path = self.current_job.get("result_path")
            if result_path and Path(result_path).exists():
                content = Path(result_path).read_text(encoding="utf-8")
                return web.json_response({
                    "status":      "complete",
                    "ini_content": content,
                    "job_id":      self.current_job["id"],
                }, headers=headers)
            return web.json_response({
                "status":  "error",
                "message": "Result file not found",
            }, headers=headers)

        # ── Manual step endpoints ────────────────────────────────────
        if path == "/launch" and request.method == "POST":
            result = await self.celsius.launch_and_unlock()
            return web.json_response(result, headers=headers)

        if path == "/load" and request.method == "POST":
            data   = await request.json()
            result = await self.celsius.load_ini_file(
                data.get("path", ""))
            return web.json_response(result, headers=headers)

        if path == "/simulate" and request.method == "POST":
            result = await self.celsius.run_simulation()
            return web.json_response(result, headers=headers)

        if path == "/export" and request.method == "POST":
            data   = await request.json()
            result = await self.celsius.export_results(
                data.get("path", str(OUTPUT_DIR / "results")))
            return web.json_response(result, headers=headers)

        if path == "/screenshot" and request.method == "GET":
            try:
                ss = take_screenshot("manual")
                return web.json_response(
                    {"status": "ok", "path": str(ss)}, headers=headers)
            except Exception as e:
                return web.json_response(
                    {"error": str(e)}, headers=headers)

        if path == "/log" and request.method == "GET":
            try:
                tail = int(request.query.get("tail", 200))
                if LOG_FILE.exists():
                    lines      = LOG_FILE.read_text(
                        encoding="utf-8").splitlines()
                    tail_lines = (lines[-tail:]
                                  if len(lines) > tail else lines)
                    return web.json_response({
                        "status":      "ok",
                        "log_file":    str(LOG_FILE),
                        "total_lines": len(lines),
                        "showing":     len(tail_lines),
                        "lines":       tail_lines,
                    }, headers=headers)
                return web.json_response({
                    "status":  "error",
                    "message": "Log file not found",
                }, headers=headers)
            except Exception as e:
                return web.json_response(
                    {"error": str(e)}, headers=headers)

        if path == "/logs" and request.method == "GET":
            try:
                files = []
                for f in sorted(LOG_DIR.iterdir(),
                                key=lambda p: p.stat().st_mtime,
                                reverse=True):
                    files.append({
                        "name":     f.name,
                        "size":     f.stat().st_size,
                        "modified": datetime.fromtimestamp(
                            f.stat().st_mtime).isoformat(),
                        "path":     str(f),
                    })
                return web.json_response(
                    {"status": "ok", "files": files[:50]},
                    headers=headers)
            except Exception as e:
                return web.json_response(
                    {"error": str(e)}, headers=headers)

        return web.json_response(
            {"error": "Not found"}, status=404, headers=headers)

    # ── full pipeline ─────────────────────────────────────────────────

    async def _run_pipeline(self, job_id, ini_path):
        """Full automation pipeline: launch → load INI → simulate → export.

        Runs as an asyncio task.  Updates self.current_job at each step
        so the frontend can poll /job for progress.
        """

        def step(name, status, message=""):
            entry = {"name": name, "status": status, "message": message,
                     "time": datetime.now().isoformat()}
            self.current_job["steps"].append(entry)
            self.current_job["status"] = f"{name}: {status}"
            log.info(f"[{job_id}] {name}: {status} — {message}")

        try:
            # 1. Launch & Unlock
            step("launch", "running", "Launching Celsius Design …")
            result = await self.celsius.launch_and_unlock()
            if result["status"] == "error":
                step("launch", "failed", result["message"])
                self.current_job["status"] = "failed"
                return
            step("launch", "done", result["message"])

            # 2. Load INI
            step("load_ini", "running",
                 f"Loading {Path(ini_path).name} …")
            result = await self.celsius.load_ini_file(str(ini_path))
            if result["status"] == "error":
                step("load_ini", "failed", result["message"])
                self.current_job["status"] = "failed"
                return
            step("load_ini", "done", result["message"])

            # 3. Run Simulation
            step("simulate", "running",
                 "Running thermal simulation …")
            result = await self.celsius.run_simulation()
            if result["status"] == "error":
                step("simulate", "failed", result["message"])
                self.current_job["status"] = "failed"
                return
            step("simulate", "done", result["message"])

            # 4. Export Results
            output_path = OUTPUT_DIR / f"results_{job_id}"
            step("export", "running",
                 f"Exporting to {output_path} …")
            result = await self.celsius.export_results(str(output_path))

            result_file = None
            for ext in [".ini", ""]:
                p = Path(str(output_path) + ext)
                if p.exists():
                    result_file = p
                    break

            if result_file:
                self.current_job["result_path"] = str(result_file)
                step("export", "done", f"Saved: {result_file}")
            else:
                step("export", "warning",
                     "Export sent but file not confirmed")
                self.current_job["result_path"] = \
                    str(output_path) + ".ini"

            self.current_job["status"]       = "complete"
            self.current_job["completed_at"] = datetime.now().isoformat()
            log.info(f"[{job_id}] Pipeline complete!")

        except Exception as e:
            step("error", "failed", str(e))
            self.current_job["status"] = "failed"
            log.error(f"[{job_id}] Pipeline exception: {e}", exc_info=True)

    # ── server start ──────────────────────────────────────────────────

    async def start(self):
        import aiohttp.web as web

        app = web.Application()
        for route in ["/status", "/run", "/job", "/results",
                      "/launch", "/load", "/simulate", "/export",
                      "/screenshot", "/log", "/logs"]:
            app.router.add_route("*", route, self.handle_http)

        runner = web.AppRunner(app, access_log=log)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", AGENT_PORT)
        await site.start()

        log.info("=" * 64)
        log.info(f"  Project Kelvin Agent v{AGENT_VERSION} "
                 f"(confirmed tab click coords)")
        log.info(f"  Server: http://localhost:{AGENT_PORT}")
        log.info(f"  Celsius: {self.celsius.celsius_path}")
        log.info(f"  Work dir: {WORK_DIR}")
        log.info("")
        log.info(f"  Tab navigation: direct mouse click at confirmed "
                 f"X coords")
        log.info(f"  Y sweep: {TAB_Y_VALUES} px from window top")
        log.info("")
        log.info(f"  Pipeline: POST /run  (send INI, auto-run everything)")
        log.info(f"  Manual:   POST /launch, /load, /simulate, /export")
        log.info(f"  Debug:    GET /screenshot, /status, /job, /results")
        log.info(f"            GET /log?tail=N, /logs")
        log.info("=" * 64)

        # Keep the server running
        while True:
            await asyncio.sleep(1)


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Entry point                                                             ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def check_deps():
    """Verify required packages are installed."""
    missing = []
    for pkg in ["pyautogui", "aiohttp", "pywinauto"]:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        log.warning(f"Missing packages: {', '.join(missing)}")
        log.warning(f"Run: pip install {' '.join(missing)}")
        if "aiohttp" in missing:
            log.error("aiohttp is required. Exiting.")
            sys.exit(1)
        if "pyautogui" in missing:
            log.error("pyautogui is required. "
                      "Run: pip install pyautogui Pillow")
            sys.exit(1)


if __name__ == "__main__":
    log.info(f"Project Kelvin Agent v{AGENT_VERSION} starting …")
    check_deps()
    server = KelvinAgentServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        log.info("Agent stopped by user")
    except Exception as e:
        log.error(f"Agent failed: {e}", exc_info=True)
        sys.exit(1)
