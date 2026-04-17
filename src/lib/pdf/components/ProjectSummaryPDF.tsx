import { Document, Page, View, Text } from '@react-pdf/renderer'
import { PDFHeader } from './PDFHeader'
import { PDFFooter } from './PDFFooter'
import { globalStyles, colors } from './PDFStyles'

export interface ProjectStage {
  name: string
  status: string
  description?: string
  completedAt?: Date
  order: number
}

export interface ProjectFile {
  name: string
  category: string
  uploadedAt: Date
}

export interface ProjectUpdate {
  message: string
  createdAt: Date
}

export interface ProjectSummaryPDFProps {
  project: {
    name: string
    type: string
    status: string
    progress: number
    description?: string
    startDate?: Date
    estimatedEndDate?: Date
    completedAt?: Date
    budget?: number
    previewUrl?: string
    stages: ProjectStage[]
    updates: ProjectUpdate[]
    files: ProjectFile[]
  }
  client: {
    name: string
    company?: string
    email: string
  }
}

const fmtDate = (d?: Date | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmt = (n: number) =>
  '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const typeLabel: Record<string, string> = {
  web: 'Desarrollo Web',
  app: 'Aplicación Móvil',
  landing: 'Landing Page',
  ecommerce: 'E-commerce',
}

const statusLabel: Record<string, string> = {
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  completado: 'Completado',
  pausado: 'Pausado',
}

const stageStatusLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  completado: 'Completado',
  rechazado: 'Rechazado',
}

const stageStatusIcon: Record<string, string> = {
  pendiente: '○',
  en_progreso: '◎',
  en_revision: '◉',
  completado: '●',
  rechazado: '✕',
}

const stageStatusColor: Record<string, string> = {
  pendiente: colors.gray,
  en_progreso: colors.primary,
  en_revision: colors.warning,
  completado: colors.success,
  rechazado: colors.danger,
}

export function ProjectSummaryPDF({ project, client }: ProjectSummaryPDFProps) {
  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const sortedStages = [...project.stages].sort((a, b) => a.order - b.order)
  const recentUpdates = [...project.updates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const progressWidth = Math.max(0, Math.min(100, project.progress))

  return (
    <Document>
      <Page size="A4" style={globalStyles.page}>
        <PDFHeader
          title="RESUMEN DE PROYECTO"
          subtitle={project.name}
          date={today}
        />

        <View style={globalStyles.body}>
          {/* Info del proyecto */}
          <Text style={[globalStyles.sectionLabel, { marginBottom: 8 }]}>Información del proyecto</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {/* Columna izquierda */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              {[
                { label: 'Proyecto', value: project.name },
                { label: 'Tipo', value: typeLabel[project.type] ?? project.type },
                { label: 'Estado', value: statusLabel[project.status] ?? project.status },
                { label: 'Inicio', value: fmtDate(project.startDate) },
                { label: 'Entrega estimada', value: fmtDate(project.estimatedEndDate) },
              ].map((row) => (
                <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, color: colors.gray }}>{row.label}</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.black }}>{row.value}</Text>
                </View>
              ))}
            </View>
            {/* Columna derecha */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              {[
                { label: 'Cliente', value: client.name },
                { label: 'Empresa', value: client.company ?? '—' },
                { label: 'Email', value: client.email },
                { label: 'Presupuesto', value: project.budget ? fmt(project.budget) : '—' },
                { label: 'Completado', value: fmtDate(project.completedAt) },
              ].map((row) => (
                <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, color: colors.gray }}>{row.label}</Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.black }}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Barra de progreso */}
          <Text style={[globalStyles.sectionLabel, { marginBottom: 8 }]}>Progreso general</Text>
          <View style={{ marginBottom: 20 }}>
            <View style={{
              height: 16,
              backgroundColor: colors.lightGray,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 4,
            }}>
              <View style={{
                height: 14,
                width: `${progressWidth}%`,
                backgroundColor: colors.primary,
                margin: 1,
              }} />
            </View>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.primary, textAlign: 'right' }}>
              {progressWidth}% completado
            </Text>
          </View>

          {/* Etapas del proyecto */}
          <Text style={[globalStyles.sectionLabel, { marginBottom: 8 }]}>Etapas del proyecto</Text>
          <View style={{ marginBottom: 20 }}>
            <View style={globalStyles.tableHeader}>
              <Text style={[globalStyles.tableHeaderText, { flex: 3 }]}>Etapa</Text>
              <Text style={[globalStyles.tableHeaderText, { flex: 2, textAlign: 'center' }]}>Estado</Text>
              <Text style={[globalStyles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Completada</Text>
            </View>
            {sortedStages.map((stage, i) => (
              <View key={i} style={[globalStyles.tableRow, i % 2 !== 0 ? globalStyles.tableRowAlt : {}]}>
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 10, color: stageStatusColor[stage.status] ?? colors.gray }}>
                    {stageStatusIcon[stage.status] ?? '○'}
                  </Text>
                  <Text style={[globalStyles.tableCell, { flex: 1 }]}>{stage.name}</Text>
                </View>
                <Text style={{
                  flex: 2,
                  fontSize: 9,
                  textAlign: 'center',
                  color: stageStatusColor[stage.status] ?? colors.gray,
                  fontFamily: 'Helvetica-Bold',
                }}>
                  {stageStatusLabel[stage.status] ?? stage.status}
                </Text>
                <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'right' }]}>
                  {fmtDate(stage.completedAt)}
                </Text>
              </View>
            ))}
          </View>

          {/* Actualizaciones recientes */}
          {recentUpdates.length > 0 && (
            <>
              <Text style={[globalStyles.sectionLabel, { marginBottom: 8 }]}>Actualizaciones recientes</Text>
              <View style={{ marginBottom: 20 }}>
                {recentUpdates.map((u, i) => (
                  <View key={i} style={{
                    flexDirection: 'row',
                    gap: 8,
                    paddingVertical: 6,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 9, color: colors.gray, width: 75, flexShrink: 0 }}>
                      {fmtDate(u.createdAt)}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.black, flex: 1 }}>— {u.message}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Archivos entregados */}
          {project.files.length > 0 && (
            <>
              <Text style={[globalStyles.sectionLabel, { marginBottom: 8 }]}>Archivos entregados</Text>
              <View style={globalStyles.tableHeader}>
                <Text style={[globalStyles.tableHeaderText, { flex: 4 }]}>Archivo</Text>
                <Text style={[globalStyles.tableHeaderText, { flex: 2, textAlign: 'center' }]}>Categoría</Text>
                <Text style={[globalStyles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Fecha</Text>
              </View>
              {project.files.map((f, i) => (
                <View key={i} style={[globalStyles.tableRow, i % 2 !== 0 ? globalStyles.tableRowAlt : {}]}>
                  <Text style={[globalStyles.tableCell, { flex: 4 }]}>{f.name}</Text>
                  <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'center' }]}>{f.category}</Text>
                  <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmtDate(f.uploadedAt)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <PDFFooter pageNumber={1} />
      </Page>
    </Document>
  )
}
