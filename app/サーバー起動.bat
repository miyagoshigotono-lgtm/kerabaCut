@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ケラバ図メーカー ローカルサーバー
echo.
echo   ケラバ図メーカー をこのパソコンで配信します。
echo   このウィンドウは開いたままにしてください（閉じると止まります）。
echo.
echo   このパソコン         http://localhost:8080/
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } ^| ForEach-Object { '  ほかのパソコンから   http://' + $_.IPAddress + ':8080/' }"
echo.
python -m http.server 8080
pause
