export const MODALIDADES = [
  'Modalidad Presencial',
  'Modalidad Semipresencial',
] as const

export const CARRERAS_POR_MODALIDAD: Record<string, string[]> = {
  'Modalidad Presencial': [
    'Administración de Empresas - Presencial',
    'Marketing y Publicidad',
  ],
  'Modalidad Semipresencial': [
    'Administración de Empresas - Semipresencial',
    'Contabilidad y Finanzas',
  ],
}

export const GRADOS = [
  'Primer año',
  'Segundo año',
  'Tercer año',
  'Cuarto año',
] as const

export const SEMESTRES = ['I Semestre', 'II Semestre'] as const

export interface AttendanceRecord {
  id: string
  fechaClase: string
  modalidad: string
  carrera: string
  grado: string
  semestre: string
  asignatura: string
  inscritos: number
  presentes: number
  ausentes: number
  observaciones: string | null
  createdAt: string
  updatedAt: string
}
