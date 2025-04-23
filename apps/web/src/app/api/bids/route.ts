import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/bids`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'host': 'localhost:3003'
      }
    });

    const data = await response.json();
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Fetch bids failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}