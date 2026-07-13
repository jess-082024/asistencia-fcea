'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  FileSpreadsheet, ChevronLeft, ChevronRight, Loader2, Inbox, RefreshCw, FileText,
} from 'lucide-react'
import type { AttendanceRecord } from '@/lib/constants'

function fmtFecha(iso: string): string {
  try {
    const dt = new Date(iso)
    const day = String(dt.getUTCDate()).padStart(2, '0')
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const year = dt.getUTCFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return '—'
  }
}

/** Normaliza el campo de carnets a un array de strings válidos (8 dígitos) */
function parseCarnets(input: any): string[] {
  if (input === undefined || input === null) return []

  if (Array.isArray(input)) {
    return input
      .map((x) => String(x).trim())
      .map((s) => s.replace(/\D/g, '').slice(0, 8))
      .filter((s) => /^\d{8}$/.test(s))
  }

  if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return []

    // intentar parsear JSON (p. ej. '["12345678","87654321"]')
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parseCarnets(parsed)
    } catch {
      // no es JSON, continuar
    }

    // intentar CSV: '12345678,87654321'
    return s
      .split(',')
      .map((x) => x.trim())
      .map((s2) => s2.replace(/\D/g, '').slice(0, 8))
      .filter((s2) => /^\d{8}$/.test(s2))
  }

  // cualquier otro tipo -> intentar convertir a string
  const single = String(input).replace(/\D/g, '').slice(0, 8)
  return /^\d{8}$/.test(single) ? [single] : []
}

export interface RecordsTableHandle {
  refresh: () => void
}

export function RecordsTable({ reloadKey }: { reloadKey: number }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const pageSize = 10

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / pageSize))

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?page=${p}&pageSize=${pageSize}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Error')
      setRecords(data?.records ?? [])
      setTotal(data?.total ?? 0)
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar los registros.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])
  useEffect(() => { setPage(1); load(1) }, [reloadKey, load])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/attendance/export')
      if (!res.ok) throw new Error('No se pudo exportar.')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'asistencia_fcea.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Archivo Excel generado.')
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo exportar a Excel.')
    } finally {
      setExporting(false)
    }
  }

  const cols = ['Fecha', 'Modalidad', 'Carrera', 'Año', 'Semestre', 'Asignatura', 'Inscritos', 'Presentes', 'Ausentes', 'Carnets', 'Observaciones', 'Reporte PDF']

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl bg-white p-5 shadow-md sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[#101F36]">Registros guardados</h2>
          <p className="text-sm text-[#101F36]/60">
            Total: <span className="font-mono font-semibold">{total ?? 0}</span> registro(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101F36] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1c2f52] hover:shadow-md disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || (total ?? 0) === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E3AE50] px-4 py-2.5 text-sm font-semibold text-[#101F36] shadow-sm transition-all hover:bg-[#d39d3c] hover:shadow-md disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Exportar a Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#101F36]/60">
          <Loader2 className="h-8 w-8 animate-spin text-[#E3AE50]" />
          <p className="text-sm">Cargando registros...</p>
        </div>
      ) : (records ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#101F36]/60">
          <Inbox className="h-10 w-10 text-[#D1CCC7]" />
          <p className="text-sm">Aún no hay registros de asistencia.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#D1CCC7]/60">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#101F36] text-left text-white">
                  {cols.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-3 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(records ?? []).map((r, idx) => {
                  // normalizar carnets (soporta carnetausentes o carnetAusentes)
                  const raw = (r as any).carnetAusentes ?? (r as any).carnetausentes ?? []
                  const arr = parseCarnets(raw)
                  const carnetsText = arr.length ? arr.join(', ') : '—'

                  return (
                    <tr
                      key={r?.id ?? idx}
                      className={`align-top transition-colors hover:bg-[#E3AE50]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F4F2F0]'}`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono">{fmtFecha(r?.fechaClase)}</td>
                      <td className="px-3 py-3">{r?.modalidad ?? '—'}</td>
                      <td className="px-3 py-3">{r?.carrera ?? '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{r?.grado ?? '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{r?.semestre ?? '—'}</td>
                      <td className="px-3 py-3">{r?.asignatura ?? '—'}</td>
                      <td className="px-3 py-3 text-center font-mono">{r?.inscritos ?? 0}</td>
                      <td className="px-3 py-3 text-center font-mono text-[#16A34A]">{r?.presentes ?? 0}</td>
                      <td className="px-3 py-3 text-center font-mono text-[#FD011B]">{r?.ausentes ?? 0}</td>
                      <td className="max-w-[260px] px-3 py-3 text-[#101F36]/70 break-words">{carnetsText}</td>
                      <td className="max-w-[260px] px-3 py-3 text-[#101F36]/70">{r?.observaciones || '—'}</td>
                      <td className="px-3 py-3">
                        {r?.pdfUrl ? (
                          <a
                            href={r.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            <FileText className="h-4 w-4" />
                            Ver PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No adjunto</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-[#101F36]/60">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg bg-[#F4F2F0] px-3 py-2 text-sm font-semibold text-[#101F36] transition-colors hover:bg-[#D1CCC7] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg bg-[#F4F2F0] px-3 py-2 text-sm font-semibold text-[#101F36] transition-colors hover:bg-[#D1CCC7] disabled:opacity-40"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}