@echo off
title Kids Wordle - Build APK
color 0A

echo.
echo  ============================================
echo   Kids Wordle - Building Android APK
echo  ============================================
echo.

:: Set environment variables
set ANDROID_HOME=C:\Android\Sdk
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\build-tools\35.0.0;%PATH%

echo [1/3] Environment configured:
echo       ANDROID_HOME = %ANDROID_HOME%
echo       JAVA_HOME    = %JAVA_HOME%
echo.

:: Bundle JS into assets (required for standalone APK)
echo [2/3] Bundling JavaScript...
cd /d "%~dp0"
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"
:: Clean any previously bundled raw assets so the bundler regenerates them fresh
if exist "android\app\src\main\res\raw" rmdir /s /q "android\app\src\main\res\raw"
:: --assets-dest is required so WAV/PNG assets land in res/raw and get packaged into the APK
call npx expo export:embed --platform android --dev false --entry-file node_modules/expo/AppEntry.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  JS BUNDLE FAILED. Check the output above for errors.
    pause
    exit /b 1
)
echo  Bundle complete!
echo.

:: Build APK
echo [3/3] Building APK (this takes 5-8 minutes, please wait)...
echo.

cd /d "%~dp0android"
:: Stop any stale Gradle daemons first (they hold locks on app\build files)
echo  Stopping any stale Gradle daemons...
call gradlew.bat --stop 2>nul
:: Kill any leftover Java processes (covers daemons that didn't shut down cleanly)
taskkill /F /IM java.exe 2>nul
taskkill /F /IM javaw.exe 2>nul
:: Wait briefly for Windows to release file handles after taskkill
ping 127.0.0.1 -n 3 >nul
:: Wipe the whole build dir to avoid Windows file-lock issues
if exist "app\build" rmdir /s /q "app\build" 2>nul
if exist ".gradle" rmdir /s /q ".gradle" 2>nul
:: Wipe per-module build dirs inside node_modules (Windows `for /d` doesn't expand
:: middle-path wildcards, so iterate over the parent then drill in).
echo  Cleaning module build directories...
for /d %%D in ("..\node_modules\expo*") do (
    if exist "%%D\android\build" rmdir /s /q "%%D\android\build" 2>nul
)
for /d %%D in ("..\node_modules\@react-native\*") do (
    if exist "%%D\android\build" rmdir /s /q "%%D\android\build" 2>nul
)
if exist "..\node_modules\react-native\ReactAndroid\build" rmdir /s /q "..\node_modules\react-native\ReactAndroid\build" 2>nul
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  ============================================
    echo   SUCCESS! APK built!
    echo  ============================================
    echo.
    echo  APK location:
    echo  %~dp0android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo  Opening APK folder...
    explorer "%~dp0android\app\build\outputs\apk\debug"
) else (
    echo.
    echo  BUILD FAILED. Check the output above for errors.
)

echo.
pause
