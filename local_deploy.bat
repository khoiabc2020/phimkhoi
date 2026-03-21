@echo off
echo Dang build Next.js (Optimization & Cache)...
npm run build
if %errorlevel% neq 0 (
  echo Lỗi trong qua trinh build.
  pause
  exit /b %errorlevel%
)
echo Build hoan tat. Dang chay deploy (Production Mode) cho anh xem...
echo Web se mo tai http://localhost:3000
npm run start
pause
