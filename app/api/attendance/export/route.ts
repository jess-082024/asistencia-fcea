export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';

function fmtFecha(d: Date | null | undefined): string {
  try {
    if (!d) return '';
    const dt = new Date(d);
    const day = String(dt.getUTCDate()).padStart(2, '0');
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const year = dt.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export async function GET() {
  try {
    const records = await prisma.attendanceRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Asistencia');

    const colorDark = 'FF101F36';
    const colorAlt = 'FFF4F2F0';

    // Título (ajustado para 12 columnas)
    ws.mergeCells('A1:L1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Registro de Asistencia - Facultad de Ciencias Económicas y Administrativas';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { size: 13, bold: true, color: { argb: colorDark } };

    ws.addRow([]);

    // Encabezados (añadimos Carnets Ausentes y Archivo PDF)
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
      'Archivo PDF',
    ];
    const headerRow = ws.addRow(header);

    // Configuración de columnas (12 columnas)
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
    ];

    // Estilo de encabezado
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorDark } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Filas con datos
    records.forEach((r, i) => {
      const carnetsTexto = Array.isArray(r.carnetausentes) ? r.carnetausentes.join(', ') : (r.carnetausentes ?? '');
      // @ts-ignore: puede que prisma client no tenga el tipo actualizado en tiempo de edición
      const pdfLink = (r as any).pdfUrl ?? '';

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
        pdfLink,
      ]);

      const isAlt = i % 2 === 0;
      row.eachCell((cell, colNumber) => {
        // Observaciones y Carnets deben hacer wrap
        if (colNumber === 10 || colNumber === 11) {
          cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        } else if (colNumber >= 7 && colNumber <= 9) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Zebra fill
        if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorAlt } };
        }

        // Bordes sutiles
        cell.border = {
          top: { style: 'hair' },
          left: { style: 'hair' },
          bottom: { style: 'hair' },
          right: { style: 'hair' },
        };
      });

      // Colorear presentes/ausentes
      const presentesCell = row.getCell(8);
      const ausentesCell = row.getCell(9);
      if (typeof r.presentes === 'number' && r.presentes > 0) {
        presentesCell.font = { color: { argb: 'FF0A8A0A' }, bold: true };
      }
      if (typeof r.ausentes === 'number' && r.ausentes > 0) {
        ausentesCell.font = { color: { argb: 'FFB00020' }, bold: true };
      }

      // Hacer la celda de PDF clicable en Excel
      if (pdfLink) {
        const fileCell = row.getCell(12); // columna 12 -> Archivo PDF
        fileCell.value = { text: 'Ver Reporte', hyperlink: pdfLink };
        fileCell.font = { color: { argb: 'FF0000FF' }, underline: true };
      }
    });

    // Congelar encabezado
    ws.views = [{ state: 'frozen', ySplit: 3 }];
    ws.properties.defaultRowHeight = 22;

    // Generar buffer y devolver como Response (ArrayBuffer) — evita problemas de tipos con NextResponse/Buffer
    const arrayBuffer = await wb.xlsx.writeBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="asistencia_fcea.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error exportando:', error);
    return NextResponse.json({ error: 'Fallo al exportar excel' }, { status: 500 });
  }
}