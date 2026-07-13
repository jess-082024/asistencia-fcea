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

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Asistencia')

    const colorDark = 'FF101F36'
    const colorAlt = 'FFF4F2F0'

    // Título
    ws.mergeCells('A1:L1') // Aumentado a L por las nuevas columnas
    const titleCell = ws.getCell('A1')
    titleCell.value = 'Registro de Asistencia - Facultad de Ciencias Económicas y Administrativas'
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    titleCell.font = { size: 13, bold: true, color: { argb: colorDark } }

    ws.addRow([])

    // Encabezados (Añadido Carnets y Archivo)
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
      'Carnets Ausentes',
      'Archivo PDF'
    ]
    const headerRow = ws.addRow(header)

    // Configuración de columnas
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
      { key: 'carnets', width: 35 },
      { key: 'archivo', width: 40 },
    ]

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorDark } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    records.forEach((r, i) => {
      // Convertir el array de carnetausentes a una sola cadena de texto separada por comas
      const carnetsTexto = Array.isArray(r.carnetausentes) ? r.carnetausentes.join(', ') : '';
      // @ts-ignore (por si pdfUrl aún no se refleja en los tipos de Prisma)
      const pdfLink = r.pdfUrl || '';

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
        carnetsTexto,
        pdfLink
      ])

      const isAlt = i % 2 === 0
      row.eachCell((cell, colNumber) => {
        if (colNumber === 10 || colNumber === 11) { // Observaciones y Carnets
          cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }
        } else if (colNumber >= 7 && colNumber <= 9) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }

        if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorAlt } }
        }
        cell.border = { top: { style: 'hair' }, left: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } }
      })

      // Colorear números
      const presentesCell = row.getCell(8)
      const ausentesCell = row.getCell(9)
      if (r.presentes > 0) presentesCell.font = { color: { argb: 'FF0A8A0A' }, bold: true }
      if (r.ausentes > 0) ausentesCell.font = { color: { argb: 'FFB00020' }, bold: true }

      // Convertir la celda del PDF en un clicable real
      if (pdfLink) {
        const fileCell = row.getCell(12)
        fileCell.value = { text: 'Ver Reporte', hyperlink: pdfLink }
        fileCell.font = { color: { argb: 'FF0000FF' }, underline: true }
      }
    })

    ws.views = [{ state: 'frozen', ySplit: 3 }]
    ws.properties.defaultRowHeight = 22

    const buffer = await wb.xlsx.writeBuffer()
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="asistencia_fcea.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error exportando:', error)
    return NextResponse.json({ error: 'Fallo al exportar excel' }, { status: 500 })
  }
}