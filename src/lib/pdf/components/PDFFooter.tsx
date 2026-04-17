import { View, Text } from '@react-pdf/renderer'
import { globalStyles } from './PDFStyles'

interface PDFFooterProps {
  pageNumber?: number
}

export function PDFFooter({ pageNumber = 1 }: PDFFooterProps) {
  return (
    <View style={globalStyles.footer} fixed>
      <Text style={globalStyles.footerText}>
        vmstudioweb.online  |  vmstudio.online@gmail.com
      </Text>
      <Text style={globalStyles.footerText}>Página {pageNumber}</Text>
    </View>
  )
}
