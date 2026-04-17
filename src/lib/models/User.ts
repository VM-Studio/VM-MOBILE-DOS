import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'superadmin' | 'admin' | 'empleado' | 'cliente'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  company?: string
  role: UserRole
  isVerified: boolean
  verificationToken?: string
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  avatar?: string
  phone?: string
  position?: string
  website?: string
  address?: string
  isActive: boolean
  lastLogin?: Date
  signatureData?: string | null
  signatureUpdatedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8 },
    company: { type: String, trim: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'empleado', 'cliente'],
      default: 'cliente',
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    avatar: { type: String },
    phone: { type: String },
    position: { type: String, trim: true },
    website: { type: String, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    signatureData: { type: String, default: null },
    signatureUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Hash password before saving
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })
UserSchema.index({ role: 1, isActive: 1 })

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)

export default User
