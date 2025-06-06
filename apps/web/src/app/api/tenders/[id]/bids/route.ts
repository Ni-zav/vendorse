import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const params = context.params;
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/${params.id}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Submit bid failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to submit bid' },
      { status: 500 }
    );
  }
}