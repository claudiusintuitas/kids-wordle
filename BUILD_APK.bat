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
