# Vendorse - E-Procurement Platform

## Overview
A full-stack e-procurement system that manages the complete lifecycle of tenders, bids, and evaluations.

## Tech Stack
- **Frontend**: Next.js 15.3 (React 19) with TypeScript 5.8
- **Backend**: NestJS 11 with TypeScript 5.8
- **Database**: PostgreSQL with Prisma 6.6 ORM
- **Authentication**: JWT-based
- **Package Manager**: pnpm 10.9 with Turborepo

## Requirements
- Node.js 18.18+ or 20.9+
- PostgreSQL 14+
- pnpm 10.9+

## Project Structure
```
apps/
├── api/                 # NestJS Backend API
│   ├── src/
│   │   ├── auth/       # Authentication & Authorization
│   │   ├── tender/     # Tender management
│   │   ├── dashboard/  # Dashboard statistics
│   │   └── file/       # File handling
│   └── test/
└── web/                # Next.js Frontend
    ├── src/
    │   ├── app/        # Next.js 13+ App Router
    │   ├── components/ # Shared components
    │   └── contexts/   # React contexts
    └── public/         # Static assets

packages/
├── database/           # Prisma schema & migrations
├── shared/            # Shared types & utilities
└── ui/                # Reusable UI components
```

## Core Features

### 1. User Management
- **Roles & Permissions**:
  - `ADMIN`: Full system access
  - `BUYER`: Create/manage tenders
  - `VENDOR`: Submit/manage bids
  - `REVIEWER`: Evaluate bids
- Organization-based access control
- JWT authentication with role-based guards

### 2. Tender Management
- **Lifecycle States**:
  ```
  DRAFT → PUBLISHED → UNDER_REVIEW → AWARDED → COMPLETED
  ```
- Features:
  - Create and publish tenders
  - Attach supporting documents
  - Set budgets and deadlines
  - Search and filter functionality

### 3. Bid Management
- **Bid Lifecycle**:
  ```
  SUBMITTED → UNDER_REVIEW → ACCEPTED/REJECTED
  ```
- Features:
  - Submit bids with documents
  - Document signature verification
  - Bid status tracking
  - Automatic notifications

### 4. Evaluation System
- Multi-reviewer evaluation process with weighted criteria:
  - Technical Capability (40%): Technical approach and methodology
  - Price (30%): Budget and cost-effectiveness evaluation
  - Timeline (30%): Delivery schedule assessment
- Evaluation Features:
  - Score-based assessment (0-100 for each criterion)
  - Detailed evaluation comments
  - Three-way recommendation system:
    - ACCEPT: Approve the bid
    - REJECT: Decline the bid
    - REQUEST_CLARIFICATION: Request additional information
- Automated status updates:
  - Updates bid status to UNDER_REVIEW on first evaluation
  - Updates tender status based on evaluation progress
  - Notification system for bid evaluations

### 5. Workflow Automation
- **Status Management**:
  - Automatic tender status progression
  - Bid status synchronization
  - Evaluation-triggered updates
- **Notification System**:
  - Status change notifications
  - Evaluation notifications
  - Award notifications
- **Audit Logging**:
  - User actions tracking
  - IP address logging
  - Complete activity timeline

## User Management Guide

### Creating New Users (PowerShell)

1. **Create Buyer Account**:
```powershell
$headers = @{
    'Content-Type' = 'application/json'
}
$buyerData = @{
    organization = @{
        name = "Organization Name"
        type = "GOVERNMENT"
        address = "Address"
    }
    user = @{
        name = "Full Name"
        email = "email@example.com"
        password = "password"
        role = "BUYER"
    }
}
$jsonBody = $buyerData | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:3003/auth/register' -Method Post -Headers $headers -Body $jsonBody
```

2. **Using Prisma Studio**:
```bash
cd packages/database
pnpm prisma studio
```
Then:
1. Create organization first
2. Create user with reference to organization ID

### Organization Types
- `GOVERNMENT`
- `BUSINESS`
- `NON_PROFIT`

## Database Schema

### Core Models
- `User`: User accounts and authentication
- `Organization`: Company/entity information
- `Tender`: Tender listings and details
- `Bid`: Bid submissions and tracking
- `BidDocument`: Bid supporting documents
- `EvaluationScore`: Bid evaluations and scoring
- `Notification`: System notifications
- `AuditLog`: System audit trail

