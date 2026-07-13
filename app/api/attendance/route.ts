import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function parseCarnets(input: any): string[] {
  if (input === undefined || input === null) return []

  if (Array.isArray(input)) {
    return input
      .map((x) => String(x).trim())
      .filter((x) => /^\d{8}$/.test(x))
  }

  if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return []

    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => String(x).trim())
          .filter((x) => /^\d{8}$/.test(x))
      }
    } catch {
      // no era JSON, seguimos
    }

    return s
      .split(',')
      .map((x) => x.trim())
      .filter((x) => /^\d{8}$/.test(x))
  }

  return []
}

function observationsToNull(v: any) {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s ? s : null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10))

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.attendanceRecord.count(),
    ])

    return NextResponse.json({ records: records ?? [], total: total ?? 0, page, pageSize })
  } catch (error) {
    console.error('GET /api/attendance error:', error)
    return NextResponse.json({ error: 'No se pudieron obtener los registros.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log('POST /api/attendance body:', body)

    const {
      fechaClase,
      modalidad,
      carrera,
      grado,
      semestre,
      asignatura,
      inscritos,
      presentes,
      observaciones,
      carnetAusentes,
      pdfUrl // <-- añadimos aquí
    } = body ?? {}

    if (
      !fechaClase || !modalidad || !carrera || !grado || !semestre ||
      !asignatura || inscritos === undefined || inscritos === null ||
      presentes === undefined || presentes === null
    ) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const insc = Number(inscritos)
    const pres = Number(presentes)

    if (!Number.isFinite(insc) || !Number.isFinite(pres) || insc < 0 || pres < 0) {
      return NextResponse.json({ error: 'Inscritos y presentes deben ser números válidos.' }, { status: 400 })
    }

    if (pres > insc) {
      return NextResponse.json({ error: 'Los presentes no pueden ser mayores que los inscritos.' }, { status: 400 })
    }

    const carnets = parseCarnets(carnetAusentes)

    const record = await prisma.attendanceRecord.create({
      data: {
        fechaClase: new Date(fechaClase),
        modalidad: String(modalidad),
        carrera: String(carrera),
        grado: String(grado),
        semestre: String(semestre),
        asignatura: String(asignatura),
        inscritos: insc,
        presentes: pres,
        ausentes: insc - pres,
        observaciones: observationsToNull(observaciones),
        carnetausentes: carnets,
        pdfUrl: pdfUrl || null, // <-- GUARDA LA URL AQUÍ
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('POST /api/attendance error:', error)
    return NextResponse.json({ error: 'No se pudo guardar el registro.' }, { status: 500 })
  }
}