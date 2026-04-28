import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IInvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface IInvoice extends Document {
  clientId: Types.ObjectId
  projectId?: Types.ObjectId | null
  number: string
  description: string
  items: IInvoiceItem[]
  amount: number
  status: 'pendiente' | 'verificando' | 'pagado' | 'vencido' | 'rechazado'
  issuedAt: Date
  dueDate?: Date
  paidAt?: Date
  // Tipo de factura y cuotas
  invoiceType: 'anticipo' | 'saldo_final' | 'manual'
  installment?: number | null
  totalInstallments?: number | null
  paymentEnabled: boolean
  enabledAt?: Date | null
  // Campos heredados (compatibilidad)
  paymentMethod?: string
  paymentId?: string
  // Método de pago nuevo
  paymentMethodNew?: 'mercadopago' | 'transferencia' | null
  // Datos de Mercado Pago
  mpPreferenceId?: string | null
  mpPaymentId?: string | null
  mpStatus?: string | null
  mpStatusDetail?: string | null
  // Datos de transferencia
  transferComprobante?: string | null
  transferComprobanteNombre?: string | null
  transferEnviadoAt?: Date | null
  transferConfirmadoAt?: Date | null
  transferRechazadoAt?: Date | null
  transferMotivoRechazo?: string | null
  // Admin que procesó
  processedBy?: Types.ObjectId | null
  processedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    number: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
      },
    ],
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pendiente', 'verificando', 'pagado', 'vencido', 'rechazado'],
      default: 'pendiente',
    },
    issuedAt: { type: Date, default: Date.now },
    dueDate: Date,
    paidAt: Date,
    // Tipo de factura y cuotas
    invoiceType: {
      type: String,
      enum: ['anticipo', 'saldo_final', 'manual'],
      default: 'manual',
    },
    installment: { type: Number, default: null },
    totalInstallments: { type: Number, default: null },
    paymentEnabled: { type: Boolean, default: true },
    enabledAt: { type: Date, default: null },
    // Campos heredados (compatibilidad)
    paymentMethod: String,
    paymentId: String,
    // Método de pago nuevo
    paymentMethodNew: { type: String, enum: ['mercadopago', 'transferencia', null], default: null },
    // Datos de Mercado Pago
    mpPreferenceId: { type: String, default: null },
    mpPaymentId: { type: String, default: null },
    mpStatus: { type: String, default: null },
    mpStatusDetail: { type: String, default: null },
    // Datos de transferencia
    transferComprobante: { type: String, default: null },
    transferComprobanteNombre: { type: String, default: null },
    transferEnviadoAt: { type: Date, default: null },
    transferConfirmadoAt: { type: Date, default: null },
    transferRechazadoAt: { type: Date, default: null },
    transferMotivoRechazo: { type: String, default: null },
    // Admin que procesó el pago
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

InvoiceSchema.index({ clientId: 1 })
InvoiceSchema.index({ status: 1 })
InvoiceSchema.index({ clientId: 1, status: 1 })
InvoiceSchema.index({ dueDate: 1 })
InvoiceSchema.index({ createdAt: -1 })
// Speeds up the auto-enable check on GET /api/invoices
InvoiceSchema.index({ clientId: 1, paymentEnabled: 1, enabledAt: 1 })

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>('Invoice', InvoiceSchema)

export default Invoice
