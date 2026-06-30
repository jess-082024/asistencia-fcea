import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
    } = body ?? {}

    if (
      !fechaClase || !modalidad || !carrera || !grado || !semestre ||
      !asignatura || inscritos === undefined || inscritos === null ||
      presentes === undefined || presentes === null
    ) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios excepto Observaciones.' }, { status: 400 })
    }

    const insc = Number(inscritos)
    const pres = Number(presentes)
    if (!Number.isFinite(insc) || !Number.isFinite(pres) || insc < 0 || pres < 0) {
      return NextResponse.json({ error: 'Las cantidades deben ser números válidos.' }, { status: 400 })
    }
    if (pres > insc) {
      return NextResponse.json({ error: 'Los presentes no pueden ser mayores que los inscritos.' }, { status: 400 })
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
        observaciones: observaciones ? String(observaciones) : null,
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('POST /api/attendance error:', error)
    return NextResponse.json({ error: 'No se pudo guardar el registro.' }, { status: 500 })
  }
}
