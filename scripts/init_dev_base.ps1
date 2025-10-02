Param(
    [string]$projectPath,
    [string]$basesPath,
    [string]$src_cf,
    [string]$v8version
)

$ErrorActionPreference = 'Stop'

if (-not $projectPath -or -not (Test-Path $projectPath)) {
    throw "Invalid projectPath: '$projectPath'"
}
if (-not $basesPath) {
    throw "Not specified basesPath"
}

Push-Location $projectPath
try {
    $branch = (git rev-parse --abbrev-ref HEAD)
    $project = Split-Path -Leaf $projectPath
    $ib_name = "${project}_$branch"
    $src_cf_path = Join-Path $projectPath $src_cf
}
finally {
    Pop-Location
}

$ib_dir = Join-Path $basesPath $ib_name
New-Item -ItemType Directory -Force -Path $ib_dir | Out-Null

$worktreeDir = Join-Path (Split-Path $projectPath) $ib_name

Push-Location $projectPath
try {
    git worktree prune | Out-Null

    git rev-parse --verify --quiet $ib_name 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        git branch -D $ib_name | Out-Null
    }

    git worktree add --detach $worktreeDir
}
finally {
    Pop-Location
}

if (-not (Test-Path $worktreeDir)) {
    throw "Failed to create worktree: '$worktreeDir'"
}

Push-Location $worktreeDir
try {
    git update-index --skip-worktree .
    
    vrunner init-dev --src $src_cf_path --ibcmd --ibconnection "/F$ib_dir" --v8version $v8version
}
finally {
    Pop-Location
    
    Push-Location $worktreeDir
    try {
        git update-index --no-skip-worktree .
    }
    finally {
        Pop-Location
    }
    
    Push-Location $projectPath
    try {
        git worktree remove --force $worktreeDir
        git worktree prune | Out-Null
    }
    finally {
        Pop-Location
    }
}
