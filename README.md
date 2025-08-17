# Star Wars App

A full-stack Star Wars data browser application built with NestJS backend and React frontend, featuring SWAPI integration with caching and performance metrics.

## Architecture

- **Backend**: NestJS API server with MongoDB and Redis integration
- **Frontend**: React application with React Router and Tailwind CSS
- **Database**: MongoDB for storing metrics and cached reports
- **Cache**: Redis for improved performance
- **Deployment**: Docker Compose orchestration

## Prerequisites

- Docker and Docker Compose installed on your system

## Getting Started

### 1. Setup Environment

Copy the sample environment file to create your local configuration:

```bash
cp .env.sample .env
```

### 2. Run the Application

Start all services with Docker Compose:

```bash
docker compose up
```

This will:

- Build and start the backend API (NestJS)
- Build and start the frontend webapp (React)
- Start MongoDB database
- Start Redis cache

### 3. Access the Application

Once all services are running:

- **Web Application**: http://localhost:5173
- **API Endpoints**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/docs

## API Testing

A Postman collection is available at `SWAPI.postman_collection.json` that includes sample requests for all API endpoints:

- Health check
- Search people by name
- Get person details
- Search movies by title
- Get movie details
- Get metrics report

Import this collection into Postman to easily test the API endpoints.

## Development

### Backend (NestJS)

Located in `/backend` directory:

```bash
cd backend
npm install
npm run start:dev  # Development mode with hot reload
```

### Frontend (React)

Located in `/webapp` directory:

```bash
cd webapp
npm install
npm run dev  # Development mode with Vite
```
