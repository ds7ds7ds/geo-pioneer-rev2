"""
Project Kelvin — Local Agent for Celsius Design v6.2d Automation
=================================================================
Rewritten v3.0 — Uses Ctrl+Tab / Ctrl+Shift+Tab keyboard cycling for ALL
tab navigation.  LabVIEW tab controls do NOT respond to mouse clicks via
pyautogui, win32api.SendMessage, or PostMessage.

Requirements:
    pip install pyautogui aiohttp pywinauto Pillow

Usage:
    python kelvin_agent.py
"""

import asyncio
import json
import os
import re
import sys
import time
import subprocess
import logging
import ctypes
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
#  Third-party imports (with graceful fallback)
# ---------------------------------------------------------------------------
try:
    import pyautogui
    pyautogui.PAUSE = 0.25
    pyautogui.FAILSAFE = True  # Move mouse to top-left corner to abort
except ImportError:
    pyautogui = None

try:
    import win32gui
    import win32con
    import win32api
except ImportError:
    win32gui = None
    win32con = None
    win32api = None

# ---------------------------------------------------------------------------
#  Configuration
# ---------------------------------------------------------------------------
AGENT_PORT = 8765
WORK_DIR = Path.home() / "KelvinAgent"
INPUT_DIR = WORK_DIR / "input"
OUTPUT_DIR = WORK_DIR / "output"
LOG_DIR = WORK_DIR / "logs"

CELSIUS_EXE = r"C:\Planner\Celsius.design.v6.2d"
CELSIUS_PASSWORD = "Go, Celsius, go!"

TITLE_RE = r".*[Cc]elsius.*|.*master_password.*"

# Tab order (0-indexed) — the ONLY reliable way to navigate is Ctrl+Tab
TAB_NAMES = [
    "Sub-surface",                  # 0
    "Well placement",               # 1
    "Building loads",               # 2
    "Energy production",            # 3
    "Heat pumps",                   # 4
    "Optimize length",              # 5
    "Hourly plots",                 # 6
    "Results -Heat pump loads",     # 7
    "More results",                 # 8
    "Yearly results",               # 9
    "Economics",                    # 10
    "Export and load",              # 11
]
NUM_TABS = len(TAB_NAMES)

# Password dialog specifics
PASSWORD_DIALOG_TITLE = "master_password"

# Simulation wait (seconds)
SIMULATION_WAIT = 100

# Unverified button positions (1920-px reference, will be scaled)
# These are best-guess estimates — the agent takes screenshots to verify.
EXPORT_TAB_LOAD_FOLDER_ICON = (920, 370)
EXPORT_TAB_LOAD_BUTTON       = (1050, 370)
EXPORT_TAB_SAVE_FOLDER_ICON  = (920, 280)
EXPORT_TAB_SAVE_BUTTON        = (1050, 280)

