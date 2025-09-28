# Docker Setup for CampusFin

This document explains how to run the CampusFin application using Docker containers.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your actual Supabase credentials
   ```

2. **Start the application:**
   ```bash
   chmod +x docker-start.sh
   ./docker-start.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Manual Docker Commands

### Build and start all services:
```bash
docker-compose up --build -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services:
```bash
docker-compose down
```

### Rebuild specific service:
```bash
docker-compose build backend
docker-compose up -d backend
```

## Environment Variables

Required environment variables in `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLIC_KEY=your_supabase_anon_key

# JWT Configuration
SECRET_KEY=your-secret-key-here

# Environment
ENVIRONMENT=production
```

## Service Details

### Backend (FastAPI)
- **Port:** 8000
- **Health Check:** http://localhost:8000/api/health
- **API Docs:** http://localhost:8000/docs
- **Base Image:** Python 3.12-slim

### Frontend (Next.js)
- **Port:** 3000
- **Health Check:** Built-in Next.js health check
- **Base Image:** Node.js 18-alpine (multi-stage build)

## Development vs Production

### Development Mode
For development with hot reloading:
```bash
# Start backend with volume mounting for live reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production Mode
The default `docker-compose.yml` is optimized for production with:
- Multi-stage builds for smaller images
- Non-root users for security
- Health checks
- Proper restart policies

## Troubleshooting

### Services won't start
1. Check if ports 3000 and 8000 are available
2. Verify your `.env` file has correct values
3. Check logs: `docker-compose logs`

### Database connection issues
1. Verify Supabase URL and key in `.env`
2. Check if Supabase project is active
3. Test connection: `curl http://localhost:8000/api/health`

### Frontend not connecting to backend
1. Ensure backend is healthy: `curl http://localhost:8000/api/health`
2. Check CORS configuration in backend
3. Verify `NEXT_PUBLIC_API_URL` environment variable

### Clean rebuild
```bash
# Stop everything and remove containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

## Performance Optimization

### For better performance:
1. Use `.dockerignore` files to exclude unnecessary files
2. Leverage Docker layer caching by copying `requirements.txt`/`package.json` first
3. Use multi-stage builds for smaller production images
4. Run health checks to ensure services are ready

### Resource limits (optional):
Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Security Notes

- Both containers run as non-root users
- Health checks ensure services are properly initialized
- Environment variables are passed securely
- Production builds exclude development dependencies
