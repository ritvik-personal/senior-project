#!/bin/bash

# Start development servers for both frontend and backend

echo "Starting Senior Project Development Servers..."
echo "=============================================="

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting FastAPI backend on http://localhost:8000"
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting Next.js frontend on http://localhost:3000"
cd ../frontend
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait
