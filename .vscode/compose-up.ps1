# Starts Docker Desktop if needed (after asking), then runs docker compose up in src/.

function Test-DockerEngine {
    docker info *> $null
    return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerEngine)) {
    $answer = Read-Host "Docker engine is not running. Start Docker Desktop? (Y/N)"
    if ($answer -notmatch '^[Yy]') {
        Write-Host "Skipped. Start Docker Desktop and run the task again (Ctrl+Shift+B)."
        exit 0
    }

    # Docker Desktop 4.37+ can start the engine from the CLI without opening the window.
    docker desktop start *> $null
    if ($LASTEXITCODE -ne 0) {
        $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
        if (-not (Test-Path $dockerDesktop)) {
            Write-Host "Docker Desktop not found at $dockerDesktop"
            exit 1
        }
        Start-Process $dockerDesktop
    }

    Write-Host -NoNewline "Waiting for Docker engine"
    $timeout = (Get-Date).AddMinutes(3)
    while (-not (Test-DockerEngine)) {
        if ((Get-Date) -gt $timeout) {
            Write-Host "`nDocker engine did not start within 3 minutes."
            exit 1
        }
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 3
    }
    Write-Host " ready."
}

docker compose up
