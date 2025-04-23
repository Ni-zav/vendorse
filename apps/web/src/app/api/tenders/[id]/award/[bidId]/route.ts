import { NextRequest } from 'next/server';

export async function PUT(
  req: NextRequest,
  context: { params: { id: string; bidId: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id, bidId } = context.params;
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/${id}/award/${bidId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    const data = await response.json();
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Award tender failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to award tender' },
      { status: 500 }
    );
  }
}