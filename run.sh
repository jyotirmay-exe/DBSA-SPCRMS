#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Backend in new terminal tab
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/backend' && source venv/bin/activate && uvicorn main:app --reload\""

# Frontend in another new terminal tab
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/frontend' && npm run dev\""

echo "Backend → http://localhost:8000/docs"
echo "Frontend → http://localhost:5173"
