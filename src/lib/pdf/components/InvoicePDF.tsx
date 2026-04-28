import { Document, Page, View, Text, Image as PDFImage, StyleSheet } from '@react-pdf/renderer'
import { PDFFooter } from './PDFFooter'
import { colors } from './PDFStyles'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface InvoicePDFProps {
  invoice: {
    number: string
    description: string
    items: InvoiceItem[]
    amount: number
    status: string
    issuedAt: Date
    dueDate?: Date
    paidAt?: Date
    paymentMethod?: string
    paymentMethodNew?: string | null
  }
  client: {
    name: string
    email: string
    company?: string
    phone?: string
  }
  logoBase64?: string
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    fontStyle: 'italic',
  },
  logoFallbackAccent: {
    color: colors.primary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDocLabel: {
    color: colors.gray,
    fontSize: 8,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerDocNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Helvetica-BoldOblique',
    letterSpacing: 1,
  },
  headerDate: {
    color: colors.gray,
    fontSize: 8,
    marginTop: 5,
    fontFamily: 'Helvetica-Oblique',
  },
  // ── THIN ACCENT BAR ─────────────────────────────────────
  accentBar: {
    height: 3,
    backgroundColor: colors.primary,
  },
  // ── BODY ────────────────────────────────────────────────
  body: {
    paddingHorizontal: 36,
    paddingTop: 28,
  },
  // ── INFO GRID ───────────────────────────────────────────
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  infoBoxLabel: {
    color: colors.gray,
    fontSize: 7,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Helvetica-Oblique',
  },
  infoClientName: {
    color: colors.black,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  infoLine: {
    color: colors.gray,
    fontSize: 9,
    marginBottom: 2,
    fontFamily: 'Helvetica-Oblique',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoRowLabel: {
    color: colors.gray,
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
  },
  infoRowValue: {
    color: colors.black,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  // ── SECTION LABEL ───────────────────────────────────────
  sectionLabel: {
    color: colors.gray,
    fontSize: 7,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'Helvetica-Oblique',
  },
  // ── TABLE ───────────────────────────────────────────────
  tableWrapper: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    backgroundColor: colors.dark,
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-BoldOblique',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    color: colors.black,
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
  },
  // ── TOTALES ─────────────────────────────────────────────
  totalesWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  totalesBox: {
    width: 250,
  },
  totalesSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  totalesSubLabel: {
    color: colors.gray,
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
  },
  totalesSubValue: {
    color: colors.black,
    fontSize: 9,
  },
  totalesFinal: {
    backgroundColor: colors.dark,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  totalesFinalLabel: {
    color: colors.gray,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
    fontFamily: 'Helvetica-Oblique',
  },
  totalesFinalAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Helvetica-BoldOblique',
  },
  // ── PAGO CONFIRMADO ─────────────────────────────────────
  paidBanner: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: '#DCFCE7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  paidTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-BoldOblique',
    color: colors.success,
    marginBottom: 5,
  },
  paidLine: {
    fontSize: 9,
    color: colors.gray,
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 2,
  },
  // ── STATUS BADGES ────────────────────────────────────────
  badgePagado: {
    fontSize: 8,
    color: colors.success,
    fontFamily: 'Helvetica-Bold',
  },
  badgePendiente: {
    fontSize: 8,
    color: colors.warning,
    fontFamily: 'Helvetica-Bold',
  },
  badgeVencido: {
    fontSize: 8,
    color: colors.danger,
    fontFamily: 'Helvetica-Bold',
  },
  // ── FOOTER NOTE ─────────────────────────────────────────
  footerNote: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 4,
  },
  footerNoteText: {
    fontSize: 9,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.6,
  },
})

const fmt = (n: number) =>
  '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const fmtDate = (d?: Date | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel: Record<string, string> = {
  pagado: 'PAGADO',
  pendiente: 'PENDIENTE',
  vencido: 'VENCIDO',
  verificando: 'EN VERIFICACIÓN',
  rechazado: 'RECHAZADO',
}

