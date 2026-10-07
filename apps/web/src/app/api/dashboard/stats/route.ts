import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const sessionToken = req.cookies.get('vendorse_session')?.value;
    const authHeader = sessionToken ? 'Bearer ' + sessionToken : req.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthenticated' }, { status: 401 });
    
    const response = await fetch(`${apiUrl}/dashboard/stats`, {
      headers: {
        Authorization: authHeader,
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
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}