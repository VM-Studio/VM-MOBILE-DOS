import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { StyleSheet } from '@react-pdf/renderer'
import { colors } from './PDFStyles'
import { PDFHeader } from './PDFHeader'
import { PDFFooter } from './PDFFooter'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingBottom: 60,
  },
  body: {
    padding: '20 30',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    color: colors.gray,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1 solid ${colors.border}`,
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  infoBox: {
    flex: 1,
    backgroundColor: colors.lightGray,
    padding: 12,
  },
  infoLabel: {
    fontSize: 7,
    color: colors.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 10,
    color: colors.dark,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 1,
  },
  // Service list
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFF',
    borderLeft: `2 solid ${colors.primary}`,
  },
  serviceCheck: {
    fontSize: 9,
    color: colors.primary,
    fontFamily: 'Helvetica-Bold',
    marginRight: 8,
    marginTop: 1,
  },
  serviceText: {
    fontSize: 10,
    color: colors.dark,
  },
  // Total block
  totalBlock: {
    backgroundColor: colors.dark,
    padding: '20 30',
    marginBottom: 18,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 8,
    color: colors.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: 4,
  },
  totalNote: {
    fontSize: 8,
    color: colors.gray,
  },
  // Ads block
  adsBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    marginBottom: 18,
    borderLeft: `3 solid ${colors.primary}`,
  },
  adsTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  adsText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  adsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  adsRowLabel: {
    fontSize: 9,
    color: colors.dark,
  },
  adsRowValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  adsDisclaimer: {
    fontSize: 8,
    color: colors.gray,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 1.4,
  },
  // Time block
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 18,
    gap: 10,
  },
  timeIcon: {
    fontSize: 16,
  },
  timeLabel: {
    fontSize: 8,
    color: colors.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  timeSub: {
    fontSize: 8,
    color: colors.gray,
    marginTop: 2,
  },
  // Important note
  importantBox: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 18,
  },
  importantText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
  },
  // Next steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  stepNum: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    opacity: 0.3,
    width: 24,
  },
  stepText: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
    paddingTop: 3,
  },
  // Footer link
  footerLink: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerLinkText: {
    fontSize: 9,
    color: colors.primary,
  },
})

export interface PresupuestoPDFProps {
  presupuestoNumber: string
  fecha: Date
  validoHasta: Date
  cliente: {
    nombre: string
    empresa?: string
    email: string
    whatsapp: string
  }
  servicios: string[]
  total: number
  tiempoEstimado: { label: string }
}

export default function PresupuestoPDF({
  presupuestoNumber,
  fecha,
  validoHasta,
  cliente,
  servicios,
  total,
  tiempoEstimado,
}: PresupuestoPDFProps) {
  const fmt = (n: number) =>
    `$${n.toLocaleString('es-AR')} ARS`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader title="PRESUPUESTO ESTIMADO" subtitle={presupuestoNumber} date={fecha.toLocaleDateString('es-AR')} />

        <View style={styles.body}>
          {/* Info grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Presupuesto para</Text>
              <Text style={styles.infoValue}>{cliente.nombre}</Text>
              {cliente.empresa ? (
                <Text style={styles.infoSub}>{cliente.empresa}</Text>
              ) : null}
              <Text style={styles.infoSub}>{cliente.email}</Text>
              <Text style={styles.infoSub}>{cliente.whatsapp}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Datos del presupuesto</Text>
              <Text style={styles.infoSub}>Número: {presupuestoNumber}</Text>
              <Text style={styles.infoSub}>
                Fecha: {fecha.toLocaleDateString('es-AR')}
              </Text>
              <Text style={styles.infoSub}>
                Válido hasta: {validoHasta.toLocaleDateString('es-AR')}
              </Text>
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios incluidos</Text>
            {servicios.map((s, i) => (
              <View key={i} style={styles.serviceItem}>
                <Text style={styles.serviceCheck}>✓</Text>
                <Text style={styles.serviceText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Total block */}
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Inversión estimada</Text>
            <Text style={styles.totalAmount}>DESDE {fmt(total)}</Text>
            <Text style={styles.totalNote}>
              Precio estimado — sujeto a revisión en detalle
            </Text>
          </View>

          {/* Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiempo estimado de desarrollo</Text>
            <View style={styles.timeBlock}>
              <View>
                <Text style={styles.timeLabel}>Plazo estimado</Text>
                <Text style={styles.timeValue}>{tiempoEstimado.label}</Text>
                <Text style={styles.timeSub}>
                  Contando desde la aprobación del proyecto
                </Text>
              </View>
            </View>
          </View>

          {/* Important */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Importante</Text>
            <View style={styles.importantBox}>
              <Text style={styles.importantText}>
                Este presupuesto es una estimación basada en los requerimientos
                indicados. El equipo de VM Studio se pondrá en contacto en menos
                de 24 horas para analizar tu proyecto en detalle y definir el
                precio final. Los precios pueden variar según la complejidad real
                del proyecto.
              </Text>
            </View>
          </View>

          {/* Next steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos pasos</Text>
            {[
              'Nuestro equipo te contactará en menos de 24hs',
              'Llamada de 30 minutos para analizar tu proyecto',
              'Propuesta personalizada y definitiva',
              '¡Empezamos a trabajar!',
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Link */}
          <View style={styles.footerLink}>
            <Text style={styles.footerLinkText}>
              Podés ver ejemplos de nuestro trabajo en: vmstudioweb.online
            </Text>
          </View>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  )
}
