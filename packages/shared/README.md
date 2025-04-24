# Vendorse Shared Types & Utilities

A shared package containing common types, interfaces, and utilities used across the Vendorse platform.

## Installation

```bash
# Within the monorepo
pnpm install @vendorse/shared@workspace:*
```

## Contents

### Common Types

```typescript
// User Types
type UserRole = 'ADMIN' | 'BUYER' | 'VENDOR' | 'REVIEWER';
type OrganizationType = 'GOVERNMENT' | 'BUSINESS' | 'NON_PROFIT';

// Tender Types
type TenderStatus = 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'AWARDED' | 'COMPLETED';
type BidStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
type EvaluationRecommendation = 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION';
```

### Interfaces

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
}

interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  address: string;
}

interface Tender {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  status: TenderStatus;
  createdById: string;
  // ... other fields
}

interface Bid {
  id: string;
  tenderId: string;
  submittedById: string;
  orgId: string;
  status: BidStatus;
  documents: BidDocument[];
  // ... other fields
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start development with watch mode
pnpm dev

# Build for production
pnpm build

# Clean build files
pnpm clean
```

## Usage

```typescript
import { UserRole, TenderStatus, User } from '@vendorse/shared';

// Use in type definitions
interface AuthenticatedRequest {
  user: User;
}

// Use in conditions
function canPublishTender(status: TenderStatus, role: UserRole): boolean {
  return status === 'DRAFT' && (role === 'ADMIN' || role === 'BUYER');
}
```

## Related Documentation

- [Main Project Documentation](../../README.md)
- [Web Application](../../apps/web/README.md)
- [API Documentation](../../apps/api/README.md)
- [UI Component Library](../ui/README.md)