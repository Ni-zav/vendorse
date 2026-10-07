import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const sessionToken = req.cookies.get('vendorse_session')?.value;
    const authHeader = sessionToken ? 'Bearer ' + sessionToken : req.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthenticated' }, { status: 401 });
    const params = await context.params;
    const { id } = params;
    
    const response = await fetch(`${apiUrl}/users/${id}`, {
      headers: {
        Authorization: authHeader,
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    
    const response = await fetch(`${apiUrl}/users/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
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