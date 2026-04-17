import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { ProjectSummaryPDF, ProjectSummaryPDFProps } from '../components/ProjectSummaryPDF'

export async function generateProjectSummaryPDF(props: ProjectSummaryPDFProps): Promise<Buffer> {
  try {
    const element = React.createElement(ProjectSummaryPDF, props) as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(element)
    return buffer
  } catch (err) {
    console.error('[generateProjectSummaryPDF] Error al generar PDF:', err)
    throw new Error('No se pudo generar el PDF del resumen de proyecto')
  }
}
