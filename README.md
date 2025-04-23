# Vendorse - E-Procurement Platform

## Overview
A full-stack e-procurement system that manages the complete lifecycle of tenders, bids, and evaluations.

## Tech Stack
- **Frontend**: Next.js (React) with TypeScript
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based
- **Package Manager**: pnpm with Turborepo (Monorepo)

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
- Multi-reviewer evaluation process
- Weighted scoring criteria:
  - Technical Capability (40%)
  - Price (30%)
  - Timeline (30%)
- Evaluation comments & recommendations
- Final award decision workflow

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