Param(
    [string]$projectPath,
    [string]$basesPath,
    [string]$extensionPath,
    [string]$v8version = "8.3.24.1667"
)

$ErrorActionPreference = 'Stop'

if (-not $projectPath -or -not (Test-Path $projectPath)) {
    throw "Invalid projectPath: '$projectPath'"
}
if (-not $basesPath) {
    throw "basesPath not specified"
}
if (-not $extensionPath -or -not (Test-Path $extensionPath)) {
    throw "Invalid extensionPath: '$extensionPath'"
}

Push-Location $projectPath
try {
    $branch = (git rev-parse --abbrev-ref HEAD)
    $project = Split-Path -Leaf $projectPath
    $ib_name = "${project}_$branch"
    $ib_dir = Join-Path $basesPath $ib_name
    
    if (-not (Test-Path $ib_dir)) {
        throw "Информационная база не найдена: '$ib_dir'"
    }
    
    vrunner compileext "$extensionPath" "Test" --ibconnection "/F$ib_dir" --updatedb --ibcmd --v8version $v8version
} finally {
    Pop-Location
}