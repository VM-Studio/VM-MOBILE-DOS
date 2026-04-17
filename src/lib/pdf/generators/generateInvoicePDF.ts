import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { InvoicePDF, InvoicePDFProps } from '../components/InvoicePDF'

export async function generateInvoicePDF(props: InvoicePDFProps): Promise<Buffer> {
  try {
    const element = React.createElement(InvoicePDF, props) as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(element)
    return buffer
  } catch (err) {
    console.error('[generateInvoicePDF] Error al generar PDF:', err)
    throw new Error('No se pudo generar el PDF de la factura')
  }
}
