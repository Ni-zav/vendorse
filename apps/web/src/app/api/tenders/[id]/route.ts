import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id } = context.params;
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'host': 'localhost:3003'
      },
    });

    // Try to parse the response as JSON first
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        // If we can't parse as JSON, return the error text directly
        return Response.json(
          { error: text || 'Failed to fetch tender details' },
          { status: response.status }
        );
      }
    }

    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('API Route - Request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to fetch tender details' },
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
    const authHeader = req.headers.get('authorization');
    
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

    // Try to parse the response as JSON first
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        // If we can't parse as JSON, return the error text directly
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
    console.error('API Route - Request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return Response.json(
      { error: 'Failed to publish tender' },
      { status: 500 }
    );
  }
}