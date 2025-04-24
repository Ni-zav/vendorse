# Vendorse Web Application

## Technology Stack

- Next.js 15.3
- React 19.0
- TypeScript 5.8
- TailwindCSS 4.1
- Node.js 18.18+ or 20.9+

## Project Setup

```bash
# Install dependencies
$ pnpm install

# Set up environment variables
$ cp .env.example .env
```

## Development

```bash
# Start development server
$ pnpm dev

# Build for production
$ pnpm build

# Start production server
$ pnpm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── bids/             # Bid management pages
│   ├── evaluations/      # Evaluation pages
│   └── tenders/          # Tender management pages
├── components/           # Reusable components
├── contexts/            # React contexts
└── public/             # Static assets
```

## Key Features

- Role-based access control
- Tender management interface
- Bid submission system
- Evaluation workflow
- Document handling
- Real-time notifications

## Environment Variables

- `API_URL`: Backend API endpoint
- `NEXT_PUBLIC_APP_URL`: Frontend application URL

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
