import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'vendorse_session';

function apiUrl() {
  return process.env.API_URL || 'http://localhost:3003';
}

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const route = path?.join('/');
    if (!route) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });

    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const upstream = await fetch(`${apiUrl()}/auth/${route}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const payload = await upstream.json().catch(() => ({}));
    const response = NextResponse.json(payload, { status: upstream.status });

    if (upstream.status === 401) {
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
    }
    return response;
  } catch (error) {
    console.error('Authentication proxy GET failed', error);
    return NextResponse.json(
      { error: 'Failed to connect to authentication service' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const route = path?.join('/');
    if (!route) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });

    if (route === 'logout') {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
      return response;
    }

    if (!['login', 'register'].includes(route)) {
      return NextResponse.json({ error: 'Unsupported auth action' }, { status: 404 });
    }

    const body = await req.json();
    const upstream = await fetch(`${apiUrl()}/auth/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok || !payload?.accessToken) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    const response = NextResponse.json({ ok: true }, { status: upstream.status });
    setSessionCookie(response, payload.accessToken);
    return response;
  } catch (error) {
    console.error('Authentication proxy POST failed', error);
    return NextResponse.json(
      { error: 'Failed to connect to authentication service' },
      { status: 500 },
    );
  }
}
