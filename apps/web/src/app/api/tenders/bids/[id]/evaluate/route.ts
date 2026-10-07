import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const { id } = await context.params;
    const sessionToken = req.cookies.get('vendorse_session')?.value;
    const authHeader = sessionToken ? 'Bearer ' + sessionToken : req.headers.get('authorization');

    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 },
      );
    }

    const response = await fetch(
      apiUrl + '/tenders/bids/' + id + '/evaluate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(await req.json()),
      },
    );

    const text = await response.text();
    let payload: unknown;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: text || 'Failed to evaluate bid' };
    }

    return Response.json(payload, { status: response.status });
  } catch (error) {
    console.error('Evaluation proxy failed', error);
    return Response.json(
      { error: 'Failed to evaluate bid' },
      { status: 500 },
    );
  }
}
