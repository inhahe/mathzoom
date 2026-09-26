# Run one page of the project in headless Chrome once and report the result.
#
#   dev\run-chrome.ps1 -Page towers.html -Query "t=30&bench"   -> prints the page title
#                                                                 ("BENCH x ms/frame, ...")
#   dev\run-chrome.ps1 -Page arrows.html -Query "t=30&click=0" -Shot C:\tmp\a.png
#                                                              -> saves a screenshot
#
# Headless Chrome only advances its virtual clock while the page is idle, so on a
# heavily loaded machine a run can stall; hence the timeout. The run uses its own
# throwaway profile (never the user's), and on timeout kills only the Chrome
# process tree this script started, by PID.
param(
  [string]$Page = "towers.html",
  [string]$Query = "t=0",
  [string]$Shot = "",
  [int]$Width = 1600, [int]$Height = 900,
  [int]$TimeoutSec = 120,
  [int]$Budget = 2000
)
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$page = (Resolve-Path (Join-Path $PSScriptRoot "..\$Page")).Path
$url = ([Uri]$page).AbsoluteUri + "?" + $Query
$prof = Join-Path $env:TEMP ("mathzoom-prof-" + [guid]::NewGuid().ToString("N"))
$out = Join-Path $env:TEMP ("mathzoom-out-" + [guid]::NewGuid().ToString("N") + ".txt")
$cargs = @("--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
           "--no-default-browser-check", "--user-data-dir=`"$prof`"",
           "--window-size=$Width,$Height", "--virtual-time-budget=$Budget")
if ($Shot) { $cargs += "--screenshot=`"$Shot`"" } else { $cargs += "--dump-dom" }
$cargs += "`"$url`""
$p = Start-Process -FilePath $chrome -ArgumentList $cargs -PassThru -NoNewWindow `
       -RedirectStandardOutput $out -RedirectStandardError "$out.err"
if (-not $p.WaitForExit($TimeoutSec * 1000)) {
  Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $p.Id } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }
  try { Stop-Process -Id $p.Id -Force -ErrorAction Stop } catch {}
  Write-Output "TIMEOUT after $TimeoutSec s"
} elseif ($Shot) {
  Write-Output ("screenshot " + $(if (Test-Path $Shot) { "saved: $Shot" } else { "MISSING" }))
} else {
  $dom = Get-Content $out -Raw
  if ($dom -match "<title>([^<]*)") { Write-Output $Matches[1] } else { Write-Output "NO TITLE" }
}
Start-Sleep -Milliseconds 300
Remove-Item -Recurse -Force $prof -ErrorAction SilentlyContinue
Remove-Item -Force $out, "$out.err" -ErrorAction SilentlyContinue
