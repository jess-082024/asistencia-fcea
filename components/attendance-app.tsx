'use client'

import { useState } from 'react'
import { ClipboardEdit, Table2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { AttendanceForm } from '@/components/attendance-form'
import { RecordsTable } from '@/components/records-table'

type Tab = 'registro' | 'reportes'

export function AttendanceApp() {
  const [tab, setTab] = useState<Tab>('registro')
  const [reloadKey, setReloadKey] = useState(0)

  const handleChanged = () => setReloadKey((k) => k + 1)

  const tabBtn = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
      active
        ? 'bg-[#101F36] text-white shadow-md'
        : 'bg-white text-[#101F36] shadow-sm hover:bg-[#F4F2F0]'
    }`

  return (
    <div className="min-h-screen bg-[#D1CCC7]/30">
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-5 max-w-2xl text-sm text-[#101F36]/70 sm:text-base">
          Estimado maestro: Le recordamos la importancia de registrar la asistencia al finalizar cada clase. Esta acción, junto con la posibilidad de consultar o exportar el historial completo, es clave para dar un seguimiento adecuado a nuestros estudiantes y apoyar su proceso de revisión académica.
        </p>

        <div className="sticky top-3 z-20 mb-6 flex w-fit gap-2 rounded-xl bg-white/80 p-1.5 shadow-sm backdrop-blur">
          <button onClick={() => setTab('registro')} className={tabBtn(tab === 'registro')}>
            <ClipboardEdit className="h-4 w-4" />
            Registro
          </button>
          <button onClick={() => setTab('reportes')} className={tabBtn(tab === 'reportes')}>
            <Table2 className="h-4 w-4" />
            Reportes
          </button>
        </div>

        {tab === 'registro' ? (
          <AttendanceForm onChanged={handleChanged} />
        ) : (
          <RecordsTable reloadKey={reloadKey} />
        )}
      </main>

      <footer className="mx-auto max-w-[1200px] px-4 py-8 text-center text-xs text-[#101F36]/50 sm:px-6">
        Facultad de Ciencias Económicas y Administrativas · Sistema de Control de Asistencia
        Todos los derechos reservados © 2026
      </footer>
    </div>
  )
}
