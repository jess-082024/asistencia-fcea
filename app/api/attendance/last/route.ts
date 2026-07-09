import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) return NextResponse.json({ error: 'No hay registros.' }, { status: 404 })
    
    await prisma.attendanceRecord.delete({ where: { id: last.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const last = await prisma.attendanceRecord.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) return NextResponse.json({ error: 'No hay registros.' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const {
      fechaClase, modalidad, carrera, grado, semestre,
      asignatura, inscritos, presentes, observaciones, carnetAusentes,
    } = body ?? {}

    const insc = Number(inscritos)
    const pres = Number(presentes)

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
        carnetAusentes: Array.isArray(carnetAusentes) ? carnetAusentes : [],
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })
  }
}