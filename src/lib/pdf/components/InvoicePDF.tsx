import { Document, Page, View, Text } from '@react-pdf/renderer'
import { PDFHeader } from './PDFHeader'
import { PDFFooter } from './PDFFooter'
import { globalStyles, colors } from './PDFStyles'

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
}

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

export function InvoicePDF({ invoice, client }: InvoicePDFProps) {
  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const isPaid = invoice.status === 'pagado'

  const statusStyle =
    invoice.status === 'pagado'
      ? globalStyles.badgePagado
      : invoice.status === 'vencido' || invoice.status === 'rechazado'
      ? globalStyles.badgeVencido
      : globalStyles.badgePendiente

  return (
    <Document>
      <Page size="A4" style={globalStyles.page}>
        {/* Header */}
        <PDFHeader
          title={`FACTURA #${invoice.number}`}
          subtitle={invoice.description}
          date={today}
        />

        {/* Info grid: facturado a + datos de emisión */}
        <View style={[globalStyles.body, { paddingBottom: 0 }]}>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {/* Facturado a */}
            <View style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}>
              <Text style={globalStyles.sectionLabel}>Facturado a</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: colors.black, marginBottom: 4 }}>
                {client.name}
              </Text>
              {client.company && (
                <Text style={{ fontSize: 10, color: colors.gray, marginBottom: 2 }}>{client.company}</Text>
              )}
              <Text style={{ fontSize: 10, color: colors.gray, marginBottom: 2 }}>{client.email}</Text>
              {client.phone && (
                <Text style={{ fontSize: 10, color: colors.gray }}>{client.phone}</Text>
              )}
            </View>

            {/* Datos de emisión */}
            <View style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}>
              <Text style={globalStyles.sectionLabel}>Datos de emisión</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 9, color: colors.gray }}>Fecha de emisión</Text>
                <Text style={{ fontSize: 9, color: colors.black, fontFamily: 'Helvetica-Bold' }}>
                  {fmtDate(invoice.issuedAt)}
                </Text>
              </View>
              {invoice.dueDate && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 9, color: colors.gray }}>Vencimiento</Text>
                  <Text style={{ fontSize: 9, color: colors.black, fontFamily: 'Helvetica-Bold' }}>
                    {fmtDate(invoice.dueDate)}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 9, color: colors.gray }}>Número</Text>
                <Text style={{ fontSize: 9, color: colors.black, fontFamily: 'Helvetica-Bold' }}>
                  {invoice.number}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: colors.gray }}>Estado</Text>
                <Text style={statusStyle}>{statusLabel[invoice.status] ?? invoice.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Detalle de servicios */}
          <Text style={globalStyles.sectionLabel}>Detalle de servicios</Text>
          <View style={{ marginBottom: 20 }}>
            {/* Cabecera tabla */}
            <View style={globalStyles.tableHeader}>
              <Text style={[globalStyles.tableHeaderText, { flex: 4 }]}>Descripción</Text>
              <Text style={[globalStyles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
              <Text style={[globalStyles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Precio unit.</Text>
              <Text style={[globalStyles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Total</Text>
            </View>

            {/* Filas */}
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, i) => (
                <View key={i} style={[globalStyles.tableRow, i % 2 !== 0 ? globalStyles.tableRowAlt : {}]}>
                  <Text style={[globalStyles.tableCell, { flex: 4 }]}>{item.description}</Text>
                  <Text style={[globalStyles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(item.unitPrice)}</Text>
                  <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(item.total)}</Text>
                </View>
              ))
            ) : (
              <View style={globalStyles.tableRow}>
                <Text style={[globalStyles.tableCell, { flex: 4 }]}>{invoice.description}</Text>
                <Text style={[globalStyles.tableCell, { flex: 1, textAlign: 'center' }]}>1</Text>
                <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(invoice.amount)}</Text>
                <Text style={[globalStyles.tableCell, { flex: 2, textAlign: 'right' }]}>{fmt(invoice.amount)}</Text>
              </View>
            )}
          </View>

          {/* Totales */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 }}>
            <View style={{ width: 240 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 9, color: colors.gray }}>Subtotal</Text>
                <Text style={{ fontSize: 9, color: colors.black }}>{fmt(invoice.amount)}</Text>
              </View>
              <View style={{
                backgroundColor: colors.dark,
                padding: 14,
                marginTop: 8,
              }}>
                <Text style={{ color: colors.gray, fontSize: 9, marginBottom: 4, textAlign: 'center' }}>
                  TOTAL A PAGAR
                </Text>
                <Text style={{
                  color: colors.white,
                  fontSize: 22,
                  fontFamily: 'Helvetica-Bold',
                  textAlign: 'center',
                }}>
                  {fmt(invoice.amount)} ARS
                </Text>
              </View>
            </View>
          </View>

          {/* Sello de pago confirmado */}
          {isPaid && (
            <View style={{
              borderWidth: 1,
              borderColor: colors.success,
              backgroundColor: colors.successBg,
              padding: 14,
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.success, marginBottom: 6 }}>
                ✓ PAGO CONFIRMADO
              </Text>
              {invoice.paidAt && (
                <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 2 }}>
                  Fecha de pago: {fmtDate(invoice.paidAt)}
                </Text>
              )}
              {(invoice.paymentMethodNew || invoice.paymentMethod) && (
                <Text style={{ fontSize: 9, color: colors.gray }}>
                  Método: {paymentMethodLabel[invoice.paymentMethodNew ?? invoice.paymentMethod ?? ''] ?? invoice.paymentMethodNew ?? invoice.paymentMethod}
                </Text>
              )}
            </View>
          )}

          {/* Nota al pie */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 14,
          }}>
            <Text style={{ fontSize: 9, color: colors.gray, textAlign: 'center', lineHeight: 1.5 }}>
              Gracias por confiar en VM Studio. Ante cualquier consulta escribinos a vmstudio.online@gmail.com
            </Text>
          </View>
        </View>

        <PDFFooter pageNumber={1} />
      </Page>
    </Document>
  )
}
