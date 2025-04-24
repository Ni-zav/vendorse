# Vendorse Database Package

## Technology Stack

- Prisma 6.6 ORM
- PostgreSQL 14+
- TypeScript 5.8

## Schema Overview

Our database schema is managed through Prisma and includes:

- Users & Organizations
- Tenders & Bids
- Document Management
- Evaluation System
- Notifications & Audit Logs

## Getting Started

1. **Install Dependencies**:
```bash
pnpm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
```

Required environment variables:
```
DATABASE_URL="postgresql://user:password@localhost:5432/vendorse"
```

3. **Generate Prisma Client**:
```bash
pnpm prisma generate
```

4. **Run Migrations**:
```bash
pnpm prisma migrate dev
```

## Available Commands

```bash
# Development
pnpm prisma studio     # Launch Prisma Studio UI
pnpm prisma migrate dev # Create a new migration
pnpm prisma db push    # Push schema changes without migrations
pnpm prisma generate   # Generate Prisma Client

# Reset Database
pnpm prisma migrate reset # Reset database and run seeds
```

## Recent Migrations

1. **20250421101235_init** - Initial schema setup
   - User and Organization models
   - Tender and Bid models
   - Document management
   - Basic evaluation system

2. **20250423145809_add_recommendation_to_evaluation**
   - Added recommendation field to evaluations
   - Enhanced evaluation tracking

## Model Relationships

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  role          Role     @default(VENDOR)
  organization  Organization @relation(fields: [orgId], references: [id])
  orgId         String
  // ... other fields
}

model Tender {
  id          String   @id @default(cuid())
  title       String
  status      TenderStatus
  bids        Bid[]
  // ... other fields
}

model Bid {
  id          String   @id @default(cuid())
  tender      Tender   @relation(fields: [tenderId], references: [id])
  tenderId    String
  evaluations EvaluationScore[]
  // ... other fields
}
```

## Development Guidelines

1. **Creating Migrations**
   - Use descriptive names
   - Include both up and down migrations
   - Test migrations before committing

2. **Schema Changes**
   - Follow naming conventions
   - Add proper indexes
   - Consider foreign key constraints

3. **Data Protection**
   - Implement soft deletes where appropriate
   - Use proper cascade rules
   - Consider data privacy requirements

## Related Documentation

- [Main Project Documentation](/README.md)
- [API Documentation](/apps/api/README.md)
- [Web Application](/apps/web/README.md)