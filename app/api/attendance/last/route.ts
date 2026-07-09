import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Reusa el parser de carnets (mismo comportamiento que en route.ts) */
function parseCarnets(input: any): string[] {
  if (input === undefined || input === null) return []
  if (Array.isArray(input)) {
    return input
      .map((x) => (typeof x === 'string' ? x.trim() : String(x)))
      .map((s) => s.replace(/\D/g, '').slice(0, 8))
      .filter((s) => /^\d{8}$/.test(s))
  }
  if (typeof input === 'string') {
    const trimmed = input.trim()
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parseCarnets(parsed as any)
    } catch {}
    return trimmed
      .split(',')
      .map((s) => s.replace(/\D/g, '').slice(0, 8))
      .filter((s) => /^\d{8}$/.test(s))
  }
  const s = String(input).replace(/\D/g, '').slice(0, 8)
  return /^\d{8}$/.test(s) ? [s] : []
}

export async function DELETE() {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) return NextResponse.json({ error: 'No hay registros.' }, { status: 404 })

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
    if (!last) return NextResponse.json({ error: 'No hay registros.' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    console.log('PUT /api/attendance/last body:', JSON.stringify(body))
    const {
      fechaClase, modalidad, carrera, grado, semestre,
      asignatura, inscritos, presentes, observaciones, carnetAusentes,
    } = body ?? {}

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

    const carnets = parseCarnets(carnetAusentes)
    if ((carnetAusentes !== undefined && carnetAusentes !== null) && carnets.length === 0) {
      return NextResponse.json({ error: 'Formato de carnets inválido o ninguno cumple 8 dígitos.' }, { status: 400 })
    }

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
        carnetAusentes: carnets,
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('PUT /api/attendance/last error:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el último registro.' }, { status: 500 })
  }
}

function observationsToNull(v: any) {
  if (v === undefined || v === null) return null
  try {
    const s = String(v).trim()
    return s.length ? s : null
  } catch {
    return null
  }
}