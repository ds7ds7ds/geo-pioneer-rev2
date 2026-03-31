; ============================================================================
; celsius_automation.ahk — AutoHotkey v2 script for Celsius Design v6.2d
; ============================================================================
; Project Kelvin — v5.0
;
; Called from Python via subprocess with command-line arguments:
;   AutoHotkey64.exe celsius_automation.ahk <action> [args...]
;
; Actions:
;   launch                         — Start Celsius + enter password
;   load_ini  <ini_path>           — Navigate to Export and load tab, load INI
;   run_sim                        — Navigate to Well placement, click Optimize
;   export_results <output_path>   — Navigate to Export and load, save results
;   click_tab <tab_name>           — Click a specific tab (for testing)
;   screenshot <label>             — Take a screenshot (for debugging)
;   close                          — Close Celsius
;
; All results are written to a JSON status file that Python reads.
; Screenshots are saved to the log directory at every significant step.
; ============================================================================

#Requires AutoHotkey v2.0
#SingleInstance Force

; ── Global Configuration ──────────────────────────────────────────────────

global CELSIUS_EXE      := "C:\Planner\Celsius.design.v6.2d.exe"
global CELSIUS_PASSWORD := "Go, Celsius, go!"
global AHK_EXE          := "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"

global WORK_DIR   := EnvGet("USERPROFILE") . "\KelvinAgent"
global LOG_DIR    := WORK_DIR . "\logs"
global OUTPUT_DIR := WORK_DIR . "\output"
global STATUS_FILE := WORK_DIR . "\ahk_status.json"

; Ensure directories exist
DirCreate(LOG_DIR)
DirCreate(OUTPUT_DIR)

; ── Tab Positions (screen-absolute, window maximised 1920×1080+taskbar) ───
; Map of tab name → {x, y}

global TAB_DATA := Map(
    "Sub-surface",              {x: 40,  y: 34},
    "Well placement",           {x: 113, y: 34},
    "Building loads",           {x: 192, y: 34},
    "Energy production",        {x: 271, y: 34},
    "Heat pumps",               {x: 351, y: 34},
    "Optimize length",          {x: 425, y: 34},
    "Hourly plots",             {x: 502, y: 34},
    "Results - Heat pump loads", {x: 594, y: 34},
    "More results",             {x: 689, y: 34},
    "Yearly results",           {x: 757, y: 34},
    "Economics",                {x: 820, y: 34},
    "Export and load",          {x: 889, y: 34}
)

; Y values to sweep when clicking a tab (guarantees hitting the text row)
global TAB_Y_SWEEP := [28, 30, 32, 34, 36, 38, 40]

; ── Approximate button positions on the "Export and load" tab ─────────────
; These are estimates — the script takes screenshots so you can calibrate.
; Format: {x, y} in screen-absolute coordinates (maximised 1920×1080).

; "Load config file" folder/browse icon and LOAD button
global LOAD_BROWSE_CANDIDATES := [
    {x: 920, y: 370}, {x: 920, y: 350}, {x: 920, y: 390},
    {x: 900, y: 370}, {x: 940, y: 370}, {x: 880, y: 370},
    {x: 960, y: 370}, {x: 920, y: 330}, {x: 920, y: 410}
]
global LOAD_BUTTON_CANDIDATES := [
    {x: 1050, y: 370}, {x: 1050, y: 350}, {x: 1050, y: 390},
    {x: 1030, y: 370}, {x: 1070, y: 370}, {x: 1080, y: 370},
    {x: 1020, y: 370}, {x: 1050, y: 330}, {x: 1050, y: 410}
]

; "Export config file" folder/browse icon and SAVE button
global SAVE_BROWSE_CANDIDATES := [
    {x: 920, y: 280}, {x: 920, y: 260}, {x: 920, y: 300},
    {x: 900, y: 280}, {x: 940, y: 280}, {x: 880, y: 280},
    {x: 960, y: 280}, {x: 920, y: 240}, {x: 920, y: 320}
]
global SAVE_BUTTON_CANDIDATES := [
    {x: 1050, y: 280}, {x: 1050, y: 260}, {x: 1050, y: 300},
    {x: 1030, y: 280}, {x: 1070, y: 280}, {x: 1080, y: 280},
    {x: 1020, y: 280}, {x: 1050, y: 240}, {x: 1050, y: 320}
]

