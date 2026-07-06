'use client'

import Image from 'next/image'
import { GraduationCap, ClipboardList } from 'lucide-react'
import { motion } from 'framer-motion'

export function SiteHeader() {
  return (
    <header className="w-full bg-[#101F36] text-white shadow-lg">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="hidden h-12 w-12 items-center justify-center rounded-lg bg-white/5 sm:flex">
            <GraduationCap className="h-7 w-7 text-[#E3AE50]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold leading-tight tracking-tight sm:text-xl md:text-2xl">
              FACULTAD DE CIENCIAS ECONÓMICAS Y ADMINISTRATIVAS
            </h1>
            <div className="mt-1 flex items-center gap-2 text-[#E3AE50]">
              <ClipboardList className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wide sm:text-sm">
                Registro de reporte de asistencia de estudiantes
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16"
        >
          <Image
            src="/logo_fcea.png"
            alt="Emblema de la Facultad de Ciencias Económicas y Administrativas"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </motion.div>
      </div>
      <div className="h-1 w-full bg-[#E3AE50]" />
    </header>
  )
}
