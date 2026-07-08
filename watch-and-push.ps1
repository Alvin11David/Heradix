param(
    [int]$DebounceSeconds = 5,
    [string]$RepoPath = "."
)

$RepoPath = Resolve-Path $RepoPath
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Auto Watch & Push" -ForegroundColor Cyan
Write-Host "  Repo: $RepoPath" -ForegroundColor Cyan
Write-Host "  Branch: $(git -C $RepoPath rev-parse --abbrev-ref HEAD)" -ForegroundColor Cyan
Write-Host "  Debounce: ${DebounceSeconds}s" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- Initial commit of any existing changes ---
Write-Host "(init) Checking for existing uncommitted changes..." -ForegroundColor Yellow
Push-Location $RepoPath
$status = git status --porcelain
if ($status) {
    Write-Host "(init) Found existing changes - committing and pushing..." -ForegroundColor Yellow
    git add -A
    $message = "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $message
    if ($LASTEXITCODE -eq 0) {
        Write-Host "(init) Pushing..." -ForegroundColor Yellow
        git push origin HEAD 2>&1 | ForEach-Object { Write-Host "  $_" }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "(init) Push successful." -ForegroundColor Green
        } else {
            Write-Host "(init) PUSH FAILED (exit code: $LASTEXITCODE). Check credentials." -ForegroundColor Red
        }
    }
} else {
    Write-Host "(init) Working tree clean." -ForegroundColor Green
}
Pop-Location

# --- File watcher ---
$changedFiles = [System.Collections.Concurrent.ConcurrentDictionary[string, DateTime]]::new()

$watcher = [System.IO.FileSystemWatcher]::new($RepoPath)
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::DirectoryName -bor [System.IO.NotifyFilters]::LastWrite
$watcher.EnableRaisingEvents = $true

$action = {
    $path = $Event.SourceEventArgs.FullPath
    # Skip .git, node_modules, dist
    if ($path -match '\\.git\\' -or $path -match '\\node_modules\\' -or $path -match '\\dist\\') {
        return
    }
    $changedFiles[$path] = [DateTime]::UtcNow
}

Register-ObjectEvent $watcher "Created" -Action $action > $null
Register-ObjectEvent $watcher "Changed" -Action $action > $null
Register-ObjectEvent $watcher "Deleted" -Action $action > $null
Register-ObjectEvent $watcher "Renamed" -Action $action > $null

function New-CommitMessage {
    param([string[]]$Files)
    $dirs = $Files | ForEach-Object { [System.IO.Path]::GetRelativePath($RepoPath, $_) }
    $features = $dirs | ForEach-Object { if ($_ -match 'features\\([^\\]+)') { $matches[1] } } | Select-Object -Unique
    if ($features.Count -gt 0) { return "feat: update $($features -join ', ')" }
    $areas = $dirs | ForEach-Object { if ($_ -match '^(core|shared|assets|environments)\\([^\\]+)') { "$($matches[1])/$($matches[2])" } } | Select-Object -Unique
    if ($areas.Count -gt 0) { return "chore: update $($areas -join ', ')" }
    return "Auto-commit: $(Get-Date -Format 'HH:mm:ss')"
}

Write-Host "(watch) Listening for file changes..." -ForegroundColor Cyan

try {
    while ($true) {
        Start-Sleep -Seconds $DebounceSeconds

        $now = [DateTime]::UtcNow
        $cutoff = $now.AddSeconds(-$DebounceSeconds)

        $ready = $changedFiles.GetEnumerator() | Where-Object { $_.Value -le $cutoff }
        if ($ready.Count -eq 0) { continue }

        $filesToCommit = @()
        foreach ($kv in $ready) {
            $null = $changedFiles.TryRemove($kv.Key, [ref]$null)
            $filesToCommit += $kv.Key
        }

        if ($changedFiles.Count -gt 0) {
            Write-Host "  Waiting for files to settle..." -ForegroundColor DarkYellow
            continue
        }

        Write-Host "$(Get-Date -Format 'HH:mm:ss') $($filesToCommit.Count) file(s) changed" -ForegroundColor Yellow

        Push-Location $RepoPath
        git add -A 2>&1 | Out-Null

        $status = git status --porcelain
        if (-not $status) { Pop-Location; continue }

        $message = New-CommitMessage -Files $filesToCommit
        Write-Host "  Commit: $message" -ForegroundColor Green
        git commit -m $message
        if ($LASTEXITCODE -ne 0) { Pop-Location; continue }

        Write-Host "  Pushing to origin..." -ForegroundColor Cyan
        git push origin HEAD 2>&1 | ForEach-Object { Write-Host "    $_" }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Done." -ForegroundColor Green
        } else {
            Write-Host "  PUSH FAILED (exit code: $LASTEXITCODE). Credentials may be needed." -ForegroundColor Red
        }
        Pop-Location
    }
}
finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Get-EventSubscriber | Unregister-Event -Force -ErrorAction SilentlyContinue
    Write-Host "(stop) Watcher stopped." -ForegroundColor Cyan
}
