import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'

/**
 * GET /api/debug/db
 * Diagnóstico de conexión a MongoDB — SOLO PARA PRODUCCIÓN TEMPORAL.
 * Eliminar este archivo una vez resuelto el problema.
 */
export async function GET() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return NextResponse.json({
      ok: false,
      error: 'MONGODB_URI no está definida en las variables de entorno de Vercel.',
      env: {
        MONGODB_URI: 'NO DEFINIDA',
        NODE_ENV: process.env.NODE_ENV,
      },
    }, { status: 500 })
  }

  // Mostrar la URI parcialmente enmascarada para verificar que sea correcta
  const maskedUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')

  try {
    await dbConnect()
    return NextResponse.json({
      ok: true,
      message: 'Conexión a MongoDB exitosa.',
      uri: maskedUri,
      NODE_ENV: process.env.NODE_ENV,
    })
  } catch (error: unknown) {
    const err = error as Error & { code?: string; name?: string }
    return NextResponse.json({
      ok: false,
      error: err.message ?? 'Error desconocido',
      errorName: err.name ?? 'Unknown',
      errorCode: err.code ?? null,
      uri: maskedUri,
      NODE_ENV: process.env.NODE_ENV,
    }, { status: 500 })
  }
}
