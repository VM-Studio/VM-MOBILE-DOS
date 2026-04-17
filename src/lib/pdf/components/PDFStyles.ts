import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  primary: '#2563EB',
  dark: '#0F172A',
  black: '#0A0A0A',
  gray: '#6B7280',
  lightGray: '#F5F5F7',
  border: '#E5E7EB',
  white: '#FFFFFF',
  success: '#22C55E',
  successBg: '#DCFCE7',
  warning: '#F59E0B',
  warningBg: '#FEF9C3',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
}

export const globalStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingBottom: 60,
  },
  // Header
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
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  headerSubtitle: {
    color: colors.gray,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  // Body
  body: {
    padding: 30,
  },
  sectionLabel: {
    color: colors.gray,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
  },
  // Tablas
  tableHeader: {
    backgroundColor: colors.dark,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    color: colors.black,
    fontSize: 9,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  footerText: {
    color: colors.gray,
    fontSize: 8,
  },
  // Badges de estado
  badgePagado: {
    backgroundColor: '#DCFCE7',
    color: colors.success,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  badgePendiente: {
    backgroundColor: '#FEF9C3',
    color: colors.warning,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  badgeVencido: {
    backgroundColor: '#FEE2E2',
    color: colors.danger,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
})
