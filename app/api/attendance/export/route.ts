export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'


function fmtFecha(d: Date): string {
  try {
    const dt = new Date(d)
    const day = String(dt.getUTCDate()).padStart(2, '0')
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const year = dt.getUTCFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}

export async function GET() {
  try {
    const records = await prisma.attendanceRecord.findMany({ orderBy: { createdAt: 'desc' } })

    const rows = (records ?? []).map((r) => ({
      'Fecha': fmtFecha(r.fechaClase),
      'Modalidad': r.modalidad ?? '',
      'Carrera': r.carrera ?? '',
      'Año': r.grado ?? '',
      'Semestre': r.semestre ?? '',
      'Asignatura': r.asignatura ?? '',
      'Inscritos': r.inscritos ?? 0,
      'Presentes': r.presentes ?? 0,
      'Ausentes': r.ausentes ?? 0,
      'Observaciones': r.observaciones ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 12 }, { wch: 24 }, { wch: 34 }, { wch: 12 }, { wch: 12 },
      { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="asistencia_fcea.xlsx"',
      },
    })
  } catch (error) {
    console.error('GET /api/attendance/export error:', error)
    return NextResponse.json({ error: 'No se pudo exportar los datos.' }, { status: 500 })
  }
}
