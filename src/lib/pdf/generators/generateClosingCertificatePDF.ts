import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import {
  ClosingCertificatePDF,
  type ClosingCertificatePDFProps,
} from '../components/ClosingCertificatePDF'

export async function generateClosingCertificatePDF(
  props: ClosingCertificatePDFProps
): Promise<Buffer> {
  try {
    const element = React.createElement(
      ClosingCertificatePDF,
      props
    ) as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(element)
    return buffer
  } catch (err) {
    console.error('[generateClosingCertificatePDF] Error al generar PDF:', err)
    throw new Error('No se pudo generar el certificado de cierre')
  }
}
