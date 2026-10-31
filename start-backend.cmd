@echo off
cd /d "%~dp0"
if exist ".env" (
    for /f "usebackq tokens=1* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)
call .\mvnw.cmd spring-boot:run
