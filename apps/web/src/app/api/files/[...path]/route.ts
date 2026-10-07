import { NextRequest } from 'next/server';

async function forward(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
  method: 'GET' | 'POST',
) {
  const { path } = await context.params;
  const token = req.cookies.get('vendorse_session')?.value;
  if (!token) return Response.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!path?.length || path.some((segment) => segment === '..')) {
    return Response.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const upstream = await fetch(
      apiUrl + '/files/' + path.map(encodeURIComponent).join('/'),
      {
        method,
        headers: { Authorization: 'Bearer ' + token },
        cache: 'no-store',
      },
    );
    const payload = await upstream.json().catch(() => ({}));
    return Response.json(payload, { status: upstream.status });
  } catch (error) {
    console.error('File proxy failed', error);
    return Response.json({ error: 'File service unavailable' }, { status: 500 });
  }
}

export function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return forward(req, context, 'GET');
}

export function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return forward(req, context, 'POST');
}
