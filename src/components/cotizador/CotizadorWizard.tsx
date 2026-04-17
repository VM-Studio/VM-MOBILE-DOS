'use client'

import { useState, useEffect } from 'react'
import StepIndicator from './StepIndicator'
import Step1Servicio from './steps/Step1Servicio'
import Step2Web from './steps/Step2Web'
import Step3App from './steps/Step3App'
import Step5General from './steps/Step5General'
import Step6Datos from './steps/Step6Datos'
import ResultadoCotizacion from './ResultadoCotizacion'

const LS_KEY = 'vm_cotizador_progress'

export interface CotizadorFormState {
  servicios: string[]
  webTipo: string
  webPaginas: string
  webContacto: string[]
  webExtras: string[]
  appTipo: string
  appRubro: string
  appExtras: string[]
  etapaNegocio: string
  tieneWeb: boolean | undefined
  urlWebActual: string
  cuandoEmpezar: string
  comoNosConocio: string
  nombre: string
  empresa: string
  email: string
  whatsapp: string
  preferenciaContacto: string
  aceptaContacto: boolean
}

const INITIAL: CotizadorFormState = {
  servicios: [],
  webTipo: '', webPaginas: '', webContacto: [], webExtras: [],
  appTipo: '', appRubro: '', appExtras: [],
  etapaNegocio: '', tieneWeb: undefined, urlWebActual: '',
  cuandoEmpezar: '', comoNosConocio: '',
  nombre: '', empresa: '', email: '', whatsapp: '',
  preferenciaContacto: '', aceptaContacto: false,
}

interface Resultado {
  total: number
  tiempoEstimado: { label: string }
  pdfUrl: string
  presupuestoNumber: string
}

const STEP_LABELS = ['Servicio', 'Web', 'App', 'General', 'Datos']

function getActiveSteps(servicios: string[]) {
  const steps: number[] = [1]
  if (servicios.includes('web')) steps.push(2)
  if (servicios.includes('app')) steps.push(3)
  steps.push(5, 6)
  return steps
}

function validate(stepNum: number, form: CotizadorFormState): string | null {
  if (stepNum === 1 && form.servicios.length === 0)
    return 'Seleccioná al menos un servicio para continuar.'
  if (stepNum === 2 && !form.webTipo)
    return 'Seleccioná el tipo de web.'
  if (stepNum === 3 && !form.appTipo)
    return 'Seleccioná el tipo de aplicación.'
  return null
}

export default function CotizadorWizard() {
  const [form, setForm] = useState<CotizadorFormState>(INITIAL)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)

  // Restore progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(parsed.form ?? INITIAL)
        setCurrentStep(parsed.step ?? 1)
      }
    } catch { /* ignore */ }
  }, [])

  // Save progress on each change
  useEffect(() => {
    if (resultado) return
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ form, step: currentStep }))
    } catch { /* ignore */ }
  }, [form, currentStep, resultado])

  const activeSteps = getActiveSteps(form.servicios)
  const totalSteps = activeSteps.length

  // Map logical step index to 1-based UI step
  const currentIdx = activeSteps.indexOf(currentStep)
  const stepLabels = activeSteps.map((s) => STEP_LABELS[s - 1])

  const setField = (field: string, val: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleNext = () => {
    setError('')
    const err = validate(currentStep, form)
    if (err) { setError(err); return }
    const nextIdx = currentIdx + 1
    if (nextIdx < activeSteps.length) {
      setCurrentStep(activeSteps[nextIdx])
    }
  }

  const handleBack = () => {
    setError('')
    const prevIdx = currentIdx - 1
    if (prevIdx >= 0) setCurrentStep(activeSteps[prevIdx])
  }

  const handleSubmit = async () => {
    setError('')
    const err = validate(6, form)
    if (err) { setError(err); return }
    setIsSubmitting(true)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vm_token') : null
      const res = await fetch('/api/cotizador/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Ocurrió un error. Intentá nuevamente.')
        setIsSubmitting(false)
        return
      }
      // Clear progress
      localStorage.removeItem(LS_KEY)
      setResultado(data)
    } catch {
      setError('Error de conexión. Revisá tu internet e intentá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm(INITIAL)
    setCurrentStep(1)
    setResultado(null)
    localStorage.removeItem(LS_KEY)
  }

  // Loading overlay
  if (isSubmitting) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-light">Estamos calculando tu presupuesto... ⚡</p>
      </div>
    )
  }

  // Result
  if (resultado) {
    return (
      <ResultadoCotizacion
        nombre={form.nombre}
        email={form.email}
        total={resultado.total}
        tiempoEstimado={resultado.tiempoEstimado.label}
        pdfUrl={resultado.pdfUrl}
        presupuestoNumber={resultado.presupuestoNumber}
        onReset={handleReset}
      />
    )
  }

  const isLastStep = currentStep === 6

  return (
    <div>
      <StepIndicator
        currentStep={currentIdx + 1}
        totalSteps={totalSteps}
        stepLabels={stepLabels}
      />

      <div className="min-h-[350px]">
        {currentStep === 1 && (
          <Step1Servicio
            selected={form.servicios}
            onChange={(val) => setField('servicios', val)}
          />
        )}
        {currentStep === 2 && (
          <Step2Web
            webTipo={form.webTipo}
            webPaginas={form.webPaginas}
            webContacto={form.webContacto}
            webExtras={form.webExtras}
            onChange={setField}
          />
        )}
        {currentStep === 3 && (
          <Step3App
            appTipo={form.appTipo}
            appRubro={form.appRubro}
            appExtras={form.appExtras}
            onChange={setField}
          />
        )}
        {currentStep === 5 && (
          <Step5General
            etapaNegocio={form.etapaNegocio}
            tieneWeb={form.tieneWeb}
            urlWebActual={form.urlWebActual}
            cuandoEmpezar={form.cuandoEmpezar}
            comoNosConocio={form.comoNosConocio}
            onChange={setField}
          />
        )}
        {currentStep === 6 && (
          <Step6Datos
            nombre={form.nombre}
            empresa={form.empresa}
            email={form.email}
            whatsapp={form.whatsapp}
            preferenciaContacto={form.preferenciaContacto}
            aceptaContacto={form.aceptaContacto}
            onChange={setField}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-4">{error}</p>
      )}

      {/* Nav buttons (not on step 6 — it has its own submit) */}
      {currentStep !== 6 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleBack}
            disabled={currentIdx === 0}
            className="px-5 py-2.5 border border-gray-300 text-sm text-gray-600 tracking-wider hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <button
            onClick={isLastStep ? handleSubmit : handleNext}
            className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-blue-700 text-white text-sm font-medium tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            Siguiente →
          </button>
        </div>
      )}
      {currentStep === 6 && currentIdx > 0 && (
        <button
          onClick={handleBack}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver al paso anterior
        </button>
      )}
    </div>
  )
}
