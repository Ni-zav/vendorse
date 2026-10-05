import { NextRequest } from 'next/server';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; bidId: string }> },
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id, bidId } = await context.params;
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 },
      );
    }

    const response = await fetch(
      apiUrl + '/tenders/' + id + '/award/' + bidId,
      {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
        },
      },
    );

    const text = await response.text();
    let payload: unknown;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: text || 'Failed to award tender' };
    }

    return Response.json(payload, { status: response.status });
  } catch (error) {
    console.error('Tender award proxy failed', error);
    return Response.json({ error: 'Failed to award tender' }, { status: 500 });
  }
}
