import mongoose, { Document, Model, Schema } from 'mongoose'

export type TipoPago = 'pago_unico' | 'mensual'

export interface IPlan extends Document {
  nombre: string
  descripcion: string
  precio: number
  tipoPago: TipoPago
  mantenimientoPrecio?: number | null
  mantenimientoObligatorio: boolean
  incluye: string[]
  activo: boolean
  orden: number
  createdAt: Date
  updatedAt: Date
}

const PlanSchema = new Schema<IPlan>(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    tipoPago: {
      type: String,
      enum: ['pago_unico', 'mensual'],
      default: 'pago_unico',
    },
    mantenimientoPrecio: { type: Number, default: null },
    mantenimientoObligatorio: { type: Boolean, default: false },
    incluye: [{ type: String, trim: true }],
    activo: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
)

PlanSchema.index({ activo: 1, orden: 1 })

const Plan: Model<IPlan> =
  mongoose.models.Plan ?? mongoose.model<IPlan>('Plan', PlanSchema)

export default Plan
