# AI Interview Simulator - Backend

A comprehensive AI-powered interview preparation platform built with FastAPI, Python, MySQL, and OpenAI.

## 🚀 Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Interview Module**: Create and manage interview sessions with AI-generated questions
- **AI Feedback**: Real-time answer evaluation with scores, strengths, weaknesses, and suggestions
- **Analytics Dashboard**: Track performance, trends, and get personalized recommendations
- **Multiple Interview Types**: HR, Python, Web Development, Cloud Computing

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                 # API endpoints (routers)
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── interviews.py   # Interview management
│   │   ├── feedback.py     # Feedback retrieval
│   │   └── analytics.py    # Dashboard analytics
│   ├── auth/               # Authentication module
│   │   ├── jwt_handler.py  # JWT token management
│   │   └── password.py     # Password hashing
│   ├── database/           # Database configuration
│   │   └── connection.py   # SQLAlchemy setup
│   ├── models/             # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── interview.py
│   │   ├── question.py
│   │   ├── answer.py
│   │   └── feedback.py
│   ├── schemas/            # Pydantic schemas
│   │   ├── user.py
│   │   ├── interview.py
│   │   ├── question.py
│   │   ├── answer.py
│   │   ├── feedback.py
│   │   └── analytics.py
│   ├── services/           # Business logic
│   │   ├── user_service.py
│   │   ├── interview_service.py
│   │   ├── ai_service.py
│   │   └── analytics_service.py
│   ├── utils/              # Utilities
│   │   ├── config.py       # Settings management
│   │   └── helpers.py      # Helper functions
│   └── main.py             # FastAPI application
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Docker Compose (development)
├── docker-compose.prod.yml # Docker Compose (production)
├── Dockerfile             # Backend Dockerfile
├── requirements.txt       # Python dependencies
└── README.md
```

## 🛠️ Setup Guide

### Prerequisites

- Python 3.11+
- MySQL 8.0+
- Docker & Docker Compose (optional)
- OpenAI API Key (optional, for AI features)

### Local Development Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up MySQL database**
   ```bash
   mysql -u root -p
   CREATE DATABASE interview_simulator;
   ```

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Setup

1. **Development environment**
   ```bash
   docker-compose up -d
   ```

2. **Production environment (AWS RDS)**
   ```bash
   # Set environment variables for AWS RDS
   export AWS_RDS_HOST=your-rds-endpoint
   export AWS_RDS_USER=admin
   export AWS_RDS_PASSWORD=your-password
   export AWS_RDS_DATABASE=interview_simulator
   export JWT_SECRET_KEY=$(openssl rand -hex 32)
   
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📚 API Documentation

Once the server is running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get tokens |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/refresh-token` | Refresh access token |

#### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/` | Create new interview |
| GET | `/api/interviews/` | List user's interviews |
| GET | `/api/interviews/{id}` | Get interview details |
| POST | `/api/interviews/{id}/start` | Start interview session |
| GET | `/api/interviews/{id}/next-question` | Get next question |
| POST | `/api/interviews/submit-answer` | Submit answer for evaluation |
| DELETE | `/api/interviews/{id}` | Delete interview |

#### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feedback/interview/{id}` | Get interview feedback |
| GET | `/api/feedback/interview/{id}/detailed` | Get detailed feedback |
| GET | `/api/feedback/history` | Get feedback history |
| GET | `/api/feedback/summary` | Get feedback summary |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard data |
| GET | `/api/analytics/overview` | Get overview stats |
| GET | `/api/analytics/skills` | Get skill analysis |
| GET | `/api/analytics/trends` | Get performance trends |
| GET | `/api/analytics/recommendations` | Get recommendations |
| GET | `/api/analytics/progress-report` | Get progress report |

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | interview_simulator |
| `JWT_SECRET_KEY` | Secret for JWT tokens | - |
| `JWT_ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | 30 |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | OpenAI model | gpt-4 |
| `CORS_ORIGINS` | Allowed origins | localhost |

## 🗄️ Database Schema

### Users Table
- id, email, username, hashed_password, full_name, bio, avatar_url
- is_active, is_verified, is_admin
- created_at, updated_at, last_login

### Interviews Table
- id, user_id, title, interview_type, difficulty, status
- total_questions, answered_questions, total_score, average_score
- created_at, started_at, completed_at

### Questions Table
- id, interview_id, question_number, question_text, question_type
- expected_keywords, ideal_answer, max_score, is_answered

### Answers Table
- id, question_id, answer_text
- score, ai_feedback, strengths, weaknesses, suggestions
- confidence_score, keywords_matched

### Feedbacks Table
- id, interview_id
- overall_score, technical_score, communication_score, problem_solving_score
- summary, overall_strengths, overall_weaknesses, improvement_suggestions
- performance_grade, percentile_rank

## 🚢 AWS Deployment

### Setting up AWS RDS

1. Create RDS MySQL instance in AWS Console
2. Configure security groups to allow your IP
3. Note the endpoint URL

### Environment Setup

```bash
# Production environment variables
export AWS_RDS_HOST=your-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
export AWS_RDS_PORT=3306
export AWS_RDS_USER=admin
export AWS_RDS_PASSWORD=your_secure_password
export AWS_RDS_DATABASE=interview_simulator
export JWT_SECRET_KEY=$(openssl rand -hex 32)
export OPENAI_API_KEY=sk-your-key
```

### Deploy with Docker

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### SSL Certificate (Let's Encrypt)

```bash
# Initial certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com

# Restart nginx to load certificate
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request