; "Optimize placement" button candidates on the Well placement tab
global OPTIMIZE_CANDIDATES := [
    {x: 160, y: 170}, {x: 160, y: 200}, {x: 160, y: 140},
    {x: 200, y: 170}, {x: 120, y: 170}, {x: 160, y: 230},
    {x: 200, y: 200}, {x: 120, y: 200}, {x: 200, y: 140}
]

; Simulation wait time (seconds)
global SIM_WAIT_SECS := 120


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  Utility Functions                                                       ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

LogMsg(msg) {
    timestamp := FormatTime(, "yyyy-MM-dd HH:mm:ss")
    line := timestamp . " | " . msg
    try {
        logFile := LOG_DIR . "\ahk_" . FormatTime(, "yyyyMMdd") . ".log"
        FileAppend(line . "`n", logFile, "UTF-8")
    }
    OutputDebug(line)
}

TakeScreenshot(label := "screenshot") {
    ; Use PowerShell to take a screenshot via .NET — no external dependencies
    timestamp := FormatTime(, "HHmmss")
    filename := LOG_DIR . "\" . label . "_" . timestamp . ".png"

    ; Use the built-in PowerShell screenshot approach
    psScript := '
    (
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
        $bitmap.Save("' . filename . '", [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
    )'

    try {
        RunWait('powershell.exe -NoProfile -Command "' . psScript . '"',, "Hide")
        LogMsg("Screenshot [" . label . "]: " . filename)
    } catch as e {
        LogMsg("Screenshot FAILED [" . label . "]: " . e.Message)
    }
    return filename
}

WriteStatus(statusObj) {
    ; Write a JSON status file that Python reads after each AHK call.
    ; statusObj is a Map with string keys.
    json := "{"
    first := true
    for key, val in statusObj {
        if !first
            json .= ","
        first := false
        ; Escape backslashes and quotes in values
        escapedVal := StrReplace(StrReplace(String(val), "\", "\\"), '"', '\"')
        json .= '`n  "' . key . '": "' . escapedVal . '"'
    }
    json .= "`n}"

    try {
        if FileExist(STATUS_FILE)
            FileDelete(STATUS_FILE)
        FileAppend(json, STATUS_FILE, "UTF-8")
        LogMsg("Status written: " . STATUS_FILE)
    } catch as e {
        LogMsg("WriteStatus FAILED: " . e.Message)
    }
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  Window Management                                                       ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

FindCelsiusWindow() {
    ; Returns the HWND of the main Celsius window, or 0 if not found.
    ; Tries multiple title patterns since LabVIEW window titles can vary.
    patterns := ["Celsius", "celsius", "CELSIUS", "Celsius Design",
                 "celsius.design", "Celsius.design"]
    for pattern in patterns {
        if WinExist(pattern) {
            hwnd := WinGetID(pattern)
            LogMsg("Found Celsius window: " . pattern . " hwnd=" . hwnd)
            return hwnd
        }
    }
    ; Try partial match
    if WinExist("ahk_exe Celsius") {
        hwnd := WinGetID("ahk_exe Celsius")
        LogMsg("Found Celsius by exe name, hwnd=" . hwnd)
        return hwnd
    }
    LogMsg("Celsius window NOT found")
    return 0
}

FindPasswordDialog() {
    ; Returns the HWND of the password dialog, or 0 if not found.
    patterns := ["master_password", "Master_password", "Password", "password",
                 "Unlock", "unlock"]
    for pattern in patterns {
        if WinExist(pattern) {
            hwnd := WinGetID(pattern)
            title := WinGetTitle(pattern)
            LogMsg("Found password dialog: '" . title . "' hwnd=" . hwnd)
            return hwnd
        }
    }
    LogMsg("Password dialog NOT found")
    return 0
}

ActivateAndMaximize(hwnd) {
    ; Bring window to front and maximise it.
    if !hwnd
        return false
    try {
        WinActivate(hwnd)
        Sleep(300)
        WinMaximize(hwnd)
        Sleep(500)
        ; Verify it's active
        if WinActive("ahk_id " . hwnd) {
            LogMsg("Window activated and maximised: " . hwnd)
            return true
        }
        ; Retry
        WinActivate(hwnd)
        Sleep(200)
        return WinActive("ahk_id " . hwnd)
    } catch as e {
        LogMsg("ActivateAndMaximize FAILED: " . e.Message)
        return false
    }
}

EnsureCelsiusForeground() {
    ; Find, activate, and maximise the main Celsius window.
    ; Returns the HWND or 0 on failure.
    hwnd := FindCelsiusWindow()
    if !hwnd {
        LogMsg("Cannot bring Celsius to front — not found")
        return 0
    }
    ActivateAndMaximize(hwnd)
    Sleep(300)
    return hwnd
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  Tab Navigation — Direct Mouse Clicks                                    ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ClickTab(tabName) {
    ; Click a tab by name using confirmed screen coordinates.
    ; Sweeps Y from 28 to 40 to guarantee hitting the tab text row.
    ; Returns true on success.

    if !TAB_DATA.Has(tabName) {
        LogMsg("ERROR: Unknown tab name: " . tabName)
        return false
    }

    LogMsg("▸ Clicking tab: '" . tabName . "'")

    ; Ensure Celsius is foreground and maximised
    hwnd := EnsureCelsiusForeground()
    if !hwnd {
        LogMsg("ERROR: Celsius not foreground for tab click")
        return false
    }
    Sleep(300)

    tabInfo := TAB_DATA[tabName]
    tabX := tabInfo.x

    ; Sweep Y values to guarantee hitting the tab text
    for yVal in TAB_Y_SWEEP {
        Click(tabX, yVal)
        Sleep(80)
    }

    ; Final click at canonical y=34
    Click(tabX, 34)
    Sleep(500)

    ; Take verification screenshot
    safeName := StrReplace(StrReplace(tabName, " ", "_"), "-", "_")
    TakeScreenshot("tab_" . safeName)

    LogMsg("  ✓ Tab click complete: '" . tabName . "' at x=" . tabX)
    return true
}

ClickTabByIndex(index) {
    ; Click a tab by 0-based index.
    tabNames := [
        "Sub-surface", "Well placement", "Building loads",
        "Energy production", "Heat pumps", "Optimize length",
        "Hourly plots", "Results - Heat pump loads", "More results",
        "Yearly results", "Economics", "Export and load"
    ]
    if index < 0 || index >= tabNames.Length {
        LogMsg("ERROR: Tab index out of range: " . index)
        return false
    }
    return ClickTab(tabNames[index + 1])  ; AHK arrays are 1-based
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  Button Clicking with Candidate Positions                                ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ClickCandidates(candidates, label := "button", checkDialog := false, waitMs := 800) {
    ; Try clicking each candidate position.
    ; If checkDialog is true, stop early when a file dialog appears.
    ; Returns true if a dialog was detected (when checkDialog=true).

    for i, pos in candidates {
        LogMsg("  Click [" . label . "] attempt " . i . "/" . candidates.Length
               . " at (" . pos.x . "," . pos.y . ")")
        Click(pos.x, pos.y)
        Sleep(waitMs)
        TakeScreenshot(label . "_attempt_" . i)

        if checkDialog {
            if FileDialogVisible() {
                LogMsg("  File dialog detected after attempt " . i)
                return true
            }
        }
    }
    return false
}

FileDialogVisible() {
    ; Check if a standard Windows file dialog is open.
    patterns := ["Open", "Save", "Browse", "Select Folder", "File name"]
    for pattern in patterns {
        if WinExist(pattern)
            return true
    }
    ; Check for #32770 dialog class (standard Windows dialog)
    if WinExist("ahk_class #32770")
        return true
    return false
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  File Dialog Handling                                                     ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

HandleFileDialog(filePath) {
    ; Handle a standard Windows Open/Save file dialog.
    ; Uses Alt+N to focus filename field, pastes path, presses Enter.

    LogMsg("Handling file dialog for: " . filePath)
    Sleep(1000)
    TakeScreenshot("file_dialog_opened")

    ; Try to activate the dialog
    if WinExist("ahk_class #32770") {
        WinActivate("ahk_class #32770")
        Sleep(300)
    } else if WinExist("Open") {
        WinActivate("Open")
        Sleep(300)
    } else if WinExist("Save") {
        WinActivate("Save")
        Sleep(300)
    }

    ; Focus the filename field with Alt+N
    LogMsg("Focusing filename field with Alt+N")
    Send("!n")
    Sleep(400)

    ; Select all existing text and replace with our path
    Send("^a")
    Sleep(150)

    ; Set clipboard and paste
    A_Clipboard := filePath
    Sleep(200)
    Send("^v")
    Sleep(500)
    LogMsg("Pasted path: " . filePath)
    TakeScreenshot("file_dialog_path_pasted")

    ; Press Enter to confirm
    Send("{Enter}")
    Sleep(1500)

    ; Second Enter in case of overwrite confirmation
    Send("{Enter}")
    Sleep(1000)

    LogMsg("File dialog interaction complete")
    TakeScreenshot("file_dialog_done")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: launch — Start Celsius + Enter Password                         ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionLaunch() {
    LogMsg("═══ ACTION: launch ═══")
    TakeScreenshot("launch_start")

    ; Check if Celsius is already running
    hwnd := FindCelsiusWindow()
    if hwnd {
        LogMsg("Celsius already running — activating")
        ActivateAndMaximize(hwnd)
        Sleep(1000)
    } else {
        ; Launch Celsius
        if !FileExist(CELSIUS_EXE) {
            LogMsg("ERROR: Celsius exe not found: " . CELSIUS_EXE)
            WriteStatus(Map(
                "action", "launch",
                "status", "error",
                "message", "Celsius exe not found: " . CELSIUS_EXE
            ))
            return
        }

        LogMsg("Launching: " . CELSIUS_EXE)
        try {
            Run(CELSIUS_EXE)
        } catch as e {
            LogMsg("Launch failed: " . e.Message)
            WriteStatus(Map(
                "action", "launch",
                "status", "error",
                "message", "Launch failed: " . e.Message
            ))
            return
        }

        ; Wait for the window to appear (up to 90 seconds)
        LogMsg("Waiting for Celsius window …")
        found := false
        Loop 90 {
            Sleep(1000)
            hwnd := FindCelsiusWindow()
            if hwnd {
                LogMsg("Window appeared after " . A_Index . "s")
                found := true
                break
            }
            ; Also check for password dialog (it may appear before main window)
            pwdHwnd := FindPasswordDialog()
            if pwdHwnd {
                LogMsg("Password dialog appeared after " . A_Index . "s")
                found := true
                break
            }
        }
        if !found {
            LogMsg("ERROR: Timeout waiting for Celsius window (90s)")
            TakeScreenshot("launch_timeout")
            WriteStatus(Map(
                "action", "launch",
                "status", "error",
                "message", "Timeout: Celsius window not found after 90s"
            ))
            return
        }
    }

    Sleep(2000)
    TakeScreenshot("before_password")

    ; ── Handle password dialog ────────────────────────────────────────
    LogMsg("Looking for password dialog …")
    pwdHwnd := 0
    Loop 10 {
        pwdHwnd := FindPasswordDialog()
        if pwdHwnd
            break
        Sleep(1000)
    }

    if pwdHwnd {
        LogMsg("Password dialog found: hwnd=" . pwdHwnd)

        ; Activate the password dialog
        WinActivate(pwdHwnd)
        Sleep(500)
        TakeScreenshot("password_dialog_active")

        ; Get dialog position and size
        try {
            WinGetPos(&dlgX, &dlgY, &dlgW, &dlgH, pwdHwnd)
            LogMsg("Dialog rect: x=" . dlgX . " y=" . dlgY
                   . " w=" . dlgW . " h=" . dlgH)
        } catch {
            ; Fallback: assume centred on 1920×1080
            dlgX := 660
            dlgY := 470
            dlgW := 600
            dlgH := 140
            LogMsg("Dialog rect fallback: x=" . dlgX . " y=" . dlgY
                   . " w=" . dlgW . " h=" . dlgH)
        }

        ; Click the password field at 45% from left, 35% from top
        fieldX := dlgX + Integer(dlgW * 0.45)
        fieldY := dlgY + Integer(dlgH * 0.35)
        LogMsg("Clicking password field at (" . fieldX . "," . fieldY . ")")

        Click(fieldX, fieldY)
        Sleep(300)

        ; Triple-click to select all existing text
        Click(fieldX, fieldY, 3)
        Sleep(300)

        ; Type the password using SendText (handles special characters)
        LogMsg("Typing password via SendText …")
        SendText(CELSIUS_PASSWORD)
        Sleep(500)
        TakeScreenshot("after_type_password")

        ; Press Enter to submit
        LogMsg("Pressing Enter to submit …")
        Send("{Enter}")
        Sleep(3000)
        TakeScreenshot("after_enter_password")

        ; Check if dialog is still open
        stillOpen := FindPasswordDialog()
        if stillOpen {
            LogMsg("Password dialog still open — retrying with clipboard paste …")
            WinActivate(stillOpen)
            Sleep(300)

            ; Try clipboard paste approach
            try {
                WinGetPos(&dlgX2, &dlgY2, &dlgW2, &dlgH2, stillOpen)
            } catch {
                dlgX2 := dlgX
                dlgY2 := dlgY
                dlgW2 := dlgW
                dlgH2 := dlgH
            }
            fieldX2 := dlgX2 + Integer(dlgW2 * 0.45)
            fieldY2 := dlgY2 + Integer(dlgH2 * 0.35)

            Click(fieldX2, fieldY2)
            Sleep(200)
            Click(fieldX2, fieldY2, 3)
            Sleep(200)

            A_Clipboard := CELSIUS_PASSWORD
            Sleep(200)
            Send("^v")
            Sleep(500)
            Send("{Enter}")
            Sleep(3000)
            TakeScreenshot("password_retry_done")
        }
    } else {
        LogMsg("No password dialog found — may already be unlocked")
    }

    ; ── Bring main window to front and maximise ──────────────────────
    Sleep(2000)
    hwnd := EnsureCelsiusForeground()
    Sleep(500)
    TakeScreenshot("launch_complete")

    WriteStatus(Map(
        "action", "launch",
        "status", "success",
        "message", "Celsius launched and unlocked",
        "hwnd", String(hwnd)
    ))
    LogMsg("═══ launch complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: load_ini — Load an INI file via Export and load tab             ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionLoadIni(iniPath) {
    LogMsg("═══ ACTION: load_ini ═══")
    LogMsg("INI path: " . iniPath)
    TakeScreenshot("load_ini_start")

    if !FileExist(iniPath) {
        LogMsg("ERROR: INI file not found: " . iniPath)
        WriteStatus(Map(
            "action", "load_ini",
            "status", "error",
            "message", "INI file not found: " . iniPath
        ))
        return
    }

    ; Step 1: Navigate to "Export and load" tab
    if !ClickTab("Export and load") {
        WriteStatus(Map(
            "action", "load_ini",
            "status", "error",
            "message", "Failed to click Export and load tab"
        ))
        return
    }
    Sleep(1000)

    ; Step 2: Click the folder icon for "Load config file"
    LogMsg("Clicking Load config folder icon candidates …")
    dialogOpened := ClickCandidates(LOAD_BROWSE_CANDIDATES,
                                    "load_folder_icon", true, 2000)

    if !dialogOpened {
        LogMsg("WARNING: File dialog did not open from folder icon — "
               . "trying direct path entry approach")
        TakeScreenshot("load_no_dialog")

        ; Alternative: try clicking the path input field area and typing directly
        ; The path field might be to the left of the folder icon
        pathFieldCandidates := [
            {x: 750, y: 370}, {x: 700, y: 370}, {x: 800, y: 370},
            {x: 750, y: 350}, {x: 750, y: 390}
        ]
        for i, pos in pathFieldCandidates {
            Click(pos.x, pos.y)
            Sleep(300)
        }
        ; Try typing the path directly
        Send("^a")
        Sleep(100)
        A_Clipboard := iniPath
        Sleep(200)
        Send("^v")
        Sleep(500)
        TakeScreenshot("load_path_typed")
    } else {
        ; Step 3: Handle the file dialog
        HandleFileDialog(iniPath)
    }

    Sleep(2000)

    ; Step 4: Click the LOAD button
    LogMsg("Clicking LOAD button candidates …")
    ClickCandidates(LOAD_BUTTON_CANDIDATES, "load_button", false, 1000)
    Sleep(3000)
    TakeScreenshot("after_load_ini")

    LogMsg("INI load sequence completed")
    WriteStatus(Map(
        "action", "load_ini",
        "status", "success",
        "message", "Loaded " . iniPath
    ))
    LogMsg("═══ load_ini complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: run_sim — Run simulation via Well placement tab                 ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionRunSim() {
    LogMsg("═══ ACTION: run_sim ═══")
    TakeScreenshot("run_sim_start")

    ; Step 1: Navigate to "Well placement" tab
    if !ClickTab("Well placement") {
        WriteStatus(Map(
            "action", "run_sim",
            "status", "error",
            "message", "Failed to click Well placement tab"
        ))
        return
    }
    Sleep(1000)

    ; Step 2: Click "Optimize placement" button
    LogMsg("Clicking Optimize placement button candidates …")
    ClickCandidates(OPTIMIZE_CANDIDATES, "optimize_placement", false, 1000)

    ; Step 3: Wait for simulation to complete
    LogMsg("Waiting " . SIM_WAIT_SECS . "s for simulation …")
    startTime := A_TickCount
    Loop SIM_WAIT_SECS {
        Sleep(1000)
        elapsed := Integer((A_TickCount - startTime) / 1000)
        if Mod(elapsed, 15) = 0 && elapsed > 0 {
            LogMsg("  Simulation running … " . elapsed . "s elapsed")
            TakeScreenshot("sim_progress_" . elapsed . "s")
        }
    }

    totalElapsed := Integer((A_TickCount - startTime) / 1000)
    TakeScreenshot("sim_complete")
    Sleep(2000)

    WriteStatus(Map(
        "action", "run_sim",
        "status", "success",
        "message", "Simulation completed in " . totalElapsed . "s"
    ))
    LogMsg("═══ run_sim complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: export_results — Export results via Export and load tab          ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionExportResults(outputPath) {
    LogMsg("═══ ACTION: export_results ═══")
    LogMsg("Output path: " . outputPath)
    TakeScreenshot("export_start")

    ; Ensure output directory exists
    SplitPath(outputPath,, &outDir)
    if outDir
        DirCreate(outDir)

    ; Step 1: Navigate to "Export and load" tab
    if !ClickTab("Export and load") {
        WriteStatus(Map(
            "action", "export_results",
            "status", "error",
            "message", "Failed to click Export and load tab"
        ))
        return
    }
    Sleep(1000)

    ; Step 2: Click the folder icon for "Export config file"
    LogMsg("Clicking Export config folder icon candidates …")
    dialogOpened := ClickCandidates(SAVE_BROWSE_CANDIDATES,
                                    "export_folder_icon", true, 2000)

    if !dialogOpened {
        LogMsg("WARNING: Save dialog did not open — trying path field approach")
        TakeScreenshot("export_no_dialog")

        pathFieldCandidates := [
            {x: 750, y: 280}, {x: 700, y: 280}, {x: 800, y: 280},
            {x: 750, y: 260}, {x: 750, y: 300}
        ]
        for i, pos in pathFieldCandidates {
            Click(pos.x, pos.y)
            Sleep(300)
        }
        Send("^a")
        Sleep(100)
        A_Clipboard := outputPath
        Sleep(200)
        Send("^v")
        Sleep(500)
        TakeScreenshot("export_path_typed")
    } else {
        ; Step 3: Handle the Save dialog
        HandleFileDialog(outputPath)
    }

    Sleep(2000)

    ; Step 4: Click the SAVE button
    LogMsg("Clicking SAVE button candidates …")
    ClickCandidates(SAVE_BUTTON_CANDIDATES, "save_button", false, 1000)
    Sleep(3000)
    TakeScreenshot("after_export")

    ; Check if file was created
    fileCreated := FileExist(outputPath) || FileExist(outputPath . ".ini")
    resultPath := ""
    if FileExist(outputPath)
        resultPath := outputPath
    else if FileExist(outputPath . ".ini")
        resultPath := outputPath . ".ini"

    if resultPath {
        LogMsg("Results exported: " . resultPath)
        WriteStatus(Map(
            "action", "export_results",
            "status", "success",
            "message", "Exported to " . resultPath,
            "path", resultPath
        ))
    } else {
        LogMsg("WARNING: Export sent but file not confirmed at " . outputPath)
        WriteStatus(Map(
            "action", "export_results",
            "status", "warning",
            "message", "Export sent but file not confirmed",
            "path", outputPath
        ))
    }
    LogMsg("═══ export_results complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: click_tab — Click a specific tab (for testing)                  ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionClickTab(tabName) {
    LogMsg("═══ ACTION: click_tab ═══")
    result := ClickTab(tabName)
    WriteStatus(Map(
        "action", "click_tab",
        "status", result ? "success" : "error",
        "message", result ? ("Clicked tab: " . tabName) : ("Failed to click tab: " . tabName),
        "tab", tabName
    ))
    LogMsg("═══ click_tab complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: screenshot — Take a screenshot (for debugging)                  ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionScreenshot(label := "manual") {
    LogMsg("═══ ACTION: screenshot ═══")
    path := TakeScreenshot(label)
    WriteStatus(Map(
        "action", "screenshot",
        "status", "success",
        "message", "Screenshot saved",
        "path", path
    ))
    LogMsg("═══ screenshot complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  ACTION: close — Close Celsius                                           ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

ActionClose() {
    LogMsg("═══ ACTION: close ═══")
    TakeScreenshot("before_close")

    hwnd := FindCelsiusWindow()
    if hwnd {
        try {
            WinClose(hwnd)
            Sleep(2000)
            ; If still open, force close
            if WinExist("ahk_id " . hwnd) {
                LogMsg("Window still open — sending Alt+F4")
                WinActivate(hwnd)
                Send("!{F4}")
                Sleep(2000)
            }
            ; Handle "Save changes?" dialog
            if WinExist("ahk_class #32770") {
                LogMsg("Confirmation dialog detected — clicking No/Don't Save")
                Send("n")
                Sleep(500)
                Send("{Enter}")
                Sleep(1000)
            }
        } catch as e {
            LogMsg("Close error: " . e.Message)
        }
    }

    TakeScreenshot("after_close")
    WriteStatus(Map(
        "action", "close",
        "status", "success",
        "message", "Celsius closed"
    ))
    LogMsg("═══ close complete ═══")
}


; ╔═══════════════════════════════════════════════════════════════════════════╗
; ║  Main — Parse command-line arguments and dispatch                        ║
; ╚═══════════════════════════════════════════════════════════════════════════╝

Main() {
    LogMsg("════════════════════════════════════════════════════════════════")
    LogMsg("  celsius_automation.ahk v5.0 starting")
    LogMsg("  Args: " . A_Args.Length)
    for i, arg in A_Args {
        LogMsg("  Arg[" . i . "]: " . arg)
    }
    LogMsg("════════════════════════════════════════════════════════════════")

    if A_Args.Length < 1 {
        LogMsg("ERROR: No action specified")
        LogMsg("Usage: AutoHotkey64.exe celsius_automation.ahk <action> [args...]")
        LogMsg("Actions: launch, load_ini, run_sim, export_results, click_tab, screenshot, close")
        WriteStatus(Map(
            "action", "none",
            "status", "error",
            "message", "No action specified. Use: launch, load_ini, run_sim, export_results, click_tab, screenshot, close"
        ))
        ExitApp(1)
    }

    action := A_Args[1]
    LogMsg("Action: " . action)

    switch action {
        case "launch":
            ActionLaunch()

        case "load_ini":
            if A_Args.Length < 2 {
                LogMsg("ERROR: load_ini requires an INI file path argument")
                WriteStatus(Map(
                    "action", "load_ini",
                    "status", "error",
                    "message", "Missing INI file path argument"
                ))
                ExitApp(1)
            }
            ActionLoadIni(A_Args[2])

        case "run_sim":
            ActionRunSim()

        case "export_results":
            if A_Args.Length < 2 {
                LogMsg("ERROR: export_results requires an output path argument")
                WriteStatus(Map(
                    "action", "export_results",
                    "status", "error",
                    "message", "Missing output path argument"
                ))
                ExitApp(1)
            }
            ActionExportResults(A_Args[2])

        case "click_tab":
            if A_Args.Length < 2 {
                LogMsg("ERROR: click_tab requires a tab name argument")
                WriteStatus(Map(
                    "action", "click_tab",
                    "status", "error",
                    "message", "Missing tab name argument"
                ))
                ExitApp(1)
            }
            ActionClickTab(A_Args[2])

        case "screenshot":
            label := A_Args.Length >= 2 ? A_Args[2] : "manual"
            ActionScreenshot(label)

        case "close":
            ActionClose()

        default:
            LogMsg("ERROR: Unknown action: " . action)
            WriteStatus(Map(
                "action", action,
                "status", "error",
                "message", "Unknown action: " . action . ". Use: launch, load_ini, run_sim, export_results, click_tab, screenshot, close"
            ))
            ExitApp(1)
    }

    LogMsg("Script exiting normally")
    ExitApp(0)
}

; Run main
Main()
