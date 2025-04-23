import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const authHeader = req.headers.get('authorization');
    
    console.log('[API Route Debug] Fetching bids:', {
      apiUrl,
      hasAuthHeader: !!authHeader,
      url: `${apiUrl}/tenders/bids/vendor`
    });
    
    if (!authHeader) {
      console.error('[API Route Error] Missing authorization header');
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiUrl}/tenders/bids/vendor`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    console.log('[API Route Debug] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      console.error('[API Route Error] Backend error:', {
        status: response.status,
        errorData
      });
      
      return Response.json(
        { error: errorData?.error || 'Failed to fetch bids' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API Route Debug] Successful response:', {
      dataLength: Array.isArray(data) ? data.length : 'not an array',
      data: data
    });
    
    return Response.json(data);
  } catch (error) {
    console.error('[API Route Error] Unexpected error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error'
    });
    
    return Response.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}