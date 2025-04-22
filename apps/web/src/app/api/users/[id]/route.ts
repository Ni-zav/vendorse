import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id } = context.params;
    
    const response = await fetch(`${apiUrl}/users/${id}`, {
      headers: {
        ...Object.fromEntries(req.headers),
        'host': 'localhost:3003'
      },
    });

    const data = await response.json();
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return Response.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id } = context.params;
    const body = await req.json();
    
    const response = await fetch(`${apiUrl}/users/${id}`, {
      method: 'PUT',
      headers: {
        ...Object.fromEntries(req.headers),
        'Content-Type': 'application/json',
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
    console.error('API Route - Request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return Response.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}