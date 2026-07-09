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
    } catch {}

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

export async function DELETE() {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) {
      return NextResponse.json({ error: 'No hay registros.' }, { status: 404 })
    }

    await prisma.attendanceRecord.delete({ where: { id: last.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/attendance/last error:', error)
    return NextResponse.json({ error: 'Error al eliminar.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) {
      return NextResponse.json({ error: 'No hay registros.' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    console.log('PUT /api/attendance/last body:', body)

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

    const record = await prisma.attendanceRecord.update({
      where: { id: last.id },
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
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('PUT /api/attendance/last error:', error)
    return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })
  }
}