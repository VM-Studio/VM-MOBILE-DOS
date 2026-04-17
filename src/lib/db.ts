import mongoose from 'mongoose'

// ─── tipos del cache global ───────────────────────────────────────────────────
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

// ─── inicializar cache ────────────────────────────────────────────────────────
if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null }
}

const cached = global._mongooseCache

// ─── dbConnect ────────────────────────────────────────────────────────────────
async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error(
      '[DB] MONGODB_URI no está definida. Configurala en Vercel → Settings → Environment Variables.'
    )
  }

  // Reutilizar conexión existente si está activa (readyState 1 = connected)
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // Si la conexión está en estado roto, resetear para reconectar limpio
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null
    cached.promise = null
  }

  // Crear una nueva promesa de conexión si no hay una en curso
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      // NO usar bufferCommands:false — deja que mongoose bufferee mientras conecta
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
    }

    console.log('[DB] Iniciando conexión a MongoDB...')

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('[DB] Conexión exitosa a MongoDB.')
      return m
    }).catch((err) => {
      console.error('[DB] Error al conectar a MongoDB:', err.message)
      // Resetear para que el próximo request intente reconectar
      cached.conn = null
      cached.promise = null
      throw err
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
