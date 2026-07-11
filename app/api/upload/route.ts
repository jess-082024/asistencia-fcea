import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') || `reporte_${Date.now()}.pdf`

  try {
    // request.body contiene el File que enviamos desde el frontend
    const blob = await put(filename, request.body!, {
      access: 'public', // público porque lo seleccionaste así
    })

    // blob incluye url, id, size, ...
    return NextResponse.json(blob)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir reporte' }, { status: 500 })
  }
}