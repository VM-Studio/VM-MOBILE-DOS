import React from 'react'
import { Document, Page, View, Text, Image as PDFImage, StyleSheet } from '@react-pdf/renderer'
import { colors } from './PDFStyles'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingBottom: 60,
  },
  // ── HEADER ──────────────────────────────────────────────
  header: {
    backgroundColor: colors.dark,
    paddingVertical: 28,
    paddingHorizontal: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 34,
    objectFit: 'contain',
  },
  logoFallback: {
    color: colors.white,
    fontSize: 20,
    fontFamily: 'Helvetica-BoldOblique',
  },
  logoFallbackAccent: {
    color: colors.primary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDocLabel: {
    color: '#94A3B8',
    fontSize: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Helvetica-Oblique',
  },
  headerDocTitle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Helvetica-BoldOblique',
    letterSpacing: 1,
  },
  headerDocSub: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 5,
    fontFamily: 'Helvetica-Oblique',
  },
  // ── ACCENT BAR ──────────────────────────────────────────
  accentBar: {
    height: 3,
    backgroundColor: colors.primary,
  },
  // ── BODY ────────────────────────────────────────────────
  body: {
    paddingHorizontal: 36,
    paddingTop: 32,
  },
  // ── DATA ROW ────────────────────────────────────────────
  dataRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  dataCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  dataLabel: {
    fontSize: 7,
    color: colors.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
    fontFamily: 'Helvetica-Oblique',
  },
  dataValue: {
    fontSize: 12,
    color: colors.dark,
    fontFamily: 'Helvetica-BoldOblique',
    marginBottom: 2,
  },
  dataSub: {
    fontSize: 9,
    color: colors.gray,
    fontFamily: 'Helvetica-Oblique',
    marginTop: 1,
  },
  // ── DIVIDER ─────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 20,
  },
  // ── LEGAL ───────────────────────────────────────────────
  legalSectionLabel: {
    fontSize: 7,
    color: colors.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: 'Helvetica-Oblique',
  },
  legalText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.8,
    marginBottom: 8,
    fontFamily: 'Helvetica-Oblique',
  },
  // ── FIRMAS ──────────────────────────────────────────────
  signaturesRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 8,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: 12,
  },
  signatureLabel: {
    fontSize: 7,
    color: colors.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Helvetica-Oblique',
  },
  signatureImage: {
    height: 60,
    objectFit: 'contain',
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 10,
    color: colors.dark,
    fontFamily: 'Helvetica-BoldOblique',
  },
  signatureSub: {
    fontSize: 8,
    color: colors.gray,
    fontFamily: 'Helvetica-Oblique',
    marginTop: 2,
  },
  // ── FOOTER ──────────────────────────────────────────────
  footer: {
    backgroundColor: colors.dark,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 8,
    letterSpacing: 1,
    fontFamily: 'Helvetica-Oblique',
  },
})

export interface ClosingCertificatePDFProps {
  project: {
    _id: string
    name: string
    type?: string
  }
  client: {
    name: string
    email: string
    company?: string
  }
  clientSignatureData: string
  adminSignatureData?: string | null
  adminName: string
  signedAt: Date
  logoBase64?: string
}

export function ClosingCertificatePDF({
  project,
  client,
  clientSignatureData,
  adminSignatureData,
  adminName,
  signedAt,
  logoBase64,
}: ClosingCertificatePDFProps) {
  const dateStr = signedAt.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            {logoBase64 ? (
              <PDFImage src={logoBase64} style={styles.logo} />
            ) : (
              <Text style={styles.logoFallback}>
                VM <Text style={styles.logoFallbackAccent}>Studio</Text>
              </Text>
            )}
            <Text style={{ color: '#94A3B8', fontSize: 8, marginTop: 5, fontFamily: 'Helvetica-Oblique' }}>
              vmstudioweb.online
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDocLabel}>Documento oficial</Text>
            <Text style={styles.headerDocTitle}>Certificado de Cierre</Text>
            <Text style={styles.headerDocSub}>Declaración de conformidad — {dateStr}</Text>
          </View>
        </View>

        {/* Barra de acento azul */}
        <View style={styles.accentBar} />

        {/* ── BODY ── */}
        <View style={styles.body}>

          {/* Datos del proyecto, cliente y fecha */}
          <View style={styles.dataRow}>
            <View style={styles.dataCol}>
              <Text style={styles.dataLabel}>Proyecto</Text>
              <Text style={styles.dataValue}>{project.name}</Text>
              {project.type && <Text style={styles.dataSub}>{project.type}</Text>}
            </View>
            <View style={styles.dataCol}>
              <Text style={styles.dataLabel}>Cliente</Text>
              <Text style={styles.dataValue}>{client.name}</Text>
              {client.company && <Text style={styles.dataSub}>{client.company}</Text>}
              <Text style={styles.dataSub}>{client.email}</Text>
            </View>
            <View style={styles.dataCol}>
              <Text style={styles.dataLabel}>Fecha de firma</Text>
              <Text style={styles.dataValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Texto legal */}
          <Text style={styles.legalSectionLabel}>Declaración de conformidad</Text>
          <Text style={styles.legalText}>
            Por medio de la presente firma, el cliente declara haber recibido conforme el
            proyecto detallado en este documento, habiendo abonado la totalidad del presupuesto
            acordado entre las partes.
          </Text>
          <Text style={styles.legalText}>
            VM Studio declara haber cumplido con todas las etapas pactadas según el alcance del
            proyecto aprobado, entregando los materiales y accesos acordados en los plazos y
            condiciones establecidos.
          </Text>
          <Text style={styles.legalText}>
            Ambas partes dan por concluida la relación contractual vinculada a este proyecto,
            dejando constancia de la plena conformidad con el trabajo realizado.
          </Text>

          <View style={styles.divider} />

          {/* Firmas */}
          <View style={styles.signaturesRow}>
            {/* Firma del cliente */}
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Firma del cliente</Text>
              <PDFImage src={clientSignatureData} style={styles.signatureImage} />
              <Text style={styles.signatureName}>{client.name}</Text>
              {client.company && (
                <Text style={styles.signatureSub}>{client.company}</Text>
              )}
            </View>

            {/* Firma de VM Studio */}
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>VM Studio</Text>
              {adminSignatureData ? (
                <PDFImage src={adminSignatureData} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 60 }} />
              )}
              <Text style={styles.signatureName}>{adminName}</Text>
              <Text style={styles.signatureSub}>VM Studio</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            app.vmstudioweb.online — Documento generado digitalmente
          </Text>
        </View>
      </Page>
    </Document>
  )
}

