import { NextRequest } from 'next/server';

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id } = context.params;
    const authHeader = req.headers.get('authorization');
    
    console.log('Publishing tender - API Route:', {
      tenderId: id,
      apiUrl,
      hasAuthHeader: !!authHeader
    });
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/${id}/publish`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'host': 'localhost:3003'
      },
    });

    console.log('Publishing tender - Backend response:', {
      status: response.status,
      statusText: response.statusText
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('Publishing tender - Non-JSON response:', text);
      try {
        data = JSON.parse(text);
      } catch {
        return Response.json(
          { error: text || 'Failed to publish tender' },
          { status: response.status }
        );
      }
    }

    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('Publishing tender - Request failed:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return Response.json(
      { error: 'Failed to publish tender' },
      { status: 500 }
    );
  }
}