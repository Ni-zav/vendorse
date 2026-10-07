import { NextRequest } from 'next/server';

async function forward(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
  method: 'GET' | 'POST',
) {
  try {
    const { path } = await context.params;
    if (!path?.length || path.some((segment) => segment === '..')) {
      return Response.json({ error: 'Invalid path' }, { status: 400 });
    }
    const token = req.cookies.get('vendorse_session')?.value;
    if (!token) return Response.json({ error: 'Unauthenticated' }, { status: 401 });

    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const query = req.nextUrl.searchParams.toString();
    const url =
      apiUrl +
      '/procurement/' +
      path.map(encodeURIComponent).join('/') +
      (query ? '?' + query : '');

    const init: RequestInit = {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      cache: 'no-store',
    };
    if (method === 'POST') {
      const text = await req.text();
      if (text) init.body = text;
    }

    const upstream = await fetch(url, init);
    const text = await upstream.text();
    let payload: unknown = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: text || 'Upstream request failed' };
    }
    return Response.json(payload, { status: upstream.status });
  } catch (error) {
    console.error('Procurement proxy failed', error);
    return Response.json({ error: 'Procurement service unavailable' }, { status: 500 });
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
