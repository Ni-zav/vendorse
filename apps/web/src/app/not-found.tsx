import Link from 'next/link';
import { Button } from '@vendorse/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Page Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Link href="/" passHref>
            <Button className="w-full">
              Return to home
            </Button>
          </Link>
          <Link href="/dashboard" passHref>
            <Button variant="outline" className="w-full">
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}