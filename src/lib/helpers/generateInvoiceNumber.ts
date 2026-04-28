import dbConnect from '@/lib/db'
import Invoice from '@/lib/models/Invoice'

const INITIAL_RANGE_MIN = 500
const INITIAL_RANGE_MAX = 999 // inclusive

/**
 * Extrae el valor numérico de un número de factura.
 * Soporta formatos: "637", "F-00637", "F637", "1042", etc.
 */
function parseInvoiceNumber(num: string): number {
  const stripped = num.replace(/\D/g, '')
  return stripped ? parseInt(stripped, 10) : 0
}

/**
 * Devuelve el próximo número de factura disponible.
 *
 * Lógica:
 * - Si no hay facturas previas → elige un número random entre INITIAL_RANGE_MIN e INITIAL_RANGE_MAX
 * - Si ya hay facturas → toma el número más alto usado y suma 1
 *
 * Para crear un par consecutivo (anticipo + saldo final):
 * firstNumber = await generateInvoiceNumber()  → primer número
 * secondNumber = firstNumber + 1               → segundo número (consecutivo)
 */
export async function generateInvoiceNumber(): Promise<number> {
  await dbConnect()

  // Obtener todas las facturas con número numérico válido
  const allInvoices = await Invoice.find({}).select('number').lean()

  const usedNumbers = allInvoices
    .map((inv) => parseInvoiceNumber(inv.number as string))
    .filter((n) => n > 0)

  if (usedNumbers.length === 0) {
    // Primera factura del sistema: número random entre 500 y 999
    const first =
      Math.floor(Math.random() * (INITIAL_RANGE_MAX - INITIAL_RANGE_MIN + 1)) +
      INITIAL_RANGE_MIN
    return first
  }

  // Siguiente número disponible = máximo usado + 1
  // Aseguramos que quede espacio para el bloque completo (count números)
  const maxUsed = Math.max(...usedNumbers)
  return maxUsed + 1
}

/**
 * Formatea un número de factura como string simple (sin prefijo),
 * para mantener la estética de "número impreso".
 * Ej: 637 → "637"
 */
export function formatInvoiceNumber(num: number): string {
  return String(num)
}
