'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  CalendarDays, Layers, GraduationCap, BookOpen, CalendarRange,
  Users, UserCheck, UserX, PencilLine, Save, Eraser, Trash2, RefreshCw, Loader2,
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MODALIDADES, CARRERAS_POR_MODALIDAD, GRADOS, SEMESTRES, ASIGNATURAS } from '@/lib/constants'

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const SectionLabel = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <Label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#101F36]">
    <Icon className="h-4 w-4 text-[#E3AE50]" />
    {children}
  </Label>
)

export function AttendanceForm({ onChanged }: { onChanged?: () => void }) {
  const initialDate = useMemo(() => todayISO(), [])

  const [fechaClase, setFechaClase] = useState(initialDate)
  const [modalidad, setModalidad] = useState('')
  const [carrera, setCarrera] = useState('')
  const [grado, setGrado] = useState('')
  const [semestre, setSemestre] = useState('')
  const [asignatura, setAsignatura] = useState('')
  const [inscritos, setInscritos] = useState('')
  const [presentes, setPresentes] = useState('')
  const [observaciones, setObservaciones] = useState('')
  // nuevos estados para múltiples carnets
  const [carnetInput, setCarnetInput] = useState('')
  const [carnetsAusentes, setCarnetsAusentes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState<null | 'create' | 'update' | 'delete'>(null)

  // estados para el PDF
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null)

  const carreras = modalidad ? (CARRERAS_POR_MODALIDAD[modalidad] ?? []) : []
  const asignaturas =
    modalidad && carrera && grado
      ? (ASIGNATURAS[modalidad]?.[carrera]?.[grado] ?? [])
      : []

  const gradosDisponibles = useMemo(() => {
    if (modalidad === 'Modalidad Presencial') {
      return ['Primer año', 'Segundo año', 'Tercer año', 'Cuarto año']
    }
    return ['Primer año', 'Segundo año', 'Tercer año', 'Cuarto año', 'Quinto año']
  }, [modalidad])

  const ausentes = useMemo(() => {
    const i = parseInt(inscritos, 10)
    const p = parseInt(presentes, 10)
    if (!Number.isFinite(i) || !Number.isFinite(p)) return ''
    const diff = i - p
    return diff >= 0 ? String(diff) : ''
  }, [inscritos, presentes])

  const resetForm = () => {
    setFechaClase(todayISO())
    setModalidad('')
    setCarrera('')
    setGrado('')
    setSemestre('')
    setAsignatura('')
    setInscritos('')
    setPresentes('')
    setObservaciones('')
    setCarnetInput('')
    setCarnetsAusentes([])
  }

  const handleClear = () => {
    resetForm()
    toast.success('Formulario limpiado.')
  }

  const addCarnet = () => {
    const v = carnetInput.replace(/\D/g, '').slice(0, 8)
    if (!/^\d{8}$/.test(v)) {
      toast.error('El carnet debe tener exactamente 8 dígitos.')
      return
    }
    if (carnetsAusentes.includes(v)) {
      toast.error('Ese carnet ya fue agregado.')
      return
    }
    setCarnetsAusentes((s) => [...s, v])
    setCarnetInput('')
  }

  const removeCarnet = (c: string) => {
    setCarnetsAusentes((s) => s.filter(x => x !== c))
  }

  const validate = (): string | null => {
    if (!fechaClase) return 'La fecha de clase es obligatoria.'
    if (!modalidad) return 'Selecciona una modalidad.'
    if (!carrera) return 'Selecciona una carrera.'
    if (!grado) return 'Selecciona el grado / año.'
    if (!semestre) return 'Selecciona el semestre.'
    if (!asignatura) return 'Selecciona la asignatura.'
    if (inscritos === '' ) return 'Ingresa la cantidad de inscritos.'
    if (presentes === '') return 'Ingresa la cantidad de presentes.'
    const i = parseInt(inscritos, 10)
    const p = parseInt(presentes, 10)
    if (!Number.isFinite(i) || i < 0) return 'La cantidad de inscritos no es válida.'
    if (!Number.isFinite(p) || p < 0) return 'La cantidad de presentes no es válida.'
    if (p > i) return 'Los presentes no pueden ser mayores que los inscritos.'
    if (carnetsAusentes.some(c => !/^\d{8}$/.test(c))) return 'Uno o más carnets no son válidos (8 dígitos).'
    return null
  }

  const buildPayload = () => ({
    fechaClase,
    modalidad,
    carrera,
    grado,
    semestre,
    asignatura: asignatura.trim(),
    inscritos: parseInt(inscritos, 10),
    presentes: parseInt(presentes, 10),
    observaciones: observationsToNullIfEmpty(observaciones),
    carnetAusentes: carnetsAusentes, // ahora es string[]
  })

  function observationsToNullIfEmpty(v: string) {
    const s = (v ?? '').toString().trim()
    return s ? s : null
  }

  // ---- Upload helper: sube el archivo y devuelve la URL normalizada ----
  async function uploadFile(file: File): Promise<string | null> {
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      body: file,
    })

    const data = await res.json().catch(() => ({}))
    console.log('uploadData:', data)

    // intentar normalizar distintas formas de respuesta
    if (!res.ok) {
      // si el endpoint devolvió un error, propaga la info
      const message = data?.error || 'Error subiendo el archivo'
      throw new Error(message)
    }

    const url = data?.url || data?.publicUrl || data?.raw?.url || data?.raw?.publicUrl || data?.raw?.key || null
    return url
  }

  // ---- Manejo de envío (creación) ----
  const handleSubmit = async () => {
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting('create')

    try {
      let finalPdfUrl = uploadedPdfUrl

      // 1) Si hay archivo seleccionado y aún no subido, lo subimos primero
      if (selectedFile && !finalPdfUrl) {
        if (selectedFile.type !== 'application/pdf') {
          toast.error('Solo se permiten archivos PDF.')
          setSubmitting(null)
          return
        }
        const maxBytes = 10 * 1024 * 1024 // 10 MB
        if (selectedFile.size > maxBytes) {
          toast.error('El archivo es muy grande (máx 10 MB).')
          setSubmitting(null)
          return
        }

        setUploadingDoc(true)
        try {
          finalPdfUrl = await uploadFile(selectedFile)
        } catch (err: any) {
          console.error('Error subiendo PDF:', err)
          toast.error(err?.message || 'Error al subir PDF.')
          setUploadingDoc(false)
          setSubmitting(null)
          return
        } finally {
          setUploadingDoc(false)
        }

        if (!finalPdfUrl) {
          toast.error('No se obtuvo URL pública del PDF.')
          setSubmitting(null)
          return
        }

        setUploadedPdfUrl(finalPdfUrl)
        toast.success('PDF subido correctamente.')
      }

      // 2) Creamos el payload y guardamos el registro (incluyendo pdfUrl)
      const payload = { ...buildPayload(), pdfUrl: finalPdfUrl ?? null }
      console.log('payload before POST:', payload)

      const res2 = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data2 = await res2.json().catch(() => ({}))
      console.log('POST response:', res2.status, data2)

      if (!res2.ok) {
        throw new Error(data2?.error || 'Error al registrar.')
      }

      toast.success('Registro guardado correctamente.')
      resetForm()
      setSelectedFile(null)
      setUploadedPdfUrl(null)
      onChanged?.()
    } catch (e: any) {
      console.error('Error en handleSubmit:', e)
      toast.error(e?.message || 'No se pudo guardar el registro.')
    } finally {
      setUploadingDoc(false)
      setSubmitting(null)
    }
  }

  const handleUpdateLast = async () => {
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting('update')
    try {
      const res = await fetch('/api/attendance/last', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Error al actualizar.')
      toast.success('Último registro actualizado.')
      onChanged?.()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar el último registro.')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDeleteLast = async () => {
    setSubmitting('delete')
    try {
      const res = await fetch('/api/attendance/last', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Error al eliminar.')
      toast.success('Último registro eliminado.')
      onChanged?.()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar el último registro.')
    } finally {
      setSubmitting(null)
    }
  }

  const fieldWrap = 'rounded-lg bg-[#F4F2F0] p-4 shadow-sm transition-shadow hover:shadow-md'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl bg-white p-5 shadow-md sm:p-7"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={fieldWrap}>
          <SectionLabel icon={CalendarRange}>Semestre</SectionLabel>
          <Select value={semestre} onValueChange={setSemestre}>
            <SelectTrigger><SelectValue placeholder="Selecciona el semestre" /></SelectTrigger>
            <SelectContent>
              {SEMESTRES.map((s) => (
                <SelectItem key={s} value={s} disabled={s === 'I Semestre 2026'}>
                  {s === 'I Semestre 2026' ? `${s} (no disponible)` : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={Layers}>Modalidad</SectionLabel>
          <Select
            value={modalidad}
            onValueChange={(v) => { setModalidad(v); setCarrera(''); setAsignatura(''); setGrado('') }}
          >
            <SelectTrigger><SelectValue placeholder="Selecciona la modalidad" /></SelectTrigger>
            <SelectContent>
              {MODALIDADES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={BookOpen}>Carrera</SectionLabel>
          <Select
            value={carrera}
            onValueChange={(v) => { setCarrera(v); setAsignatura(''); setGrado('') }}
            disabled={!modalidad}
          >
            <SelectTrigger>
              <SelectValue placeholder={modalidad ? 'Selecciona la carrera' : 'Primero elige la modalidad'} />
            </SelectTrigger>
            <SelectContent>
              {carreras.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={GraduationCap}>Grado / Año</SectionLabel>
          <Select
            value={grado}
            onValueChange={(v) => { setGrado(v); setAsignatura('') }}
          >
            <SelectTrigger><SelectValue placeholder="Selecciona el año" /></SelectTrigger>
            <SelectContent>
              {gradosDisponibles.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={BookOpen}>Seleccione asignatura</SectionLabel>
          <Select
            value={asignatura}
            onValueChange={setAsignatura}
            disabled={!modalidad || !carrera || !grado}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !modalidad || !carrera || !grado
                    ? 'Elige modalidad, carrera y año'
                    : 'Selecciona la asignatura'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {asignaturas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={CalendarDays}>Fecha de clase</SectionLabel>
          <Input type="date" value={fechaClase} onChange={(e) => setFechaClase(e.target.value)} />
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={Users}>Cantidad inscritos</SectionLabel>
          <Input
            type="number" min={0} inputMode="numeric"
            value={inscritos}
            onChange={(e) => setInscritos(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className={fieldWrap}>
          <SectionLabel icon={UserCheck}>Cantidad presentes</SectionLabel>
          <Input
            type="number" min={0} inputMode="numeric"
            value={presentes}
            onChange={(e) => setPresentes(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Cantidad ausentes (automático) */}
        <div className={fieldWrap}>
          <SectionLabel icon={UserX}>Cantidad ausentes (automático)</SectionLabel>
          <Input
            value={ausentes}
            readOnly
            placeholder="Se calcula automáticamente"
            className="cursor-not-allowed bg-[#D1CCC7]/40 font-mono font-semibold text-[#101F36]"
          />
        </div>

        {/* Carnets de estudiantes ausentes (inputs dinámicos) */}
        <div className={fieldWrap}>
          <SectionLabel icon={UserX}>Carnet(s) estudiantes ausentes</SectionLabel>

          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="Agregar carnet (8 dígitos)"
              value={carnetInput}
              onChange={(e) => setCarnetInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
            />
            <button
              type="button"
              onClick={addCarnet}
              className="inline-flex items-center px-3 py-2 rounded bg-[#101F36] text-white text-sm"
            >
              Agregar
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {carnetsAusentes.map((c) => (
              <span key={c} className="flex items-center gap-2 rounded-full bg-[#E3AE50]/20 px-3 py-1 text-sm">
                <span className="font-mono">{c}</span>
                <button onClick={() => removeCarnet(c)} className="text-sm text-red-600">x</button>
              </span>
            ))}
          </div>
        </div>

        {/* Bloque para subir PDF */}
        <div className={fieldWrap}>
          <SectionLabel icon={PencilLine}>Adjuntar Reporte PDF (opcional)</SectionLabel>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="mt-1 bg-white"
          />

          {selectedFile && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#101F36] truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              {uploadingDoc && (
                <span className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Subiendo archivo...
                </span>
              )}
            </div>
          )}

          {uploadedPdfUrl && (
            <div className="mt-2">
              <a 
                href={uploadedPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-green-600 font-bold underline flex items-center gap-1"
              >
                <Save className="h-3 w-3" /> PDF listo para guardar
              </a>
            </div>
          )}
        </div>

        <div className={`${fieldWrap} md:col-span-2`}>
          <SectionLabel icon={PencilLine}>Observaciones</SectionLabel>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas sobre ausentes o llegadas tarde..."
            rows={3}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting !== null}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#15803D] hover:shadow-md disabled:opacity-60 sm:flex-none"
        >
          {submitting === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Registrar
        </button>

        <button
          onClick={handleClear}
          disabled={submitting !== null}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#101F36] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1c2f52] hover:shadow-md disabled:opacity-60 sm:flex-none"
        >
          <Eraser className="h-4 w-4" />
          Limpiar
        </button>
      </div>
    </motion.div>
  )
}