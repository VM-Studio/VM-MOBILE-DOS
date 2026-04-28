import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export type TipoMantenimiento = 'mensual_recurrente' | 'puntual'
export type EstadoMantenimiento = 'pendiente_aprobacion' | 'activo' | 'pausado' | 'cancelado'

export interface ICobroHistorial {
  _id: Types.ObjectId
  fecha: Date
  monto: number
  estado: 'cobrado' | 'pendiente' | 'fallido'
  nota?: string
  registradoPor: Types.ObjectId
}

export interface IMantenimiento extends Document {
  proyectoId: Types.ObjectId
  planAsignadoId?: Types.ObjectId | null
  clienteId: Types.ObjectId
  tipo: TipoMantenimiento
  estado: EstadoMantenimiento
  precioMensual: number
  fechaSolicitud: Date
  fechaAprobacion?: Date | null
  aprobadoPor?: Types.ObjectId | null
  fechaInicio?: Date | null
  fechaProximoCobro?: Date | null
  fechaCancelacion?: Date | null
  motivoCancelacion?: string | null
  notaCliente?: string | null
  notaAdmin?: string | null
  cobrosRealizados: number
  historialCobros: ICobroHistorial[]
  createdAt: Date
  updatedAt: Date
}

const CobroHistorialSchema = new Schema<ICobroHistorial>(
  {
    fecha: { type: Date, required: true },
    monto: { type: Number, required: true, min: 0 },
    estado: {
      type: String,
      enum: ['cobrado', 'pendiente', 'fallido'],
      default: 'cobrado',
    },
    nota: { type: String },
    registradoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true }
)

const MantenimientoSchema = new Schema<IMantenimiento>(
  {
    proyectoId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    planAsignadoId: { type: Schema.Types.ObjectId, ref: 'PlanAsignado', default: null },
    clienteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: {
      type: String,
      enum: ['mensual_recurrente', 'puntual'],
      required: true,
    },
    estado: {
      type: String,
      enum: ['pendiente_aprobacion', 'activo', 'pausado', 'cancelado'],
      default: 'pendiente_aprobacion',
    },
    precioMensual: { type: Number, required: true, min: 0 },
    fechaSolicitud: { type: Date, default: Date.now },
    fechaAprobacion: { type: Date, default: null },
    aprobadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    fechaInicio: { type: Date, default: null },
    fechaProximoCobro: { type: Date, default: null },
    fechaCancelacion: { type: Date, default: null },
    motivoCancelacion: { type: String, default: null },
    notaCliente: { type: String, default: null },
    notaAdmin: { type: String, default: null },
    cobrosRealizados: { type: Number, default: 0 },
    historialCobros: [CobroHistorialSchema],
  },
  { timestamps: true }
)

MantenimientoSchema.index({ proyectoId: 1 })
MantenimientoSchema.index({ clienteId: 1 })
MantenimientoSchema.index({ estado: 1, fechaProximoCobro: 1 })

const Mantenimiento: Model<IMantenimiento> =
  mongoose.models.Mantenimiento ??
  mongoose.model<IMantenimiento>('Mantenimiento', MantenimientoSchema)

export default Mantenimiento
