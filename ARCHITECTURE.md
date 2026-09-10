# AI-Powered DevSecOps Security Platform - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [AI Architecture](#ai-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability Considerations](#scalability-considerations)

---

## System Overview

The AI-Powered DevSecOps Security Platform is a full-stack web application designed for automated static code security analysis with AI-powered intelligence. The system follows a modern microservices-inspired architecture with clear separation of concerns between frontend, backend, and AI services.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                    (React + TypeScript)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                      (FastAPI backend)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth Service│  │  Scan Service│  │  Report Svc  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  AI Service  │  │  Risk Engine │  │  Assistant   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│                    (SQLite + SQLAlchemy)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Patterns

### 1. Layered Architecture

The system follows a classic layered architecture pattern:

- **Presentation Layer**: React frontend with TypeScript
- **Application Layer**: FastAPI backend with service-oriented design
- **Data Layer**: SQLite database with SQLAlchemy ORM

### 2. Service-Oriented Architecture

backend services are organized as independent modules:

- **Authentication Service**: JWT token management and authorization
- **Scan Service**: File upload and Bandit integration
- **Report Service**: Multi-format report generation
- **AI Service**: Vulnerability analysis and risk scoring
- **Security Assistant Service**: Interactive chatbot functionality

### 3. Repository Pattern

Database access is abstracted through SQLAlchemy models:

- `User`: User authentication data
- `ScanHistory`: Scan records and metadata
- `AIAnalysis`: AI-generated vulnerability explanations
- `RiskHistory`: Risk score historical data
- `AuditLog`: System audit trail

---

## Component Architecture

### Frontend Components

#### Page Components
```
src/pages/
├── Login.tsx              # Authentication interface
├── Register.tsx           # User registration (Phase 4)
├── Dashboard.tsx          # Security metrics dashboard
├── Upload.tsx             # File upload interface
├── History.tsx            # Scan history with pagination
├── Reports.tsx            # Reports management with AI integration
├── AIAnalysis.tsx         # AI vulnerability analysis (Phase 4)
├── RiskScoring.tsx        # Risk scoring interface (Phase 4)
└── SecurityAssistant.tsx  # AI chatbot (Phase 4)
```

#### Service Components
```
src/services/
└── api.ts                 # Axios instance with JWT interceptor
```

#### Layout Components
```
src/components/
├── layout/
│   └── Navbar.tsx         # Navigation bar
└── dashboard/             # Dashboard widgets
```

#### Context & Routes
```
src/context/
└── AuthContext.tsx        # Authentication state management

src/routes/
└── ProtectedRoute.tsx     # Route protection wrapper
```

### backend Components

#### Router Components
```
backend/routers/
├── auth.py                # Authentication endpoints
├── upload.py              # File upload endpoints
├── dashboard.py           # Dashboard data endpoints
├── reports.py             # Report management endpoints
├── ai_analysis.py         # AI analysis endpoints (Phase 3)
├── ai_risk.py             # Risk scoring endpoints (Phase 3)
├── ai_reports.py          # AI report endpoints (Phase 3)
└── security_assistant.py  # Chatbot endpoints (Phase 3)
```

#### Service Components
```
backend/services/
├── ai_service.py          # AI service abstraction
├── vulnerability_analyzer.py  # Vulnerability explanation
├── risk_engine.py         # Risk scoring logic
├── report_generator.py    # AI report generation
├── security_assistant.py  # Chatbot logic
├── security_knowledge_base.py  # Security profiles
└── scan_report_loader.py  # Bandit report parsing
```

#### Authentication Components
```
backend/auth/
├── jwt_handler.py         # JWT token generation
├── dependencies.py        # JWT validation middleware
└── roles.py               # Role-based authorization
```

#### Database Components
```
backend/database/
├── database.py            # SQLAlchemy setup
└── models.py              # Database models
```

---

## Data Flow

### Authentication Flow

