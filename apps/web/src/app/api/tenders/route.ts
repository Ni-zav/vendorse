import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const params = await context.params;
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const path = queryString ? `?${queryString}` : '';
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${apiUrl}/tenders${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'host': 'localhost:3003',
      },
    });

    const data = await response.json();
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to fetch tenders' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const params = await context.params;
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${apiUrl}/tenders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'host': 'localhost:3003'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Create tender failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to create tender' },
      { status: 500 }
    );
  }
}