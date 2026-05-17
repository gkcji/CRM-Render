@echo off
echo Starting Aura CRM...
start cmd /k "cd backend && node index.js"
start cmd /k "cd frontend && npm run dev"
echo CRM Backend and Frontend are starting.
pause