## API Endpoints

### Authentication
- POST `/auth/register`: Register new user
- POST `/auth/login`: User login
- GET `/auth/profile`: Get user profile

### Tenders
- POST `/tenders`: Create tender
- PUT `/tenders/:id/publish`: Publish tender
- POST `/tenders/:id/bids`: Submit bid
- POST `/tenders/bids/:id/evaluate`: Evaluate bid
- PUT `/tenders/:id/award/:bidId`: Award tender

### Other
- GET `/dashboard/stats`: Dashboard statistics
- GET `/files/upload-url`: Get file upload URL
- GET `/files/:key/download-url`: Get file download URL

## Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Organization-level data isolation
- Document signature verification
- API route protection
- Audit logging

## Security Implementation

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Organization-level data isolation
- IP tracking for security audit

### Document Security
- Document signature verification
- Hash-based integrity checking
- Secure file storage and retrieval

### API Security
- Protected routes with JWT validation
- Role-based endpoint guards
- Rate limiting and request validation

## Development Setup

1. **Install Dependencies**:
```bash
pnpm install
```

2. **Environment Setup**:
- Copy `.env.example` to `.env`
- Configure database connection

3. **Database Setup**:
```bash
cd packages/database
pnpm prisma generate
pnpm prisma db push
```

4. **Start Development Servers**:
```bash
pnpm dev:all
```

## Application Flows

### Tender Creation (BUYER)
1. Create tender draft
2. Add details and documents
3. Publish tender
4. Review submitted bids
5. Award tender to winning bid

### Bid Submission (VENDOR)
1. View published tenders
2. Prepare bid
3. Upload required documents
4. Submit bid
5. Track bid status

### Bid Evaluation (REVIEWER)
1. Access assigned bids
2. Score based on criteria
3. Add comments
4. Submit evaluation

## API Documentation

### Tender Management
```typescript
// Create Tender
POST /tenders
Body: {
  title: string
  description: string
  budget: number
  deadline: Date
}

// Publish Tender
PUT /tenders/:id/publish

// List Tenders
GET /tenders
Query: {
  status?: TenderStatus[]
  search?: string
  page?: number
  limit?: number
}
```

### Bid Management
```typescript
// Submit Bid
POST /tenders/:id/bids
Body: {
  documents: Array<{
    filePath: string
    signatureHash: string
  }>
}

// Evaluate Bid
POST /tenders/bids/:id/evaluate
Body: {
  scores: Record<string, number>
  comments: string
  recommendation: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION'
}

// Award Tender
PUT /tenders/:id/award/:bidId
```

## Data Models

### Tender Status Flow
```
DRAFT → PUBLISHED → UNDER_REVIEW → AWARDED → COMPLETED
```

### Bid Status Flow
```
SUBMITTED → UNDER_REVIEW → ACCEPTED/REJECTED
```

### Evaluation Model
```typescript
interface Evaluation {
  id: string
  bidId: string
  reviewerId: string
  criteria: string
  score: number
  notes?: string
  recommendation?: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION'
  createdAt: Date
  updatedAt: Date
}
```

## Development Guidelines

### Environment Setup
// ...existing code...

### Testing Strategy
1. **Unit Tests**:
   - Controller tests
   - Service logic tests
   - Component tests
2. **Integration Tests**:
   - API endpoint tests
   - Database interaction tests
3. **E2E Tests**:
   - Complete workflow tests
   - User journey tests

### Deployment
1. **Prerequisites**:
   - Node.js 18+
   - PostgreSQL 14+
   - pnpm package manager
2. **Build Process**:
   ```bash
   pnpm build
   ```
3. **Production Start**:
   ```bash
   pnpm start:prod
   ```

## Error Handling

### API Error Responses
```typescript
{
  error: string
  message: string
  statusCode: number
}
```

### Common Error Types
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)

## Monitoring & Logging

### Audit Trail
- User actions
- System events
- Security events
- Error tracking

### Performance Metrics
- API response times
- Database query performance
- File operation metrics
- Authentication metrics