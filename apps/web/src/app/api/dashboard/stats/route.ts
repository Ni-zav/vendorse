import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    
    const response = await fetch(`${apiUrl}/dashboard/stats`, {
      headers: {
        ...Object.fromEntries(req.headers),
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