```
1. User submits credentials
   ↓
2. Frontend calls POST /api/v1/auth/login
   ↓
3. backend validates credentials
   ↓
4. backend generates JWT token
   ↓
5. Token returned to frontend
   ↓
6. Token stored in localStorage
   ↓
7. Token included in all subsequent API calls
   ↓
8. backend validates token on protected routes
```

### File Upload and Scan Flow

```
1. User selects Python file
   ↓
2. Frontend validates file type and size
   ↓
3. Frontend calls POST /api/v1/upload
   ↓
4. backend validates file (type, size, content)
   ↓
5. backend saves file to uploads/ directory
   ↓
6. backend triggers Bandit scanner
   ↓
7. Bandit generates JSON and TXT reports
   ↓
8. backend parses Bandit results
   ↓
9. backend generates PDF report
   ↓
10. backend saves scan record to database
   ↓
11. backend logs audit trail
   ↓
12. Results returned to frontend
```

### AI Analysis Flow

```
1. User requests AI analysis for scan
   ↓
2. Frontend calls POST /api/v1/ai/analyze/{scan_id}
   ↓
3. backend loads Bandit report
   ↓
4. backend calls Vulnerability Analyzer service
   ↓
5. Service checks for existing AI analysis in database
   ↓
6. If not found:
   - Service extracts vulnerability details
   - Service queries Knowledge Base
   - If AI enabled: calls LLM for analysis
   - If AI disabled: uses Knowledge Base only
   - Service generates detailed explanations
   - Service saves to database
   ↓
7. Analysis returned to frontend
```

### Risk Scoring Flow

```
1. User requests risk score
   ↓
2. Frontend calls GET /api/v1/ai/risk/score/{scan_id}
   ↓
3. backend loads scan data
   ↓
4. backend calls Risk Engine service
   ↓
5. Risk Engine:
   - Calculates severity weights
   - Applies confidence factors
   - Considers historical trends
   - Generates 0-100 score
   - Determines risk level
   ↓
6. Score saved to RiskHistory
   ↓
7. Score returned to frontend
```

---

## Security Architecture

### Authentication & Authorization

**JWT-Based Authentication:**
- Token-based stateless authentication
- Token expiration: 24 hours
- Secret key configuration via environment variable
- Token validation on all protected routes

**Role-Based Access Control:**
- Admin role for all operations
- Role validation in auth dependencies
- Audit logging for all admin actions

### Data Security

**File Upload Security:**
- File type validation (.py only)
- File size limits (10MB max)
- Content validation before processing
- Secure file storage in isolated directory

**API Security:**
- CORS configuration for frontend-backend communication
- Input validation on all endpoints
- SQL injection prevention via SQLAlchemy ORM
- XSS prevention in frontend

**Secrets Management:**
- Environment variables for sensitive data
- No hardcoded credentials in source code
- .env file for local development
- Secret rotation recommendations in docs

---

## AI Architecture

### AI Service Abstraction

The AI service provides a unified interface for LLM integration:

```python
class AIService:
    def analyze_vulnerability(self, vuln_data: dict) -> str:
        # Unified interface for vulnerability analysis
        # Falls back to knowledge base if AI disabled
        pass
```

### Knowledge Base Integration

**Structured Security Profiles:**
- Bandit test ID mappings
- CWE (Common Weakness Enumeration) references
- Detailed vulnerability descriptions
- Remediation guidelines
- Secure coding examples

### LLM Integration (Optional)

**OpenAI API Integration:**
- Configurable via environment variables
- Request timeout handling
- Fallback to knowledge base on failure
- Cost control via request limits

### AI Features

**Vulnerability Analyzer:**
- Simple explanations for non-technical users
- Technical explanations for developers
- Business impact assessment
- Attack scenario descriptions
- Risk reasoning
- Recommended remediation
- Secure coding examples

