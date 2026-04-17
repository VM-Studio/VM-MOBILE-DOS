import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import PresupuestoPDF, { type PresupuestoPDFProps } from '../components/PresupuestoPDF'

export async function generatePresupuestoPDF(
  props: PresupuestoPDFProps
): Promise<Buffer> {
  const element = React.createElement(
    PresupuestoPDF,
    props
  ) as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
