import { NextResponse } from 'next/server';
import { cloudinaryConfig } from '@releaseflow/firebase/cloudinary/config';
import { getAdminAuth } from '@/lib/server/firebase-admin';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    let cfg;
    try {
      cfg = cloudinaryConfig();
    } catch {
      return NextResponse.json({ error: 'Cloudinary configuration is incomplete.' }, { status: 500 });
    }
    if (!cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) {
      return NextResponse.json({ error: 'Cloudinary configuration is incomplete.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getAdminAuth().verifyIdToken(token);

    const body = (await request.json().catch(() => ({}))) as {
      publicId?: string;
    };

    if (!body.publicId) {
      return NextResponse.json({ error: 'Missing publicId.' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramPairs = [
      `api_key=${cfg.apiKey}`,
      `public_id=${body.publicId}`,
      `timestamp=${timestamp}`,
    ];
    const signature = generateDestroySignature(paramPairs, cfg.apiSecret);

    const formData = new FormData();
    formData.append('public_id', body.publicId);
    formData.append('api_key', cfg.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const destroyRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`,
      { method: 'POST', body: formData },
    );

    const data = await destroyRes.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'Cloudinary destroy failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Avatar destroy failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateDestroySignature(params: string[], apiSecret: string): string {
  const sortedParams = params.sort().join('&');
  const stringToSign = `${sortedParams}${apiSecret}`;
  return createHash('sha1').update(stringToSign).digest('hex');
}