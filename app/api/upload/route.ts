import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

type PutResultLike = {
  url?: string;
  publicUrl?: string;
  key?: string;
  [k: string]: any;
};

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    if (!request.body) {
      return NextResponse.json({ error: 'No file body' }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: 'public',
    });

    // casteo seguro para evitar errores de tipos en TS
    const raw = blob as PutResultLike;
    const url = (raw.url || raw.publicUrl || raw.key) ?? null;

    return NextResponse.json({ raw, url });
  } catch (error) {
    console.error('Error al subir a Vercel Blob:', error);
    return NextResponse.json({ error: 'Falló la subida al storage' }, { status: 500 });
  }
}