# AI Interview Simulator

A full-stack web application that helps users practice technical and behavioral interviews with real-time AI-powered evaluation and feedback.

## Overview

AI Interview Simulator lets users select an interview category (Python, Web Development, Cloud Computing, or HR & Behavioral), answer a series of AI-generated questions, and receive instant scoring and feedback powered by OpenAI. The app tracks performance over time through a personalized dashboard and analytics page, helping users identify strengths and areas to improve before a real interview.

## Features

- **User Authentication** — secure registration and login using JWT (access + refresh tokens)
- **AI-Generated Questions** — dynamically generated based on interview type and difficulty level
- **AI Evaluation** — answers are scored out of 10 with detailed feedback, strengths, and improvement areas using the OpenAI API
- **Interview Management** — create, resume, view results, and delete interview sessions
- **Dashboard** — overview of total interviews, average score, current streak, and skill-wise performance
- **Analytics** — performance trends over time, skill breakdown, and personalized recommendations
- **Profile Management** — update profile details and change password

## Tech Stack

**Backend**
- FastAPI (Python)
- MySQL (via SQLAlchemy ORM)
- Redis (caching)
- JWT Authentication (python-jose, passlib)
- OpenAI API for question generation and answer evaluation
- Docker & Docker Compose
- Nginx (reverse proxy)

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React UI   │ ───▶ │  FastAPI API │ ───▶ │   MySQL DB   │
│  (Vite/TS)   │ ◀─── │   (Docker)   │ ◀─── │  (Docker)    │
└─────────────┘      └──────┬───────┘      └─────────────┘
                              │
                      ┌───────┴───────┐
                      │   OpenAI API   │
                      │  Redis Cache   │
                      └───────────────┘
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker Desktop
- An OpenAI API key (optional — the app falls back to sample questions/evaluations without one)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Add your OpenAI API key and other settings to .env
docker-compose up -d
```

The API will be available at `http://localhost:8000`. Interactive API docs are at `http://localhost:8000/docs`.

### Frontend Setup

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints (Highlights)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Authenticate and receive JWT tokens |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/interviews/` | Create a new interview |
| POST | `/api/interviews/{id}/start` | Start an interview session |
| POST | `/api/interviews/submit-answer` | Submit an answer for AI evaluation |
| GET | `/api/analytics/dashboard` | Get dashboard statistics |
| GET | `/api/analytics/progress-report` | Get a weekly/monthly progress report |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── auth/         # JWT and password utilities
│   │   ├── database/     # DB connection setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic (AI, interviews, analytics)
│   │   └── utils/        # Config and helpers
│   ├── docker-compose.yml
│   └── Dockerfile
└── src/
    ├── pages/             # React pages (Login, Dashboard, Interviews, etc.)
    ├── components/        # Reusable UI components
    └── utils/             # API client and helpers
```

## Notes

This project was built as a portfolio piece to demonstrate full-stack development skills, including REST API design, authentication, containerization, database modeling, and integrating third-party AI services into a real application workflow.
