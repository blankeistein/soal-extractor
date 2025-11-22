@echo off
title 📦 Node Serve Runner (Safe Mode)
color 0E

echo ---------------------------------------------
echo 🔍 Mengecek instalasi 'serve'...
echo ---------------------------------------------

:: 1. Cek apakah 'serve' sudah terinstall
where serve >nul 2>nul
if %errorlevel% neq 0 (
    goto :NotInstalled
)

:: 2. Jika ada, lanjut setup
cls
echo ---------------------------------------------
echo ✅ Serve ditemukan! Menjalankan server...
echo 🚀 Target: http://localhost:3000
echo ---------------------------------------------

:: Buka browser (tunggu 1 detik biar aman)
timeout /t 1 >nul
start http://localhost:3000

:: 3. Jalankan serve (Flag -s untuk SPA support)
:: Jika command ini gagal/crash, dia akan lompat ke blok (...)
call serve -s ./dist -l 3000 || (
    echo.
    echo ---------------------------------------------
    echo 🛑 CRITICAL ERROR TERDETEKSI
    echo ---------------------------------------------
    echo Script berhenti karena ada masalah saat runtime.
    echo Silakan baca pesan error di atas.
    echo.
    color 0C
    pause
    exit
)

:: Normal exit jika user menutup server dengan CTRL+C
exit

:NotInstalled
color 0C
echo.
echo 🛑 ERROR: Command 'serve' tidak ditemukan!
echo ---------------------------------------------
echo 💡 Solusi:
echo Kamu belum install package-nya. Jalankan command ini:
echo npm install -g serve
echo.
pause