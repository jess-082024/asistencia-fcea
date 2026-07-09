import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Helper: normaliza/parsea carnets desde distintos formatos */
function parseCarnets(input: any): string[] {
  if (input === undefined || input === null) return []
  // Si ya es array
  if (Array.isArray(input)) {
    return input
      .map((x) => (typeof x === 'string' ? x.trim() : String(x)))
      .map((s) => s.replace(/\D/g, '').slice(0, 8))
      .filter((s) => /^\d{8}$/.test(s))
  }
  // Si es string, intentamos parse JSON
  if (typeof input === 'string') {
    const trimmed = input.trim()
    // intento parse JSON
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parseCarnets(parsed as any)
      }
    } catch {
      // no es JSON; seguimos
    }
    // intentar separar por comas
    return trimmed
      .split(',')
      .map((s) => s.replace(/\D/g, '').slice(0, 8))
      .filter((s) => /^\d{8}$/.test(s))
  }
  // cualquier otro tipo -> intentar convertir a string único
  const s = String(input).replace(/\D/g, '').slice(0, 8)
  return /^\d{8}$/.test(s) ? [s] : []
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
    console.log('POST /api/attendance body:', JSON.stringify(body))

    const {
      fechaClase, modalidad, carrera, grado, semestre,
      asignatura, inscritos, presentes, observaciones, carnetAusentes,
    } = body ?? {}

    // Campos obligatorios
    if (!fechaClase || !modalidad || !carrera || !grado || !semestre || !asignatura) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const insc = Number(inscritos)
    const pres = Number(presentes)
    if (!Number.isFinite(insc) || !Number.isFinite(pres) || insc < 0 || pres < 0) {
      return NextResponse.json({ error: 'Inscritos y presentes deben ser números válidos y no negativos.' }, { status: 400 })
    }
    if (pres > insc) {
      return NextResponse.json({ error: 'Los presentes no pueden ser mayores que los inscritos.' }, { status: 400 })
    }

    // Parsear y validar carnets
    const carnets = parseCarnets(carnetAusentes)
    // Si el frontend envía carnets pero ninguno válido -> error
    if ((carnetAusentes !== undefined && carnetAusentes !== null) && carnets.length === 0) {
      return NextResponse.json({ error: 'Formato de carnets inválido o ninguno cumple 8 dígitos.' }, { status: 400 })
    }

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
        carnetAusentes: carnets, // guarda array (o [])
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('POST /api/attendance error:', error)
    return NextResponse.json({ error: 'No se pudo guardar el registro.' }, { status: 500 })
  }
}

/** Helper para normalizar observaciones a null si vacío */
function observationsToNull(v: any) {
  if (v === undefined || v === null) return null
  try {
    const s = String(v).trim()
    return s.length ? s : null
  } catch {
    return null
  }
}