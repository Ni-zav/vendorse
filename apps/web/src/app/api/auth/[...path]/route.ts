import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const apiUrl = process.env.API_URL || 'http://localhost:3003';
  const path = params.path.join('/');
  
  const response = await fetch(`${apiUrl}/auth/${path}`, {
    headers: {
      ...Object.fromEntries(req.headers),
      'host': 'localhost:3003',
    },
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const apiUrl = process.env.API_URL || 'http://localhost:3003';
  const path = params.path.join('/');
  const body = await req.json();

  const response = await fetch(`${apiUrl}/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(req.headers),
      'host': 'localhost:3003',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}