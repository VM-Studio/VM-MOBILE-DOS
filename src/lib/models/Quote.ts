import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuote extends Document {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  service: 'web' | 'app' | 'google_ads' | 'meta_ads' | 'combo' | 'otro';
  businessType?: string;
  budget?: string;
  message?: string;
  status: 'nueva' | 'contactado' | 'propuesta_enviada' | 'ganada' | 'perdida';
  assignedTo?: Types.ObjectId;
  notes?: string;
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: Types.ObjectId;
  }[];
  convertedToProject?: Types.ObjectId;
  wantsWhatsapp?: boolean;

  // ─── FASE 8: Cotizador inteligente ───────────────────
  presupuestoNumber?: string;
  userId?: Types.ObjectId;
  pdfUrl?: string | null;
  pdfGeneradoAt?: Date | null;

  formData?: {
    servicios?: string[];
    webTipo?: string;
    webPaginas?: string;
    webContacto?: string[];
    webExtras?: string[];
    appTipo?: string;
    appRubro?: string;
    appExtras?: string[];
    etapaNegocio?: string;
    tieneWeb?: boolean;
    urlWebActual?: string;
    cuandoEmpezar?: string;
    comoNosConocio?: string;
    nombre?: string;
    empresa?: string;
    email?: string;
    whatsapp?: string;
    preferenciaContacto?: string;
  };

  presupuestoCalculado?: {
    items?: { descripcion: string; precio: number }[];
    subtotal?: number;
    descuento?: number;
    total?: number;
    tiempoEstimado?: { dias: number; label: string };
  };

  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String },
    phone: { type: String },
    service: {
      type: String,
      enum: ['web', 'app', 'otro'],
      required: true,
    },
    businessType: { type: String },
    budget: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ['nueva', 'contactado', 'propuesta_enviada', 'ganada', 'perdida'],
      default: 'nueva',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    convertedToProject: { type: Schema.Types.ObjectId, ref: 'Project' },
    wantsWhatsapp: { type: Boolean, default: false },

    // ─── FASE 8 ────────────────────────────────────────
    presupuestoNumber: { type: String, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    pdfUrl: { type: String, default: null },
    pdfGeneradoAt: { type: Date, default: null },

    formData: {
      servicios: [String],
      webTipo: String,
      webPaginas: String,
      webContacto: [String],
      webExtras: [String],
      appTipo: String,
      appRubro: String,
      appExtras: [String],
      etapaNegocio: String,
      tieneWeb: Boolean,
      urlWebActual: String,
      cuandoEmpezar: String,
      comoNosConocio: String,
      nombre: String,
      empresa: String,
      email: String,
      whatsapp: String,
      preferenciaContacto: String,
    },

    presupuestoCalculado: {
      items: [{ descripcion: String, precio: Number }],
      subtotal: Number,
      descuento: Number,
      total: Number,
      tiempoEstimado: { dias: Number, label: String },
    },
  },
  { timestamps: true }
);

QuoteSchema.index({ status: 1 })
QuoteSchema.index({ email: 1 })
QuoteSchema.index({ userId: 1 })
QuoteSchema.index({ createdAt: -1 })
QuoteSchema.index({ presupuestoNumber: 1 }, { unique: true, sparse: true })

export default mongoose.models.Quote ||
  mongoose.model<IQuote>('Quote', QuoteSchema);
