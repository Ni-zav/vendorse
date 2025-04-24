# Vendorse Web Application

## Technology Stack

- Next.js 15.3
- React 19.0
- TypeScript 5.8
- TailwindCSS 4.1
- Headless UI
- React Dropzone

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
API_URL=http://localhost:3003
```

3. **Development Server**:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Key Features

### 1. Authentication & Authorization
- JWT-based auth with secure token storage
- Role-based access control (BUYER, VENDOR, REVIEWER)
- Protected route components

### 2. Tender Management
- Create and publish tenders
- File uploads with signature verification
- Search and filter capabilities
- Status tracking and notifications

### 3. Bid Management
- Submit bids with supporting documents
- Track bid status and evaluations
- View evaluation scores and feedback

### 4. Evaluation System
- Score-based bid evaluation
- Weighted criteria assessment
- Recommendation system

## Project Structure

```
src/
├── app/                # Next.js 13+ App Router
│   ├── api/           # API route handlers
│   ├── auth/          # Authentication pages
│   ├── tenders/       # Tender management
│   ├── bids/          # Bid management
│   └── dashboard/     # Analytics dashboard
├── components/        # Shared components
│   ├── AppLayout     # Main layout wrapper
│   ├── ProtectedRoute # Auth protection HOC
│   └── Form/         # Form components
└── contexts/         # React contexts
```

## Available Commands

```bash
# Development
pnpm dev         # Start development server
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Run ESLint
```

## Component Library

We use a shared UI component library (`@vendorse/ui`) that includes:
- Form components
- Button variants
- File upload
- Tender evaluation forms
- Data display cards

## Best Practices

1. **State Management**
   - Use React Context for global state
   - Keep component state local when possible
   - Implement proper error boundaries

2. **Performance**
   - Implement proper loading states
   - Use Next.js image optimization
   - Implement proper caching strategies

3. **Security**
   - Validate all user input
   - Implement proper CSRF protection
   - Secure token management

## Deployment

The application is optimized for deployment on Vercel, but can be deployed to any platform that supports Next.js.

For detailed deployment instructions, see our [main documentation](../README.md#deployment).

## Related Documentation

- [Main Project Documentation](/README.md)
- [API Documentation](/apps/api/README.md)
- [UI Component Library](/packages/ui/README.md)
