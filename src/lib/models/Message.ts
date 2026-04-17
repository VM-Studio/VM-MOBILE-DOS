import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IMessage extends Document {
  roomId: string
  projectId?: Types.ObjectId
  senderId: Types.ObjectId
  senderRole: 'admin' | 'cliente' | 'empleado'
  content?: string
  fileUrl?: string
  fileName?: string
  readBy: Types.ObjectId[]
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    roomId: { type: String, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['admin', 'cliente', 'empleado'], required: true },
    content: String,
    fileUrl: String,
    fileName: String,
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

MessageSchema.index({ roomId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1 })
MessageSchema.index({ createdAt: -1 })

const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>('Message', MessageSchema)

export default Message
