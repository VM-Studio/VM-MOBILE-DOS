import { View, Text } from '@react-pdf/renderer'
import { globalStyles, colors } from './PDFStyles'

interface PDFHeaderProps {
  title: string
  subtitle: string
  date: string
}

export function PDFHeader({ title, subtitle, date }: PDFHeaderProps) {
  return (
    <View style={globalStyles.header}>
      {/* Logo VM Studio */}
      <View>
        <Text style={globalStyles.logoText}>
          VM <Text style={globalStyles.logoAccent}>Studio</Text>
        </Text>
        <Text style={{ color: colors.gray, fontSize: 9, marginTop: 3 }}>vmstudioweb.online</Text>
      </View>

      {/* Título del documento */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={globalStyles.headerTitle}>{title}</Text>
        <Text style={globalStyles.headerSubtitle}>{subtitle}</Text>
        <Text style={{ color: colors.gray, fontSize: 9, marginTop: 4 }}>
          Generado: {date}
        </Text>
      </View>
    </View>
  )
}
