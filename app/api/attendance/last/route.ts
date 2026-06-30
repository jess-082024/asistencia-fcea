import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) {
      return NextResponse.json({ error: 'No hay registros para eliminar.' }, { status: 404 })
    }
    await prisma.attendanceRecord.delete({ where: { id: last.id } })
    return NextResponse.json({ success: true, deleted: last })
  } catch (error) {
    console.error('DELETE /api/attendance/last error:', error)
    return NextResponse.json({ error: 'No se pudo eliminar el último registro.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) {
      return NextResponse.json({ error: 'No hay registros para actualizar.' }, { status: 404 })
    }

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
        observaciones: observaciones ? String(observaciones) : null,
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('PUT /api/attendance/last error:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el último registro.' }, { status: 500 })
  }
}