**Risk Engine:**
- Severity-weighted scoring
- Confidence factor adjustment
- Historical trend analysis
- Risk level classification
- Trend direction calculation

**Report Generator:**
- Executive summary generation
- Security score aggregation
- Vulnerability overview
- Critical findings prioritization
- Recommended actions compilation
- PDF-ready structure generation

**Security Assistant:**
- Context-aware conversations
- Session management
- Question processing
- Knowledge base queries
- LLM integration for complex queries

---

## Deployment Architecture

### Docker Containerization

**backend Container:**
- Base image: Python 3.12 slim
- Multi-stage build for optimization
- Volume mounts for uploads, reports, database
- Port 8000 exposed
- Health check endpoint

**Frontend Container:**
- Base image: Node 20 Alpine for build
- Nginx Alpine for production
- Multi-stage build (build + serve)
- Port 80 exposed
- Nginx reverse proxy configuration

### Docker Compose Orchestration

**Network Architecture:**
- Bridge network for service communication
- Service discovery via container names
- Frontend proxies API calls to backend

**Volume Management:**
- Persistent volumes for database
- Shared volumes for uploads and reports
- Log volume for application logs

**Environment Configuration:**
- Environment variables for AI configuration
- Secret key configuration
- Database path configuration

### Production Deployment Considerations

**Load Balancing:**
- Nginx can be configured as load balancer
- Multiple backend instances supported
- Frontend static files served efficiently

**Scaling:**
- backend: Horizontal scaling with load balancer
- Frontend: CDN for static assets
- Database: Migration to PostgreSQL for scaling

**Monitoring:**
- Application logging to files
- Health check endpoints
- Docker container monitoring
- Future: Prometheus/Grafana integration

---

## Scalability Considerations

### Current Limitations

- SQLite database (single-file, limited concurrency)
- No caching layer
- No background task queue
- Synchronous AI API calls

### Recommended Improvements

**Database Scaling:**
- Migrate to PostgreSQL
- Implement connection pooling
- Add read replicas for reporting

**Caching:**
- Add Redis for session storage
- Cache frequently accessed scan results
- Cache AI analysis results

**Background Tasks:**
- Implement Celery for async tasks
- Queue large file scans
- Async AI analysis processing

**API Optimization:**
- Implement pagination for all list endpoints
- Add response compression
- Optimize database queries with indexes

**Frontend Optimization:**
- Implement code splitting
- Add lazy loading for routes
- Optimize bundle size
- Add service worker for caching

---

## Technology Rationale

### backend Technology Choices

**FastAPI:**
- Modern, fast Python web framework
- Automatic API documentation (Swagger)
- Type hints for better code quality
- Async support for future scalability

**SQLAlchemy:**
- Powerful ORM with excellent Python integration
- Database-agnostic design
- Migration support via Alembic
- Query optimization capabilities

**SQLite:**
- Zero configuration for development
- Sufficient for small to medium deployments
- Easy backup and migration
- Built-in Python support

### Frontend Technology Choices

**React:**
- Component-based architecture
- Large ecosystem and community
- Virtual DOM for performance
- Excellent TypeScript support

**TypeScript:**
- Type safety reduces bugs
- Better IDE support
- Improved code documentation
- Easier refactoring

**Vite:**
- Fast development server
- Optimized production builds
- Modern ES modules support
- Hot module replacement

---

## Conclusion

The AI-Powered DevSecOps Security Platform architecture demonstrates modern full-stack development practices with clear separation of concerns, security-first design, and AI integration capabilities. The architecture is designed to be:

- **Maintainable**: Clear module boundaries and documentation
- **Scalable**: Service-oriented design allows horizontal scaling
- **Secure**: Multiple layers of security controls
- **Extensible**: Easy to add new features and integrations
- **Production-Ready**: Docker deployment and CI/CD automation

The architecture supports the project's goals of providing a professional, AI-powered security analysis platform that can be deployed in various environments from development to production.
