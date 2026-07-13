import crypto from 'crypto'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

type PutResultLike = {
  url?: string
  publicUrl?: string
  key?: string
  [k: string]: any
}

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
  }

  try {
    if (!request.body) {
      return NextResponse.json({ error: 'No file body' }, { status: 400 })
    }

    // Normalizar nombre: eliminar espacios y caracteres peligrosos
    const safeName = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')

    // Generar nombre único: timestamp_random-original
    const timestamp = Date.now()
    const shortRandom = crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.floor(Math.random() * 1e9).toString(36)
    const uniqueName = `${timestamp}_${shortRandom}_${safeName}`

    console.log('[upload] filename:', filename, 'uniqueName:', uniqueName)
    console.log('[upload] BLOB token present?', !!process.env.BLOB_READ_WRITE_TOKEN)

    // Subir usando el nombre único
    const blob = await put(uniqueName, request.body, {
      access: 'public',
    })

    const raw = blob as PutResultLike
    const url = (raw.url || raw.publicUrl || raw.key) ?? null

    return NextResponse.json({ raw, url })
  } catch (error: any) {
    console.error('Error al subir a Vercel Blob:', error)
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 })
  }
}