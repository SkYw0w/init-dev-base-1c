Param(
    [string]$projectPath,
    [string]$basesPath,
    [string]$src_cf,
    [string]$v8version
)

$ErrorActionPreference = 'Stop'

if (-not $projectPath -or -not (Test-Path $projectPath)) {
    throw "Некорректный projectPath: '$projectPath'"
}
if (-not $basesPath) {
    throw "Не указан basesPath"
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

# Создаем worktree
git worktree add -b $ib_name $worktreeDir

# Скрываем изменения worktree в git панели
Push-Location $projectPath
try {
    git update-index --skip-worktree $worktreeDir
}
finally {
    Pop-Location
}

Push-Location $worktreeDir
try {
    vrunner init-dev --src $src_cf_path --ibcmd --ibconnection "/F$ib_dir" --v8version $v8version
    vrunner updatedb --ibconnection "/F$ib_dir" --ibcmd --v8version $v8version
}
finally {
    Pop-Location
    
    # Восстанавливаем отслеживание изменений
    Push-Location $projectPath
    try {
        git update-index --no-skip-worktree $worktreeDir
    }
    finally {
        Pop-Location
    }
    
    # Удаляем worktree
    git worktree remove $worktreeDir
}
