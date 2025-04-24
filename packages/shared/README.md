# Vendorse Shared Package

## Overview
Shared types, interfaces, and utilities used across the Vendorse platform.

## Installation

```bash
# Within the monorepo
pnpm install @vendorse/shared@workspace:*
```

## Contents

### Types
- User and organization types
- Tender and bid interfaces
- Evaluation system types
- API response types

### Utilities
- Date formatting
- File hash generation
- Validation helpers
- Type guards

## Usage

```typescript
import { 
  User,
  Organization,
  Tender,
  Bid,
  EvaluationScore,
  TenderStatus,
  BidStatus,
  Role
} from '@vendorse/shared';

// Use types in your components/services
const user: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: Role.VENDOR
};
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

## Related Documentation

- [Main Project Documentation](/README.md)
- [API Documentation](/apps/api/README.md)
- [UI Components](/packages/ui/README.md)