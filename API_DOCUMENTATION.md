# API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: Configured via environment variable

## Authentication
All protected endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication

#### POST /api/v1/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Status Codes:**
- 200: Success
- 401: Invalid credentials
- 429: Too many login attempts (rate limited)

---

### File Upload

#### POST /api/v1/upload/
Upload a Python file for security scanning.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <Python file>
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and scanned successfully",
  "filename": "example.py",
  "scan_id": 123,
  "issues_found": 5,
  "risk_level": "HIGH"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid file type or size
- 401: Unauthorized
- 429: Upload rate limit exceeded

---

### Dashboard

#### GET /api/v1/dashboard/
Get dashboard statistics and recent scans.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "summary": {
    "total_scans": 50,
    "total_issues": 150
  },
  "risk_distribution": {
    "safe": 30,
    "high": 15,
    "medium": 5
  },
  "recent_scans": [
    {
      "id": 123,
      "filename": "example.py",
      "risk_level": "HIGH",
      "issues": 5,
      "scan_time": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### Reports

#### GET /api/v1/reports/
List all available reports.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_reports": 10,
  "reports": [
    {
      "filename": "example_report.json",
      "created_at": "2024-01-15T10:30:00",
      "size": 2048
    }
  ]
}
```

#### GET /api/v1/reports/view/{filename}
View a specific report (JSON format).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "filename": "example.py",
  "scan_time": "2024-01-15T10:30:00",
  "results": [
    {
      "test_id": "B101",
      "test_name": "assert_used",
      "issue_severity": "LOW",
      "issue_text": "Use of assert detected...",
      "line_number": 42
    }
  ]
}
```

#### GET /api/v1/reports/pdf/{filename}
Download a report as PDF.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Content-Type: application/pdf
- File download

#### DELETE /api/v1/reports/{filename}
Delete a specific report.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

### AI Analysis

#### POST /api/v1/ai/analyze
Analyze a vulnerability using AI.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "test_id": "B101",
  "test_name": "assert_used",
  "issue_text": "Use of assert detected..."
}
```

**Response:**
```json
{
  "test_id": "B101",
  "simple_explanation": "Assert statements are used for debugging...",
  "technical_explanation": "In Python, assert statements...",
  "business_impact": "If assertions are enabled in production...",
  "attack_scenario": "An attacker could potentially...",
  "risk_reasoning": "The risk is considered LOW because...",
  "recommended_remediation": "Remove assert statements...",
  "secure_coding_example": "if condition:\n    raise ValueError(...)"
}
```

#### POST /api/v1/ai/analyze/{scan_id}
Analyze all vulnerabilities in a scan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "scan_id": 123,
  "total_vulnerabilities": 5,
  "analysis": [
    {
      "test_id": "B101",
      "simple_explanation": "...",
      "technical_explanation": "..."
    }
  ]
}
```

---

### Risk Scoring

#### GET /api/v1/ai/risk/score/{scan_id}
Get risk score for a specific scan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "scan_id": 123,
  "security_score": 75,
  "risk_level": "MEDIUM",
  "severity_breakdown": {
    "HIGH": 2,
    "MEDIUM": 3,
    "LOW": 5
  },
  "trend_direction": "improving"
}
```

#### GET /api/v1/ai/risk/history
Get historical risk scores.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "history": [
    {
      "scan_id": 123,
      "security_score": 75,
      "risk_level": "MEDIUM",
      "calculated_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### Security Assistant

#### POST /api/v1/ai/assistant/chat
Chat with the AI security assistant.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "What is SQL injection?",
  "scan_id": 123
}
```

**Response:**
```json
{
  "answer": "SQL injection is a security vulnerability...",
  "sources": ["knowledge_base", "ai"],
  "related_vulnerabilities": ["B608"]
}
```

---

### System Health

#### GET /api/v1/health/
Get system health status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "backend": "healthy",
  "database": "healthy",
  "scanner": "healthy",
  "auth": "healthy",
  "upload": "healthy",
  "reports": "healthy",
  "email": "healthy",
  "ai": "healthy",
  "version": "2.0.0",
  "environment": "production",
  "python": "3.12",
  "database_type": "postgresql",
  "ai_enabled": "true"
}
```

---

### Email

#### GET /api/v1/email/status
Get email service status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "service": "Email Module",
  "status": "Ready",
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 465,
  "report_folder": "reports"
}
```

#### POST /api/v1/email/send
Send a security report via email.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/x-www-form-urlencoded
```

**Request Body:**
```
receiver_email: recipient@example.com
filename: example_report.json
```

**Response:**
```json
{
  "success": true,
  "message": "Security report emailed successfully",
  "receiver": "recipient@example.com",
  "report": "example_report.json",
  "sent_by": "admin"
}
```

#### GET /api/v1/email/history
Get email sending history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "receiver": "recipient@example.com",
    "report_name": "example_report.json",
    "sent_by": "admin",
    "sent_at": "2024-01-15T10:30:00"
  }
]
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message description"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

---

## Rate Limiting

The following rate limits are applied:

- **Login**: 10 requests per minute
- **Upload**: 20 requests per minute
- **AI Assistant**: 30 requests per minute
- **General API**: 60 requests per minute (configurable)

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1642234567
```

---

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/v1/reports/?page=1&limit=10
```

**Response:**
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10,
  "items": [...]
}
```

---

## CORS Configuration

CORS is configured to allow requests from specified origins. Configure allowed origins via the `ALLOWED_ORIGINS` environment variable.

---

## Interactive API Documentation

Interactive API documentation is available via Swagger UI:
- **Development**: http://localhost:8000/docs
- **Production**: http://your-domain/docs

ReDoc documentation is also available:
- **Development**: http://localhost:8000/redoc
- **Production**: http://your-domain/redoc
