@echo off
setlocal
cd /d "%~dp0"
if exist "dist\PdfToExcel.exe" (
    start "" "%~dp0dist\PdfToExcel.exe"
) else (
    echo EXE file not found. Run build_exe.ps1 first.
    pause
)
