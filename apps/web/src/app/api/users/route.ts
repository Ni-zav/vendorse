import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const params = req.nextUrl.searchParams;
    
    const response = await fetch(`${apiUrl}/users?${params.toString()}`, {
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
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}