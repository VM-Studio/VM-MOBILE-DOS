import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface ITicketMessage {
  senderId: Types.ObjectId
  senderRole: string
  content: string
  fileUrl?: string
  createdAt: Date
}

export interface ITicket extends Document {
  clientId: Types.ObjectId
  ticketNumber: string
  title: string
  category: 'bug' | 'consulta' | 'cambio' | 'urgente'
  priority: 'alta' | 'media' | 'baja'
  status: 'abierto' | 'en_proceso' | 'resuelto'
  messages: ITicketMessage[]
  rating?: number
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TicketSchema = new Schema<ITicket>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketNumber: { type: String, unique: true },
    title: { type: String, required: true },
    category: { type: String, enum: ['bug', 'consulta', 'cambio', 'urgente'], required: true },
    priority: { type: String, enum: ['alta', 'media', 'baja'], default: 'media' },
    status: {
      type: String,
      enum: ['abierto', 'en_proceso', 'resuelto'],
      default: 'abierto',
    },
    messages: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        senderRole: String,
        content: String,
        fileUrl: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rating: { type: Number, min: 1, max: 5 },
    resolvedAt: Date,
  },
  { timestamps: true }
)

// Auto-generate ticketNumber before saving
TicketSchema.pre('save', async function (this: ITicket) {
  if (!this.ticketNumber) {
    const count = await mongoose.models.Ticket.countDocuments()
    this.ticketNumber = `TK-${String(count + 1).padStart(4, '0')}`
  }
})

TicketSchema.index({ clientId: 1 })
TicketSchema.index({ status: 1 })
TicketSchema.index({ priority: 1 })
TicketSchema.index({ clientId: 1, status: 1 })
TicketSchema.index({ status: 1, priority: 1 })
TicketSchema.index({ createdAt: -1 })

const Ticket: Model<ITicket> =
  mongoose.models.Ticket ?? mongoose.model<ITicket>('Ticket', TicketSchema)

export default Ticket
