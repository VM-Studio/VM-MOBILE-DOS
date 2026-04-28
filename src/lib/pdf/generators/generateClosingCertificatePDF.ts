import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import path from 'path'
import fs from 'fs'
import {
  ClosingCertificatePDF,
  type ClosingCertificatePDFProps,
} from '../components/ClosingCertificatePDF'

export async function generateClosingCertificatePDF(
  props: ClosingCertificatePDFProps
): Promise<Buffer> {
  try {
    // Leer el logo como base64 para embeber en el PDF
    let logoBase64: string | undefined
    try {
      const logoPath = path.join(process.cwd(), 'public', 'log.png')
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
    } catch {
      logoBase64 = undefined
    }

    const element = React.createElement(
      ClosingCertificatePDF,
      { ...props, logoBase64 }
    ) as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(element)
    return buffer
  } catch (err) {
    console.error('[generateClosingCertificatePDF] Error al generar PDF:', err)
    throw new Error('No se pudo generar el certificado de cierre')
  }
}
