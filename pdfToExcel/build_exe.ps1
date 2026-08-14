param(
    [string]$OutputName = "PdfToExcel"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$python = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    throw "가상환경의 Python을 찾을 수 없습니다: $python"
}

& $python -m pip install --upgrade pip
& $python -m pip install -r requirements.txt
& $python -m PyInstaller --noconfirm --clean --onefile --windowed --name $OutputName pdf_to_excel.py

$distExe = Join-Path $projectRoot "dist\$OutputName.exe"
if (-not (Test-Path $distExe)) {
    throw "EXE 생성에 실패했습니다: $distExe"
}

Write-Host "완료: $distExe"
