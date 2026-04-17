import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }

if (!global._mongooseCache) {
  global._mongooseCache = cached
}

async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('Por favor definí la variable de entorno MONGODB_URI en .env.local')
  }

  if (cached.conn) {
    // Verify the existing connection is still alive
    if (mongoose.connection.readyState === 1) return cached.conn
    // If not ready, reset and reconnect
    cached.conn = null
    cached.promise = null
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000,
      })
      .catch((err) => {
        // Reset cache on failure so the next request retries the connection
        cached.conn = null
        cached.promise = null
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
