# Senior Project

A full-stack web application built with Next.js frontend and FastAPI backend.

## Project Structure

```
senior-project/
├── frontend/          # Next.js React application
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/           # FastAPI Python application
│   ├── app/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
└── README.md
```

## Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Geist Fonts** - Typography

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **SQLAlchemy** - ORM (ready for database integration)

## Quick Start

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at http://localhost:3000

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend will be available at http://localhost:8000

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

Both frontend and backend support hot reloading during development. The backend is configured with CORS to allow requests from the frontend development server.