# Multiple candidate positions for "Optimize placement" button
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
for d in [WORK_DIR, INPUT_DIR, OUTPUT_DIR, LOG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

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
    pattern = re.compile(title_pattern or r".*[Cc]elsius.*", re.IGNORECASE)

    if not win32gui:
        log.warning("win32gui not available, cannot enumerate windows")
        return results

    def _enum_callback(hwnd, _):
        try:
            if not win32gui.IsWindow(hwnd):
                return True
            title = win32gui.GetWindowText(hwnd)
            if not title or not pattern.search(title):
                return True
            rect = win32gui.GetWindowRect(hwnd)
            visible = win32gui.IsWindowVisible(hwnd)
            results.append((hwnd, title, rect, visible))
            l, t, r, b = rect
            log.debug(f"  Window: '{title}' hwnd={hwnd} rect={rect} "
                       f"visible={visible} size={r-l}x{b-t}")
        except Exception:
            pass
        return True

    try:
        win32gui.EnumWindows(_enum_callback, None)
    except Exception as e:
        log.warning(f"EnumWindows failed: {e}")

    # Fallback: pywinauto
    if not results:
        try:
            from pywinauto import findwindows
            for w in findwindows.find_elements(
                    title_re=title_pattern or r".*[Cc]elsius.*"):
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
    """Pick the largest visible window from a list."""
    best, best_score = None, -1
    for item in handles_info:
        h, name, rect = item[0], item[1], item[2]
        visible = item[3] if len(item) > 3 else True
        l, t, r, b = rect
        area = (r - l) * (b - t)
        score = area + (10_000_000 if visible else 0)
        if score > best_score:
            best_score = score
            best = (h, name, rect)
    return best


def get_celsius_handle():
    """Return (handle, name, clamped_rect) for the main Celsius window, or None."""
    handles = _find_all_windows(TITLE_RE)
    best = _pick_best_handle(handles)
    if not best:
        return None
    h, name, rect = best
    l, t, r, b = rect
    if (r - l) < 50 or (b - t) < 50:
        return None
    sw, sh = pyautogui.size()
    clamped = (max(0, l), max(0, t), min(sw, r), min(sh, b))
    return h, name, clamped


def get_window_rect():
    """Return (left, top, right, bottom) for Celsius, clamped to screen."""
    info = get_celsius_handle()
    if info:
        _, _, rect = info
        return rect
    sw, sh = pyautogui.size()
    log.warning("Celsius window not found — using full screen as fallback")
    return (0, 0, sw, sh)


def _ensure_foreground(handle):
    """Bring *handle* to the foreground using AttachThreadInput trick.
    NEVER uses SW_RESTORE (9) which un-maximizes a maximized window."""
    if not win32gui or not handle:
        return
    try:
        user32 = ctypes.windll.user32
        fg_hwnd = user32.GetForegroundWindow()
        fg_tid = user32.GetWindowThreadProcessId(fg_hwnd, None)
        tgt_tid = user32.GetWindowThreadProcessId(handle, None)

        user32.AttachThreadInput(tgt_tid, fg_tid, True)

        is_iconic = user32.IsIconic(handle)
        is_zoomed = user32.IsZoomed(handle)
        if is_iconic:
            win32gui.ShowWindow(handle, 9)   # SW_RESTORE (from minimised)
            log.info("Window was minimised → restored")
        elif is_zoomed:
            win32gui.ShowWindow(handle, 3)   # SW_SHOWMAXIMIZED (keeps max)
            log.info("Window already maximised → kept maximised")
        else:
            win32gui.ShowWindow(handle, 5)   # SW_SHOW
            log.info("Window in normal state → shown")

        win32gui.BringWindowToTop(handle)
        win32gui.SetForegroundWindow(handle)
        user32.AttachThreadInput(tgt_tid, fg_tid, False)
        time.sleep(0.4)

        if user32.GetForegroundWindow() == handle:
            log.info("Confirmed: Celsius is foreground")
        else:
            log.warning("Celsius may not be foreground — trying Alt method")
            pyautogui.hotkey("alt", "tab")
            time.sleep(0.6)
            try:
                win32gui.SetForegroundWindow(handle)
            except Exception:
                pass
    except Exception as e:
        log.warning(f"_ensure_foreground failed: {e}")


def _ensure_maximized(handle=None):
    """Make sure the Celsius window is maximized.  Re-maximize if needed."""
    if handle is None:
        info = get_celsius_handle()
        if not info:
            return
        handle = info[0]
    try:
        if not ctypes.windll.user32.IsZoomed(handle):
            log.warning("Window NOT maximised — re-maximising …")
            win32gui.ShowWindow(handle, 3)  # SW_MAXIMIZE
            time.sleep(0.5)
        else:
            log.debug("Window confirmed maximised")
    except Exception as e:
        log.warning(f"_ensure_maximized error: {e}")


def bring_window_to_front(do_maximize=False):
    """Bring the main Celsius window to front.  Optionally maximize."""
    info = get_celsius_handle()
    if not info:
        log.warning("No Celsius window found for bring_to_front")
        return None
    handle, name, rect = info
    _ensure_foreground(handle)
    if do_maximize:
        _ensure_maximized(handle)
    time.sleep(0.3)
    return handle


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Screenshot helper                                                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def take_screenshot(label="screenshot"):
    """Save a timestamped screenshot and return the path."""
    try:
        ts = datetime.now().strftime("%H%M%S_%f")[:10]
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
    """Set the Windows clipboard via clip.exe (most reliable method)."""
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
# ║  TAB NAVIGATION — Ctrl+Tab / Ctrl+Shift+Tab                             ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class TabNavigator:
    """Navigate Celsius tabs exclusively via keyboard shortcuts.

    Strategy
    --------
    1. **Reset to tab 0 (Sub-surface)** by pressing Ctrl+Shift+Tab many times
       (more than the total number of tabs) to guarantee we wrap all the way
       back to the first tab.
    2. **Advance forward** with Ctrl+Tab exactly *N* times to reach tab *N*.
    3. Take a verification screenshot after every navigation.

    This class tracks the *assumed* current tab index so that repeated
    navigations within the same pipeline run can take shortcuts.  However,
    every public ``navigate_to`` call can optionally force a full reset.
    """

    RESET_PRESSES = 15  # > NUM_TABS to guarantee landing on tab 0

    def __init__(self):
        self._current_tab: int | None = None  # None = unknown

    # ── internal helpers ──────────────────────────────────────────────

    @staticmethod
    async def _press_ctrl_tab(times: int = 1, delay: float = 0.35):
        """Press Ctrl+Tab *times* times (forward)."""
        for i in range(times):
            pyautogui.hotkey("ctrl", "tab")
            await asyncio.sleep(delay)

    @staticmethod
    async def _press_ctrl_shift_tab(times: int = 1, delay: float = 0.35):
        """Press Ctrl+Shift+Tab *times* times (backward)."""
        for i in range(times):
            pyautogui.hotkey("ctrl", "shift", "tab")
            await asyncio.sleep(delay)

    async def _reset_to_first_tab(self):
        """Slam Ctrl+Shift+Tab enough times to guarantee tab 0."""
        log.info(f"Resetting to tab 0 (Sub-surface) with "
                 f"{self.RESET_PRESSES}× Ctrl+Shift+Tab …")
        await self._press_ctrl_shift_tab(self.RESET_PRESSES, delay=0.20)
        self._current_tab = 0
        log.info("Tab reset complete — assumed at tab 0 (Sub-surface)")

    # ── public API ────────────────────────────────────────────────────

    async def navigate_to(self, target_index: int, force_reset: bool = True):
        """Navigate to the tab at *target_index* (0-based).

        Parameters
        ----------
        target_index : int
            Index into ``TAB_NAMES`` (0 = Sub-surface … 11 = Export and load).
        force_reset : bool
            If True (default), always reset to tab 0 first.  Safest option.
        """
        if target_index < 0 or target_index >= NUM_TABS:
            raise ValueError(f"Tab index {target_index} out of range 0..{NUM_TABS-1}")

        target_name = TAB_NAMES[target_index]
        log.info(f"▸ Navigating to tab {target_index} ({target_name}) …")

        # Ensure Celsius is foreground
        bring_window_to_front()

        # Click somewhere safe in the Celsius content area first so that
        # the keyboard focus is inside the Celsius window (not on a text
        # field or button that might swallow Ctrl+Tab).
        # We click the tab row area (Y ≈ 30) at a neutral X position.
        rect = get_window_rect()
        safe_x = rect[0] + 50
        safe_y = rect[1] + 30
        pyautogui.click(safe_x, safe_y)
        await asyncio.sleep(0.3)

        if force_reset or self._current_tab is None:
            await self._reset_to_first_tab()
            steps_needed = target_index
        else:
            # Compute shortest path from current tab
            forward = (target_index - self._current_tab) % NUM_TABS
            backward = (self._current_tab - target_index) % NUM_TABS
            if forward <= backward:
                steps_needed = forward
            else:
                steps_needed = -backward  # negative = backward

        if steps_needed > 0:
            log.info(f"  Pressing Ctrl+Tab {steps_needed}× …")
            await self._press_ctrl_tab(steps_needed)
        elif steps_needed < 0:
            count = abs(steps_needed)
            log.info(f"  Pressing Ctrl+Shift+Tab {count}× …")
            await self._press_ctrl_shift_tab(count)
        else:
            log.info("  Already on target tab (0 presses needed)")

        self._current_tab = target_index
        log.info(f"  ✓ Should now be on tab {target_index} ({target_name})")

        # Verification screenshot
        take_screenshot(f"tab_{target_index}_{target_name.replace(' ','_')}")
        await asyncio.sleep(0.5)

    async def navigate_to_name(self, name: str, force_reset: bool = True):
        """Navigate by tab name (case-insensitive partial match)."""
        name_lower = name.lower()
        for i, tn in enumerate(TAB_NAMES):
            if name_lower in tn.lower():
                return await self.navigate_to(i, force_reset=force_reset)
        raise ValueError(f"Tab name '{name}' not found in {TAB_NAMES}")


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  CelsiusAutomation — the main automation class                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class CelsiusAutomation:
    """Controls Celsius Design using keyboard automation + pyautogui clicks
    for buttons/icons (NOT for tabs)."""

    def __init__(self):
        self.celsius_path = find_celsius_exe()
        self.is_running = False
        self.is_unlocked = False
        self.tab_nav = TabNavigator()
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
            "celsius_found": self.is_available(),
            "celsius_path": self.celsius_path,
            "pyautogui_installed": pyautogui_ok,
            "pywinauto_installed": pywinauto_ok,
            "is_running": self.is_running,
            "is_unlocked": self.is_unlocked,
            "work_dir": str(WORK_DIR),
        }

    # ── helpers ───────────────────────────────────────────────────────

    def _scale(self, px_x, px_y):
        """Scale a (px_x, px_y) reference coordinate (at 1920-px width)
        to actual window coordinates."""
        left, top, right, bottom = get_window_rect()
        win_w = right - left
        scale = win_w / 1920.0
        return left + int(px_x * scale), top + int(px_y * scale)

    async def _click_at(self, px_x, px_y, label="click"):
        """Click at a 1920-ref pixel position, with logging + screenshot."""
        ax, ay = self._scale(px_x, px_y)
        log.info(f"Clicking [{label}] at screen ({ax},{ay})  "
                 f"[ref ({px_x},{px_y})]")
        pyautogui.click(ax, ay)
        await asyncio.sleep(0.8)
        take_screenshot(f"after_{label}")

    async def _click_candidates(self, candidates, label="button",
                                 check_dialog=False, dialog_timeout=2.0):
        """Try clicking a list of (px_x, px_y) candidates.
        If *check_dialog* is True, stop early when a file dialog appears."""
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
        """Check whether a standard Windows file dialog is currently open."""
        found = False

        def _cb(hwnd, _):
            nonlocal found
            try:
                if not win32gui.IsWindowVisible(hwnd):
                    return True
                title = win32gui.GetWindowText(hwnd).lower()
                cls = win32gui.GetClassName(hwnd)
                if any(kw in title for kw in ["open", "save", "browse",
                                               "select folder", "file name"]):
                    found = True
                    return False
                if cls == "#32770":  # Standard dialog class
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
        """Find the master_password.vi dialog.
        Returns (handle, rect) or (None, None)."""
        dialogs = []

        def _cb(hwnd, _):
            try:
                if not win32gui.IsWindowVisible(hwnd):
                    return True
                title = win32gui.GetWindowText(hwnd)
                rect = win32gui.GetWindowRect(hwnd)
                l, t, r, b = rect
                w, h = r - l, b - t
                title_lower = title.lower()
                is_pwd = any(kw in title_lower for kw in
                             ["master_password", "password", "unlock",
                              "celsius", "go,"])
                is_dialog_size = 100 < w < 800 and 50 < h < 400
                if title and (is_pwd or is_dialog_size):
                    dialogs.append((hwnd, title, rect, w, h))
                    log.debug(f"  Dialog candidate: '{title}' "
                              f"hwnd={hwnd} rect={rect} {w}x{h}")
            except Exception:
                pass
            return True

        if win32gui:
            try:
                win32gui.EnumWindows(_cb, None)
            except Exception:
                pass

        # Prefer windows with password-related keywords
        for hwnd, title, rect, w, h in dialogs:
            tl = title.lower()
            if any(kw in tl for kw in ["master_password", "password",
                                        "unlock"]):
                log.info(f"Password dialog found: '{title}' rect={rect}")
                return hwnd, rect

        # Fallback: any small Celsius-related dialog
        for hwnd, title, rect, w, h in dialogs:
            tl = title.lower()
            if any(kw in tl for kw in ["celsius", "go,"]):
                if w < 800 and h < 400:
                    log.info(f"Probable password dialog: '{title}' rect={rect}")
                    return hwnd, rect

        return None, None

    async def _enter_password(self):
        """Enter the master password into the Celsius password dialog.

        Known dialog layout (master_password.vi):
        - Rect ≈ (661, 507, 1260, 645) = 599 × 138
        - Password field: ~18% from left, ~25% from top of dialog
        - Unlock button:  ~9% from left, ~65% from top of dialog

        Strategy:
        1. Set clipboard with password FIRST
        2. Find and bring dialog to front
        3. Click password field → Ctrl+A → Ctrl+V (paste)
        4. Backup: type character-by-character
        5. Press Enter / click Unlock
        """
        await asyncio.sleep(2)
        take_screenshot("before_password")

        # ── Step 1: Set clipboard ──
        log.info("Setting clipboard with password …")
        set_clipboard(CELSIUS_PASSWORD)
        await asyncio.sleep(0.3)

        # ── Step 2: Find and focus the password dialog ──
        dialog_handle, dialog_rect = self._find_password_dialog()

        if dialog_handle:
            log.info(f"Password dialog handle={dialog_handle} rect={dialog_rect}")
            _ensure_foreground(dialog_handle)
            await asyncio.sleep(0.5)
        else:
            log.warning("Password dialog not found by handle — "
                        "trying screen-center approach")

        take_screenshot("password_dialog_focused")

        # ── Step 3: Determine click coordinates ──
        if dialog_rect:
            l, t, r, b = dialog_rect
            dlg_w, dlg_h = r - l, b - t
            # Password field: 18% from left, 25% from top
            field_x = l + int(dlg_w * 0.18)
            field_y = t + int(dlg_h * 0.25)
            # Unlock button: 9% from left, 65% from top
            unlock_x = l + int(dlg_w * 0.09)
            unlock_y = t + int(dlg_h * 0.65)
        else:
            # Fallback: assume dialog is centred on a 1920×1200 screen
            screen_w, screen_h = pyautogui.size()
            cx, cy = screen_w // 2, screen_h // 2
            field_x = cx - 100
            field_y = cy - 20
            unlock_x = cx - 140
            unlock_y = cy + 30

        # ── Step 4: Click the password field ──
        log.info(f"Clicking password field at ({field_x}, {field_y}) …")
        pyautogui.click(field_x, field_y)
        await asyncio.sleep(0.4)
        # Also try a few nearby Y offsets to be safe
        for dy in [-10, 0, 10]:
            pyautogui.click(field_x, field_y + dy)
            await asyncio.sleep(0.1)
        await asyncio.sleep(0.3)

        # Select-all and clear
        pyautogui.hotkey("ctrl", "a")
        await asyncio.sleep(0.15)
        pyautogui.press("delete")
        await asyncio.sleep(0.15)

        # ── Step 5: Paste password ──
        log.info("Pasting password via Ctrl+V …")
        pyautogui.hotkey("ctrl", "v")
        await asyncio.sleep(0.8)
        take_screenshot("after_paste_password")

        # ── Step 6: Backup — type character by character ──
        log.info("Backup: re-typing password character-by-character …")
        pyautogui.click(field_x, field_y)
        await asyncio.sleep(0.2)
        pyautogui.hotkey("ctrl", "a")
        await asyncio.sleep(0.1)

        for ch in CELSIUS_PASSWORD:
            if ch.isupper():
                pyautogui.hotkey("shift", ch.lower())
            elif ch == "!":
                pyautogui.hotkey("shift", "1")
            elif ch == ",":
                pyautogui.press(",")
            elif ch == " ":
                pyautogui.press("space")
            else:
                pyautogui.press(ch)
            await asyncio.sleep(0.04)
        await asyncio.sleep(0.5)
        take_screenshot("after_type_password")

        # ── Step 7: Submit — Enter then click Unlock ──
        log.info("Pressing Enter to submit password …")
        pyautogui.press("enter")
        await asyncio.sleep(2)

        # Also click the Unlock button area
        log.info(f"Clicking Unlock button at ({unlock_x}, {unlock_y}) …")
        pyautogui.click(unlock_x, unlock_y)
        await asyncio.sleep(0.5)
        # Try a few nearby positions
        for dx in [-30, 0, 30, 60]:
            pyautogui.click(unlock_x + dx, unlock_y)
            await asyncio.sleep(0.2)

        pyautogui.press("enter")
        await asyncio.sleep(3)

        take_screenshot("after_unlock_attempt")

        # ── Step 8: Check for "Wrong password" dialog ──
        wrong_handle, wrong_rect = self._find_password_dialog()
        if wrong_handle:
            log.warning("Password dialog still visible — may have failed. "
                        "Trying Enter again …")
            _ensure_foreground(wrong_handle)
            await asyncio.sleep(0.3)
            pyautogui.press("enter")
            await asyncio.sleep(2)
            # Try clicking Cancel / OK on any error dialog
            pyautogui.press("escape")
            await asyncio.sleep(1)

        self.is_unlocked = True
        log.info("Password entry sequence complete")

    # ── launch ────────────────────────────────────────────────────────

    async def launch_and_unlock(self):
        """Launch Celsius Design and handle the password dialog."""
        # Check if already running
        info = get_celsius_handle()
        if info:
            handle, name, rect = info
            log.info(f"Celsius already running: '{name}'")
            _ensure_foreground(handle)
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

            # Wait for window
            log.info("Waiting for Celsius window …")
            for i in range(60):
                await asyncio.sleep(1)
                info = get_celsius_handle()
                if info:
                    log.info(f"Window found after {i+1}s")
                    break
            else:
                return {"status": "error",
                        "message": "Timeout: Celsius window not found after 60s"}

            _ensure_foreground(info[0])
            self.is_running = True
            await asyncio.sleep(2)

        # Handle password dialog
        log.info("Handling password dialog …")
        await self._enter_password()

        # Bring main window to front and maximize
        await asyncio.sleep(2)
        handle = bring_window_to_front(do_maximize=True)
        await asyncio.sleep(1)
        _ensure_maximized(handle)
        take_screenshot("after_launch_maximized")

        return {"status": "success", "message": "Celsius launched and unlocked"}

    # ── file dialog interaction ───────────────────────────────────────

    async def _browse_and_select_file(self, file_path):
        """Handle a standard Windows Open / Save file dialog.
        Uses Alt+N to focus filename field, pastes the path, presses Enter."""
        await asyncio.sleep(1.5)
        log.info(f"File dialog: selecting '{file_path}'")
        take_screenshot("file_dialog_opened")

        # Focus filename field
        log.info("Focusing filename field with Alt+N …")
        pyautogui.hotkey("alt", "n")
        await asyncio.sleep(0.5)

        # Clear and paste path
        pyautogui.hotkey("ctrl", "a")
        await asyncio.sleep(0.15)
        set_clipboard(str(file_path))
        await asyncio.sleep(0.3)
        pyautogui.hotkey("ctrl", "v")
        await asyncio.sleep(0.5)
        log.info(f"Pasted path: {file_path}")
        take_screenshot("file_dialog_path_pasted")

        # Confirm
        log.info("Pressing Enter to confirm …")
        pyautogui.press("enter")
        await asyncio.sleep(1.5)
        # Second Enter in case of confirmation prompt
        pyautogui.press("enter")
        await asyncio.sleep(1)
        log.info("File dialog interaction complete")

    # ── Load INI ──────────────────────────────────────────────────────

    async def load_ini_file(self, ini_path):
        """Load an INI file into Celsius via the 'Export and load' tab.

        Steps:
        1. Navigate to Export and load tab (index 11) via Ctrl+Tab
        2. Click the Load config folder icon → Windows file dialog
        3. Select the INI file in the dialog
        4. Click the LOAD button
        """
        log.info(f"═══ LOAD INI: {ini_path} ═══")
        bring_window_to_front()
        await asyncio.sleep(0.3)
        _ensure_maximized()
        await asyncio.sleep(0.3)

        try:
            # Step 1: Navigate to "Export and load" (tab 11)
            await self.tab_nav.navigate_to(11, force_reset=True)
            await asyncio.sleep(1)

            # Step 2: Click the folder icon for "Load config file"
            # Try the estimated position first, then nearby positions
            load_folder_candidates = [
                EXPORT_TAB_LOAD_FOLDER_ICON,                          # (920, 370)
                (920, 350), (920, 390),                               # Y variants
                (900, 370), (940, 370),                               # X variants
                (880, 370), (960, 370),                               # wider X
                (920, 330), (920, 410),                               # wider Y
            ]
            dialog_opened = await self._click_candidates(
                load_folder_candidates,
                label="load_folder_icon",
                check_dialog=True,
                dialog_timeout=2.0,
            )

            if not dialog_opened:
                log.warning("File dialog did NOT open after clicking folder "
                            "icon candidates — trying anyway …")

            # Step 3: Handle the file dialog
            await self._browse_and_select_file(ini_path)
            await asyncio.sleep(2)

            # Step 4: Click the LOAD button
            load_btn_candidates = [
                EXPORT_TAB_LOAD_BUTTON,                               # (1050, 370)
                (1050, 350), (1050, 390),
                (1030, 370), (1070, 370),
                (1080, 370), (1020, 370),
                (1050, 330), (1050, 410),
            ]
            await self._click_candidates(
                load_btn_candidates,
                label="load_button",
            )
            await asyncio.sleep(3)
            take_screenshot("after_load_ini")

            log.info("INI load sequence completed")
            return {"status": "success", "message": f"Loaded {ini_path}"}

        except Exception as e:
            log.error(f"Load INI failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}

    # ── Simulate ──────────────────────────────────────────────────────

    async def run_simulation(self):
        """Run the simulation by clicking 'Optimize placement' on the
        'Well placement' tab.

        Steps:
        1. Navigate to Well placement tab (index 1) via Ctrl+Tab
        2. Click the Optimize placement button (try multiple positions)
        3. Wait ~90-100 s for completion
        """
        log.info("═══ RUN SIMULATION ═══")
        bring_window_to_front()
        await asyncio.sleep(0.3)
        _ensure_maximized()
        await asyncio.sleep(0.3)

        try:
            # Step 1: Navigate to "Well placement" (tab 1)
            await self.tab_nav.navigate_to(1, force_reset=True)
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

        Steps:
        1. Navigate to Export and load tab (index 11) via Ctrl+Tab
        2. Click the Export config folder icon → Windows Save dialog
        3. Set the output path in the dialog
        4. Click the SAVE button
        """
        log.info(f"═══ EXPORT RESULTS → {output_path} ═══")
        bring_window_to_front()
        await asyncio.sleep(0.3)
        _ensure_maximized()
        await asyncio.sleep(0.3)

        try:
            # Step 1: Navigate to "Export and load" (tab 11)
            await self.tab_nav.navigate_to(11, force_reset=True)
            await asyncio.sleep(1)

            # Step 2: Click the folder icon for "Export config file"
            export_folder_candidates = [
                EXPORT_TAB_SAVE_FOLDER_ICON,                          # (920, 280)
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
                log.warning("Save dialog did NOT open after clicking export "
                            "folder icon candidates — trying anyway …")

            # Step 3: Handle the Save dialog
            await self._browse_and_select_file(output_path)
            await asyncio.sleep(2)

            # Step 4: Click the SAVE button
            save_btn_candidates = [
                EXPORT_TAB_SAVE_BUTTON,                               # (1050, 280)
                (1050, 260), (1050, 300),
                (1030, 280), (1070, 280),
                (1080, 280), (1020, 280),
                (1050, 240), (1050, 320),
            ]
            await self._click_candidates(
                save_btn_candidates,
                label="save_button",
            )
            await asyncio.sleep(3)
            take_screenshot("after_export")

            # Check if file was created
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
# ║  HTTP Server                                                             ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

class KelvinAgentServer:
    """HTTP server bridging the Kelvin frontend to Celsius automation."""

    def __init__(self):
        self.celsius = CelsiusAutomation()
        self.current_job = None

    # ── CORS headers ──────────────────────────────────────────────────

    CORS = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    # ── request handler ───────────────────────────────────────────────

    async def handle_http(self, request):
        import aiohttp.web as web

        path = request.path
        headers = dict(self.CORS)

        # ── OPTIONS (CORS preflight) ──
        if request.method == "OPTIONS":
            return web.Response(status=200, headers=headers)

        # ── GET /status ──
        if path == "/status":
            status = self.celsius.get_status()
            status["agent_version"] = "3.0.0"
            status["current_job"] = self.current_job
            return web.json_response(status, headers=headers)

        # ── POST /run  (full pipeline) ──
        if path == "/run" and request.method == "POST":
            try:
                data = await request.json()
                ini_content = data.get("ini", "")
                job_id = data.get("job_id",
                                  datetime.now().strftime("%Y%m%d_%H%M%S"))
                if not ini_content:
                    return web.json_response(
                        {"error": "No INI content"}, status=400,
                        headers=headers)

                ini_path = INPUT_DIR / f"kelvin_{job_id}.ini"
                ini_path.write_text(ini_content, encoding="utf-8")
                log.info(f"Received INI ({len(ini_content)} chars) → {ini_path}")

                self.current_job = {
                    "id": job_id,
                    "status": "starting",
                    "ini_path": str(ini_path),
                    "started_at": datetime.now().isoformat(),
                    "steps": [],
                }
                asyncio.create_task(self._run_pipeline(job_id, ini_path))
                return web.json_response(
                    {"status": "accepted", "job_id": job_id},
                    headers=headers)
            except Exception as e:
                return web.json_response(
                    {"error": str(e)}, status=500, headers=headers)

        # ── GET /job ──
        if path == "/job":
            if not self.current_job:
                return web.json_response({"status": "no_job"},
                                         headers=headers)
            return web.json_response(self.current_job, headers=headers)

        # ── GET /results ──
        if path == "/results":
            if not self.current_job or self.current_job["status"] != "complete":
                return web.json_response({"status": "not_ready"},
                                         headers=headers)
            result_path = self.current_job.get("result_path")
            if result_path and Path(result_path).exists():
                content = Path(result_path).read_text(encoding="utf-8")
                return web.json_response(
                    {"status": "complete", "ini_content": content,
                     "job_id": self.current_job["id"]},
                    headers=headers)
            return web.json_response(
                {"status": "error", "message": "Result file not found"},
                headers=headers)

        # ── Manual step endpoints (debugging / manual control) ──
        if path == "/launch" and request.method == "POST":
            result = await self.celsius.launch_and_unlock()
            return web.json_response(result, headers=headers)

        if path == "/load" and request.method == "POST":
            data = await request.json()
            result = await self.celsius.load_ini_file(data.get("path", ""))
            return web.json_response(result, headers=headers)

        if path == "/simulate" and request.method == "POST":
            result = await self.celsius.run_simulation()
            return web.json_response(result, headers=headers)

        if path == "/export" and request.method == "POST":
            data = await request.json()
            result = await self.celsius.export_results(
                data.get("path", str(OUTPUT_DIR / "results")))
            return web.json_response(result, headers=headers)

        if path == "/screenshot" and request.method == "GET":
            try:
                ss = take_screenshot("manual")
                return web.json_response(
                    {"status": "ok", "path": str(ss)}, headers=headers)
            except Exception as e:
                return web.json_response({"error": str(e)}, headers=headers)

        if path == "/log" and request.method == "GET":
            try:
                tail = int(request.query.get("tail", 200))
                if LOG_FILE.exists():
                    lines = LOG_FILE.read_text(encoding="utf-8").splitlines()
                    tail_lines = lines[-tail:] if len(lines) > tail else lines
                    return web.json_response({
                        "status": "ok",
                        "log_file": str(LOG_FILE),
                        "total_lines": len(lines),
                        "showing": len(tail_lines),
                        "lines": tail_lines,
                    }, headers=headers)
                return web.json_response(
                    {"status": "error", "message": "Log file not found"},
                    headers=headers)
            except Exception as e:
                return web.json_response({"error": str(e)}, headers=headers)

        if path == "/logs" and request.method == "GET":
            try:
                files = []
                for f in sorted(LOG_DIR.iterdir(),
                                key=lambda p: p.stat().st_mtime,
                                reverse=True):
                    files.append({
                        "name": f.name,
                        "size": f.stat().st_size,
                        "modified": datetime.fromtimestamp(
                            f.stat().st_mtime).isoformat(),
                        "path": str(f),
                    })
                return web.json_response(
                    {"status": "ok", "files": files[:50]}, headers=headers)
            except Exception as e:
                return web.json_response({"error": str(e)}, headers=headers)

        return web.json_response(
            {"error": "Not found"}, status=404, headers=headers)

    # ── full pipeline ─────────────────────────────────────────────────

    async def _run_pipeline(self, job_id, ini_path):
        """Full automation pipeline: launch → load INI → simulate → export."""

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
            step("load_ini", "running", f"Loading {ini_path.name} …")
            result = await self.celsius.load_ini_file(str(ini_path))
            if result["status"] == "error":
                step("load_ini", "failed", result["message"])
                self.current_job["status"] = "failed"
                return
            step("load_ini", "done", result["message"])

            # 3. Run Simulation
            step("simulate", "running", "Running thermal simulation …")
            result = await self.celsius.run_simulation()
            if result["status"] == "error":
                step("simulate", "failed", result["message"])
                self.current_job["status"] = "failed"
                return
            step("simulate", "done", result["message"])

            # 4. Export Results
            output_path = OUTPUT_DIR / f"results_{job_id}"
            step("export", "running", f"Exporting to {output_path} …")
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
                self.current_job["result_path"] = str(output_path) + ".ini"

            self.current_job["status"] = "complete"
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
        routes = [
            "/status", "/run", "/job", "/results",
            "/launch", "/load", "/simulate", "/export",
            "/screenshot", "/log", "/logs",
        ]
        for route in routes:
            app.router.add_route("*", route, self.handle_http)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", AGENT_PORT)
        await site.start()

        log.info("=" * 64)
        log.info(f"  Project Kelvin Agent v3.0 (Ctrl+Tab navigation)")
        log.info(f"  Server: http://localhost:{AGENT_PORT}")
        log.info(f"  Celsius: {self.celsius.celsius_path}")
        log.info(f"  Work dir: {WORK_DIR}")
        log.info(f"")
        log.info(f"  Tab navigation: Ctrl+Tab / Ctrl+Shift+Tab ONLY")
        log.info(f"  Tabs: {NUM_TABS} tabs, 0-indexed")
        log.info(f"")
        log.info(f"  Pipeline: POST /run  (send INI, auto-run everything)")
        log.info(f"  Manual:   POST /launch, /load, /simulate, /export")
        log.info(f"  Debug:    GET /screenshot, /status, /job, /results")
        log.info(f"            GET /log?tail=N, /logs")
        log.info("=" * 64)

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
            log.error("pyautogui is required. Run: pip install pyautogui Pillow")
            sys.exit(1)


if __name__ == "__main__":
    log.info("Project Kelvin Agent v3.0 starting …")
    check_deps()
    server = KelvinAgentServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        log.info("Agent stopped by user")
    except Exception as e:
        log.error(f"Agent failed: {e}", exc_info=True)
        sys.exit(1)
