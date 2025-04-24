import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id } = context.params;
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    
    console.log('[API Route Debug] Evaluating bid:', {
      bidId: id,
      hasAuthHeader: !!authHeader,
      url: `${apiUrl}/tenders/bids/${id}/evaluate`
    });
    
    if (!authHeader) {
      console.error('[API Route Error] Missing authorization header');
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/bids/${id}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'host': 'localhost:3003'
      },
      body: JSON.stringify(body)
    });

    console.log('[API Route Debug] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: text };
      }
      
      console.error('[API Route Error] Backend error:', {
        status: response.status,
        errorData
      });
      
      return Response.json(
        { error: errorData?.message || errorData?.error || 'Failed to evaluate bid' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API Route Debug] Evaluation successful:', {
      evaluationsCount: Array.isArray(data) ? data.length : 'not an array'
    });
    
    return Response.json(data, { 
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('[API Route Error] Unexpected error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return Response.json(
      { error: 'Failed to evaluate bid' },
      { status: 500 }
    );
  }
}