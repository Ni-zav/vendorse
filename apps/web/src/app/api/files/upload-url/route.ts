import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3003';
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is missing' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const fileName = typeof body.fileName === 'string' ? body.fileName : '';
    const contentType =
      typeof body.contentType === 'string'
        ? body.contentType
        : 'application/octet-stream';
    const fileSize =
      typeof body.fileSize === 'number' && Number.isFinite(body.fileSize)
        ? String(Math.trunc(body.fileSize))
        : '';

    if (!fileName) {
      return Response.json({ error: 'fileName is required' }, { status: 400 });
    }

    if (!fileSize || Number(fileSize) <= 0) {
      return Response.json({ error: 'fileSize is required' }, { status: 400 });
    }

    const query = new URLSearchParams({
      fileName,
      contentType,
      fileSize,
    });

    const response = await fetch(
      apiUrl + '/files/upload-url?' + query.toString(),
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return Response.json(
        payload || { error: 'Failed to create upload URL' },
        { status: response.status },
      );
    }

    return Response.json(payload);
  } catch (error) {
    console.error('Failed to create proposal upload URL', error);
    return Response.json(
      { error: 'Failed to create upload URL' },
      { status: 500 },
    );
  }
}
