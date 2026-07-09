export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import ExcelJS from 'exceljs'

function fmtFecha(d: Date | null | undefined): string {
  try {
    if (!d) return ''
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
    const records = await prisma.attendanceRecord.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Workbook & sheet
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Asistencia')

    // Paleta (ARGB)
    const colorDark = 'FF101F36' // header oscuro
    const colorAccent = 'FFE3AE50' // acento dorado
    const colorAlt = 'FFF4F2F0' // zebra alterna
    const colorLight = 'FFD1CCC7' // no usado directamente, pero disponible

    // Título (fila 1) - opcional
    ws.mergeCells('A1:J1')
    const titleCell = ws.getCell('A1')
    titleCell.value = 'Registro de Asistencia - Facultad de Ciencias Económicas y Administrativas'
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    titleCell.font = { size: 13, bold: true, color: { argb: colorDark } }

    // fila en blanco separadora
    ws.addRow([])

    // Encabezado (fila 3)
    const header = [
      'Fecha',
      'Modalidad',
      'Carrera',
      'Año',
      'Semestre',
      'Asignatura',
      'Inscritos',
      'Presentes',
      'Ausentes',
      'Observaciones',
    ]
    const headerRow = ws.addRow(header)

    // Column widths
    ws.columns = [
      { key: 'fecha', width: 12 },
      { key: 'modalidad', width: 18 },
      { key: 'carrera', width: 34 },
      { key: 'grado', width: 12 },
      { key: 'semestre', width: 14 },
      { key: 'asignatura', width: 30 },
      { key: 'inscritos', width: 10 },
      { key: 'presentes', width: 10 },
      { key: 'ausentes', width: 10 },
      { key: 'observaciones', width: 40 },
    ]

    // Estilos del encabezado
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorDark } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    // Agregar filas con formato y zebra
    records.forEach((r, i) => {
      const row = ws.addRow([
        fmtFecha(r.fechaClase),
        r.modalidad ?? '',
        r.carrera ?? '',
        r.grado ?? '',
        r.semestre ?? '',
        r.asignatura ?? '',
        r.inscritos ?? 0,
        r.presentes ?? 0,
        r.ausentes ?? 0,
        r.observaciones ?? '',
      ])

      const isAlt = i % 2 === 0
      row.eachCell((cell, colNumber) => {
        // Observaciones: wrap, left; números: center
        if (colNumber === 10) {
          cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }
        } else if (colNumber >= 7 && colNumber <= 9) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }

        // Zebra fill
        if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorAlt } }
        }

        // Bordes sutiles
        cell.border = {
          top: { style: 'hair' },
          left: { style: 'hair' },
          bottom: { style: 'hair' },
          right: { style: 'hair' },
        }
      })

      // Colorear presentes/ausentes
      const presentesCell = row.getCell(8)
      const ausentesCell = row.getCell(9)
      if (typeof r.presentes === 'number' && r.presentes > 0) {
        presentesCell.font = { color: { argb: 'FF0A8A0A' }, bold: true } // verde
      }
      if (typeof r.ausentes === 'number' && r.ausentes > 0) {
        ausentesCell.font = { color: { argb: 'FFB00020' }, bold: true } // rojo
      }
    })

    // Congelar encabezado (título + header)
    ws.views = [{ state: 'frozen', ySplit: 3 }]

    // Altura por defecto
    ws.properties.defaultRowHeight = 20

    // (Opcional) Pie de página o fila resumen: puedes agregar aquí si lo deseas

    // Generar buffer
    const buffer = await wb.xlsx.writeBuffer()

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="asistencia_fcea.xlsx"',
      },
    })
  } catch (error) {
    console.error('GET /api/attendance/export error:', error)
    return NextResponse.json({ error: 'No se pudo exportar los datos.' }, { status: 500 })
  }
}