import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IStage {
  _id: Types.ObjectId
  name: string
  order: number
  status: 'pendiente' | 'en_progreso' | 'en_revision' | 'completado' | 'rechazado'
  description?: string
  requiresApproval: boolean
  approvedAt?: Date
  rejectedAt?: Date
  rejectionComment?: string
  completedAt?: Date
}

export interface IFile {
  _id: Types.ObjectId
  name: string
  url: string
  category: 'diseño' | 'credenciales' | 'documentos' | 'links' | 'otros'
  uploadedAt: Date
}

export interface IProjectUpdate {
  message: string
  createdAt: Date
}

export interface IDeployHistoryItem {
  deployedAt: Date
  deployedBy: Types.ObjectId
  message?: string
  previewImageUrl?: string
  stagingUrl?: string
}

export interface IClosingSignature {
  clientSignatureData?: string | null
  adminSignatureData?: string | null
  signedAt?: Date | null
  signedByClient?: Types.ObjectId | null
  signedByAdmin?: Types.ObjectId | null
  adminName?: string | null
  certificateUrl?: string | null
}

export interface IProject extends Document {
  clientId: Types.ObjectId
  name: string
  type: 'web' | 'app' | 'landing' | 'ecommerce'
  status: 'en_progreso' | 'en_revision' | 'completado' | 'pausado'
  progress: number
  description?: string
  previewUrl?: string
  startDate?: Date
  estimatedEndDate?: Date
  completedAt?: Date
  budget?: number | null
  invoiceIds: Types.ObjectId[]
  stages: IStage[]
  files: IFile[]
  updates: IProjectUpdate[]
  assignedTo: Types.ObjectId[]
  stagingUrl?: string
  previewImageUrl?: string
  previewUpdatedAt?: Date
  lastDeployAt?: Date
  lastDeployBy?: Types.ObjectId
  lastDeployMessage?: string
  deployHistory: IDeployHistoryItem[]
  awaitingSignature: boolean
  closingSignature?: IClosingSignature | null
  createdAt: Date
  updatedAt: Date
}

const StageSchema = new Schema<IStage>({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'en_revision', 'completado', 'rechazado'],
    default: 'pendiente',
  },
  description: String,
  requiresApproval: { type: Boolean, default: false },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionComment: String,
  completedAt: Date,
})

const FileSchema = new Schema<IFile>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  category: {
    type: String,
    enum: ['diseño', 'credenciales', 'documentos', 'links', 'otros'],
    default: 'otros',
  },
  uploadedAt: { type: Date, default: Date.now },
})

const ProjectSchema = new Schema<IProject>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['web', 'app', 'landing', 'ecommerce'] },
    status: {
      type: String,
      enum: ['en_progreso', 'en_revision', 'completado', 'pausado'],
      default: 'en_progreso',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    description: String,
    previewUrl: String,
    startDate: Date,
    estimatedEndDate: Date,
    completedAt: Date,
    budget: { type: Number, default: null },
    invoiceIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
      default: [],
    },
    stages: [StageSchema],
    files: [FileSchema],
    updates: [
      {
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    stagingUrl: { type: String, default: null },
    previewImageUrl: { type: String, default: null },
    previewUpdatedAt: { type: Date, default: null },
    lastDeployAt: { type: Date, default: null },
    lastDeployBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lastDeployMessage: { type: String, default: null },
    deployHistory: {
      type: [
        {
          deployedAt: { type: Date, default: Date.now },
          deployedBy: { type: Schema.Types.ObjectId, ref: 'User' },
          message: String,
          previewImageUrl: String,
          stagingUrl: String,
        },
      ],
      default: [],
    },
    awaitingSignature: { type: Boolean, default: false },
    closingSignature: {
      type: {
        clientSignatureData: { type: String, default: null },
        adminSignatureData: { type: String, default: null },
        signedAt: { type: Date, default: null },
        signedByClient: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        signedByAdmin: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        adminName: { type: String, default: null },
        certificateUrl: { type: String, default: null },
      },
      default: null,
    },
  },
  { timestamps: true }
)

ProjectSchema.index({ clientId: 1 })
ProjectSchema.index({ status: 1 })
ProjectSchema.index({ clientId: 1, status: 1 })
ProjectSchema.index({ assignedTo: 1 })
ProjectSchema.index({ createdAt: -1 })
ProjectSchema.index({ estimatedEndDate: 1 })

const Project: Model<IProject> =
  mongoose.models.Project ?? mongoose.model<IProject>('Project', ProjectSchema)

export default Project
