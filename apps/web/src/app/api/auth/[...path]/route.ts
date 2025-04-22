import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const apiUrl = process.env.API_URL || 'http://localhost:3003';
  const params = await context.params;
  
  if (!params?.path) {
    return Response.json({ error: 'Invalid path' }, { status: 400 });
  }

  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
  
  const response = await fetch(`${apiUrl}/auth/${path}`, {
    headers: {
      ...Object.fromEntries(req.headers),
      'host': 'localhost:3003',
    },
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const params = await context.params;
    const body = await req.json();
    
    console.log('API Route - Incoming request:', {
      path: params.path,
      method: req.method,
      body,
      apiUrl
    });

    const response = await fetch(`${apiUrl}/auth/${params.path.join('/')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('API Route - Backend response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Request failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return Response.json(
      { error: 'Failed to connect to authentication service' },
      { status: 500 }
    );
  }
}