import React from 'react'
import { Document, Page, View, Text, Image as PDFImage, StyleSheet } from '@react-pdf/renderer'
import { colors } from './PDFStyles'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingBottom: 60,
  },
  header: {
    backgroundColor: colors.dark,
    padding: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    color: colors.white,
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  logoAccent: {
    color: colors.primary,
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    letterSpacing: 2,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
  },
  body: {
    padding: 40,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 20,
  },
  label: {
    fontSize: 8,
    color: colors.gray,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    color: colors.dark,
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  legalText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.7,
    marginBottom: 8,
  },
  signaturesRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 10,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.gray,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  signatureImage: {
    height: 60,
    objectFit: 'contain',
    marginBottom: 6,
  },
  signatureName: {
    fontSize: 9,
    color: colors.dark,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    backgroundColor: colors.dark,
    padding: 16,
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
}

export function ClosingCertificatePDF({
  project,
  client,
  clientSignatureData,
  adminSignatureData,
  adminName,
  signedAt,
}: ClosingCertificatePDFProps) {
  const dateStr = signedAt.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>
              VM <Text style={styles.logoAccent}>Studio</Text>
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 9, marginTop: 3 }}>
              vmstudioweb.online
            </Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>CERTIFICADO DE CIERRE</Text>
            <Text style={styles.headerSub}>Documento de conformidad — {dateStr}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Datos del proyecto y cliente */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Proyecto</Text>
              <Text style={styles.value}>{project.name}</Text>
              {project.type && (
                <Text style={{ fontSize: 9, color: colors.gray, marginTop: 2 }}>
                  {project.type}
                </Text>
              )}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{client.name}</Text>
              {client.company && (
                <Text style={{ fontSize: 9, color: colors.gray, marginTop: 2 }}>
                  {client.company}
                </Text>
              )}
              <Text style={{ fontSize: 9, color: colors.gray, marginTop: 1 }}>
                {client.email}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Fecha de firma</Text>
              <Text style={styles.value}>{dateStr}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Texto legal */}
          <Text style={[styles.label, { marginBottom: 10 }]}>DECLARACIÓN DE CONFORMIDAD</Text>
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
              {/* PDFImage de @react-pdf/renderer — no requiere alt */}
              <PDFImage src={clientSignatureData} style={styles.signatureImage} />              <Text style={styles.signatureName}>{client.name}</Text>
              {client.company && (
                <Text style={{ fontSize: 8, color: colors.gray, marginTop: 2 }}>
                  {client.company}
                </Text>
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
              <Text style={{ fontSize: 8, color: colors.gray, marginTop: 2 }}>
                VM Studio
              </Text>
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
