import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export type EstadoPago = 'pendiente' | 'pago_parcial' | 'pago_total'

export interface IPagoHistorial {
  monto: number
  fecha: Date
  nota?: string
  registradoPor: Types.ObjectId
}

export interface IPlanAsignado extends Document {
  proyectoId: Types.ObjectId
  planId: Types.ObjectId
  precioAcordado: number
  mantenimientoActivo: boolean
  mantenimientoPrecioAcordado?: number | null
  fechaAsignacion: Date
  estadoPago: EstadoPago
  montoPagado: number
  fechaUltimoPago?: Date | null
  notasPago?: string | null
  historialPagos: IPagoHistorial[]
  // historial de cambio de plan
  historialCambios: {
    fecha: Date
    planAnterior: Types.ObjectId | null
    planNuevo: Types.ObjectId
    modificadoPor: Types.ObjectId
    nota?: string
  }[]
  createdAt: Date
  updatedAt: Date
}

const PagoHistorialSchema = new Schema<IPagoHistorial>(
  {
    monto: { type: Number, required: true, min: 0 },
    fecha: { type: Date, required: true },
    nota: { type: String },
    registradoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true }
)

const PlanAsignadoSchema = new Schema<IPlanAsignado>(
  {
    proyectoId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    precioAcordado: { type: Number, required: true, min: 0 },
    mantenimientoActivo: { type: Boolean, default: false },
    mantenimientoPrecioAcordado: { type: Number, default: null },
    fechaAsignacion: { type: Date, default: Date.now },
    estadoPago: {
      type: String,
      enum: ['pendiente', 'pago_parcial', 'pago_total'],
      default: 'pendiente',
    },
    montoPagado: { type: Number, default: 0, min: 0 },
    fechaUltimoPago: { type: Date, default: null },
    notasPago: { type: String, default: null },
    historialPagos: [PagoHistorialSchema],
    historialCambios: [
      {
        fecha: { type: Date, default: Date.now },
        planAnterior: { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
        planNuevo: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
        modificadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        nota: { type: String },
      },
    ],
  },
  { timestamps: true }
)

PlanAsignadoSchema.index({ proyectoId: 1 })
PlanAsignadoSchema.index({ planId: 1 })

const PlanAsignado: Model<IPlanAsignado> =
  mongoose.models.PlanAsignado ??
  mongoose.model<IPlanAsignado>('PlanAsignado', PlanAsignadoSchema)

export default PlanAsignado
