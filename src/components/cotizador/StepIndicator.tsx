'use client'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export default function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting lines */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1
          const isCompleted = step < currentStep
          const isActive = step === currentStep

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isActive
                    ? 'bg-white border-2 border-blue-600 text-blue-600'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span
                className={`text-[9px] font-medium tracking-wider uppercase hidden sm:block transition-colors ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-gray-600' : 'text-gray-300'
                }`}
              >
                {stepLabels[i]}
              </span>
            </div>
          )
        })}
      </div>
      {/* Mobile: show current step name */}
      <p className="sm:hidden text-center text-[10px] font-medium tracking-widest uppercase text-blue-600 mt-3">
        {stepLabels[currentStep - 1]}
      </p>
    </div>
  )
}