const paymentMethodLabel: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  transferencia: 'Transferencia bancaria',
}

export function InvoicePDF({ invoice, client, logoBase64 }: InvoicePDFProps) {
  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const isPaid = invoice.status === 'pagado'

  const statusStyle =
    invoice.status === 'pagado'
      ? styles.badgePagado
      : invoice.status === 'vencido' || invoice.status === 'rechazado'
      ? styles.badgeVencido
      : styles.badgePendiente

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
            <Text style={{ color: colors.gray, fontSize: 8, marginTop: 5, fontFamily: 'Helvetica-Oblique' }}>
              vmstudioweb.online
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.headerDocLabel}>Comprobante de pago</Text>
            <Text style={styles.headerDocNumber}>Factura #{invoice.number}</Text>
            <Text style={styles.headerDate}>Generado: {today}</Text>
          </View>
        </View>

        {/* Barra de acento azul */}
        <View style={styles.accentBar} />

        {/* ── BODY ── */}
        <View style={styles.body}>

          {/* Info grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Facturado a</Text>
              <Text style={styles.infoClientName}>{client.name}</Text>
              {client.company && <Text style={styles.infoLine}>{client.company}</Text>}
              <Text style={styles.infoLine}>{client.email}</Text>
              {client.phone && <Text style={styles.infoLine}>{client.phone}</Text>}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Datos de emisión</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoRowLabel}>Fecha de emisión</Text>
                <Text style={styles.infoRowValue}>{fmtDate(invoice.issuedAt)}</Text>
              </View>
              {invoice.dueDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>Vencimiento</Text>
                  <Text style={styles.infoRowValue}>{fmtDate(invoice.dueDate)}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoRowLabel}>N° de factura</Text>
                <Text style={styles.infoRowValue}>{invoice.number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoRowLabel}>Estado</Text>
                <Text style={statusStyle}>{statusLabel[invoice.status] ?? invoice.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Detalle de servicios */}
          <Text style={styles.sectionLabel}>Detalle de servicios</Text>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Descripción</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Precio unit.</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Total</Text>
            </View>

            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, i) => (
                <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 4 }]}>{item.description}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(item.unitPrice)}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(item.total)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{invoice.description}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>1</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(invoice.amount)}</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(invoice.amount)}</Text>
              </View>
            )}
          </View>

          {/* Totales */}
          <View style={styles.totalesWrapper}>
            <View style={styles.totalesBox}>
              <View style={styles.totalesSubRow}>
                <Text style={styles.totalesSubLabel}>Subtotal</Text>
                <Text style={styles.totalesSubValue}>{fmt(invoice.amount)}</Text>
              </View>
              <View style={styles.totalesFinal}>
                <Text style={styles.totalesFinalLabel}>Total a pagar</Text>
                <Text style={styles.totalesFinalAmount}>{fmt(invoice.amount)} ARS</Text>
              </View>
            </View>
          </View>

          {/* Sello de pago confirmado */}
          {isPaid && (
            <View style={styles.paidBanner}>
              <Text style={styles.paidTitle}>✓  Pago confirmado</Text>
              {invoice.paidAt && (
                <Text style={styles.paidLine}>Fecha de pago: {fmtDate(invoice.paidAt)}</Text>
              )}
              {(invoice.paymentMethodNew || invoice.paymentMethod) && (
                <Text style={styles.paidLine}>
                  Método:{' '}
                  {paymentMethodLabel[invoice.paymentMethodNew ?? invoice.paymentMethod ?? ''] ??
                    invoice.paymentMethodNew ?? invoice.paymentMethod}
                </Text>
              )}
            </View>
          )}

          {/* Nota al pie */}
          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Gracias por confiar en VM Studio.{'\n'}
              Ante cualquier consulta escribinos a vmstudio.online@gmail.com
            </Text>
          </View>
        </View>

        <PDFFooter pageNumber={1} />
      </Page>
    </Document>
  )
}

