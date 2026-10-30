@echo off
cd /d "D:\Movies and Web se\paypal"
if exist ".env" (
    for /f "usebackq tokens=1* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)
call .\mvnw.cmd spring-boot:run
