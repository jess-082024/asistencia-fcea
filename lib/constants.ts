export const MODALIDADES = [
  'Modalidad Presencial',
  'Modalidad Semipresencial',
] as const

export const CARRERAS_POR_MODALIDAD: Record<string, string[]> = {
  'Modalidad Presencial': [
    'Administración de Empresas',
    'Marketing y Publicidad',
  ],
  'Modalidad Semipresencial': [
    'Administración de Empresas',
    'Contabilidad y Finanzas',
  ],
}

export const GRADOS = [
  'Primer año',
  'Segundo año',
  'Tercer año',
  'Cuarto año',
  'Quinto año',
] as const

export const SEMESTRES = ['I Semestre 2026', 'II Semestre 2026'] as const

// Asignaturas según Modalidad -> Carrera -> Año (basado en el Excel FCE)
// NOTA: claves EXACTAS deben coincidir con los valores usados en los <select>
export const ASIGNATURAS: Record<string, Record<string, Record<string, string[]>>> = {
  'Modalidad Presencial': {
    'Administración de Empresas': {
      'Primer año': [
        'Historia e Identidad Nacional',
        'Matemática Aplicada a la Administración II',
        'Comunicación Técnica',
        'Inglés A1.2',
        'Marketing II',
        'Contabilidad',
      ],
      'Segundo año': [
        'Contabilidad de Costos II',
        'Marketing II',
        'Estadística II',
        'Inglés IV',
        'Matemática Financiera',
        'Fundamentos de Filosofía',
        'Derecho Laboral',
        'Microeconomía',
      ],
      'Tercer año': [
        'Gestión de Recursos Humanos',
        'Administración de la Producción I',
        'Gerencia de Servicios',
        'Gerencia de la Pequeña y Mediana Empresa',
        'Taller de Presupuesto',
        'Gestión Financiera II',
        'Inglés VI',
      ],
      'Cuarto año': [
        'Marketing y Comercio Internacional',
        'Administración Pública',
        'Gerencia de Proyectos',
        'Finanzas Internacionales',
        'Gerencia Estratégica',
        'Desarrollo Empresarial',
      ],
      'Quinto año': [], // si corresponde
    },
    'Marketing y Publicidad': {
      'Primer año': [
        'Informática Aplicada',
        'Matemática Aplicada II',
        'Historia e Identidad Nacional',
        'Gestión Estratégica Empresarial',
        'Marketing Estratégico II',
        'Inglés A1.2',
        'Inteligencia Artificial Aplicada al Marketing',
      ],
      'Segundo año': [
        'Gestión Financiera',
        'Fundamentos de Filosofía',
        'Microeconomía',
        'Publicidad BTL',
        'Análisis de Costos y Precios II',
        'E-commerce / E-Business',
        'Inglés IV',
      ],
      'Tercer año': [
        'Marketing Digital',
        'Diseño Publicitario Integral I',
        'Logística y Abastecimiento',
        'Investigación de Mercados',
        'Administración de las Fuerzas de Ventas',
        'Gestión de Recursos Humanos',
        'Inglés VI',
      ],
      'Cuarto año': [
        'Plan de Negocios',
        'Marketing de Turismo',
        'Marketing Social',
        'Imagen e Identidad Corporativa',
        'Campaña Publicitaria',
        'Marketing y Comercio Internacional',
      ],
      'Quinto año': [],
    },
  },
  'Modalidad Semipresencial': {
    'Administración de Empresas': { // <-- quitado espacio final aquí
      'Primer año': [
        'Matemática Aplicada a la Administración II',
        'Fundamentos de Administración y Comportamiento Organizacional',
        'Contabilidad',
        'Inglés A1.2',
        'Historia e Identidad Nacional',
      ],
      'Segundo año': [
        'Macroeconomía',
        'Estadística II',
        'Marketing I',
        'Contabilidad de Costos I',
        'Fundamentos de Filosofía',
        'Inglés IV',
      ],
      'Tercer año': [
        'Gestión Financiera I',
        'Investigación de Mercados',
        'Métodos Cuantitativos para Negocios',
        'Derecho Laboral',
        'Inglés VI',
        'Organización y Métodos',
      ],
      'Cuarto año': [
        'Gestión de Recursos Humanos',
        'Logística y Abastecimiento',
        'Finanzas Internacionales',
        'Gerencia de Servicios',
        'Administración de la Producción I',
      ],
      'Quinto año': [
        'Desarrollo Empresarial',
        'Administración Pública',
        'Gerencia de Proyectos',
        'Gerencia Estratégica',
      ],
    },
    'Contabilidad y Finanzas': {
      'Primer año': [
        'Contabilidad I',
        'Fundamentos de Administración',
        'Análisis del Sector Empresarial Nicaragüense',
        'Inglés A1.2',
        'Historia e Identidad Nacional',
      ],
      'Segundo año': [
        'Análisis Financiero I',
        'Laboratorio de Contabilidad',
        'Inglés II',
        'Fundamentos de Filosofía',
        'Contabilidad de Costos II',
      ],
      'Tercer año': [],
      'Cuarto año': [],
      'Quinto año': [],
    },
  },
}

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