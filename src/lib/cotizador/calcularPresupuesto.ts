import { PRECIOS } from './precios'

export interface CotizadorInput {
  servicios: string[]
  web?: { tipo?: string; paginas?: string; contacto?: string[]; extras?: string[] }
  app?: { tipo?: string; rubro?: string; extras?: string[] }
  general?: { etapa?: string; tieneWeb?: boolean; urlWeb?: string; cuandoEmpezar?: string; comoNosConocio?: string }
  datos?: { nombre?: string; empresa?: string; email?: string; whatsapp?: string; preferenciaContacto?: string }
}

export interface PresupuestoCalculado {
  items: { descripcion: string; precio: number }[]
  subtotal: number
  descuento: number
  total: number
  tiempoEstimado: { dias: number; label: string }
}

function calcularTiempoWeb(extras: string[]): { dias: number; label: string } {
  let dias = 5
  if (extras.includes('catalogo')) dias += 1
  if (extras.includes('carrito')) dias += 2
  if (extras.includes('blog')) dias += 1
  if (extras.includes('reservas')) dias += 2
  if (extras.includes('pagos')) dias += 1
  if (extras.includes('login')) dias += 2
  if (extras.includes('panel_admin')) dias += 2
  if (extras.includes('seo')) dias += 1
  dias = Math.min(dias, 9)
  const min = Math.max(dias - 1, 5)
  return { dias, label: `Entre ${min} y ${dias} días hábiles` }
}

export function calcularPresupuesto(input: CotizadorInput): PresupuestoCalculado {
  const items: { descripcion: string; precio: number }[] = []
  let subtotal = 0
  let tiempoEstimado = { dias: 0, label: 'Arrancamos cuando vos estés listo' }

  const tieneWeb = input.servicios.includes('web')
  const tieneApp = input.servicios.includes('app')

  // ─── WEB ─────────────────────────────────────────────────────────────────────
  if (tieneWeb) {
    const precio = PRECIOS.WEB.BASE
    items.push({ descripcion: 'Desarrollo web profesional', precio })
    subtotal += precio
    const extras = input.web?.extras ?? []
    const contacto = input.web?.contacto ?? []
    if (contacto.includes('formulario')) {
      items.push({ descripcion: 'Formulario de contacto', precio: PRECIOS.WEB.FORMULARIO_CONTACTO })
      subtotal += PRECIOS.WEB.FORMULARIO_CONTACTO
    }
    if (extras.includes('catalogo')) { items.push({ descripcion: 'Catálogo de productos', precio: PRECIOS.WEB.CATALOGO_SIN_CARRITO }); subtotal += PRECIOS.WEB.CATALOGO_SIN_CARRITO }
    if (extras.includes('carrito')) { items.push({ descripcion: 'Carrito de compras', precio: PRECIOS.WEB.CARRITO_COMPRAS }); subtotal += PRECIOS.WEB.CARRITO_COMPRAS }
    if (extras.includes('blog')) { items.push({ descripcion: 'Blog / Noticias', precio: PRECIOS.WEB.BLOG }); subtotal += PRECIOS.WEB.BLOG }
    if (extras.includes('reservas')) { items.push({ descripcion: 'Reservas / Turnos online', precio: PRECIOS.WEB.RESERVAS_TURNOS }); subtotal += PRECIOS.WEB.RESERVAS_TURNOS }
    if (extras.includes('pagos')) { items.push({ descripcion: 'Pasarela de pagos MercadoPago', precio: PRECIOS.WEB.PASARELA_PAGOS }); subtotal += PRECIOS.WEB.PASARELA_PAGOS }
    if (extras.includes('login')) { items.push({ descripcion: 'Sistema de login de usuarios', precio: PRECIOS.WEB.SISTEMA_LOGIN }); subtotal += PRECIOS.WEB.SISTEMA_LOGIN }
    if (extras.includes('panel_admin')) { items.push({ descripcion: 'Panel de administración propio', precio: PRECIOS.WEB.PANEL_ADMIN }); subtotal += PRECIOS.WEB.PANEL_ADMIN }
    if (extras.includes('seo')) { items.push({ descripcion: 'SEO avanzado', precio: PRECIOS.WEB.SEO_AVANZADO }); subtotal += PRECIOS.WEB.SEO_AVANZADO }
    if (extras.includes('multiidioma')) { items.push({ descripcion: 'Soporte multiidioma', precio: PRECIOS.WEB.MULTIIDIOMA }); subtotal += PRECIOS.WEB.MULTIIDIOMA }
    if (extras.includes('redes')) { items.push({ descripcion: 'Integración redes sociales', precio: PRECIOS.WEB.REDES_SOCIALES }); subtotal += PRECIOS.WEB.REDES_SOCIALES }
    if (extras.includes('analytics')) { items.push({ descripcion: 'Google Analytics + píxel', precio: PRECIOS.WEB.ANALYTICS_PIXEL }); subtotal += PRECIOS.WEB.ANALYTICS_PIXEL }
    if (extras.includes('chat')) { items.push({ descripcion: 'Chat en vivo', precio: PRECIOS.WEB.CHAT_EN_VIVO }); subtotal += PRECIOS.WEB.CHAT_EN_VIVO }
    if ((input.web?.paginas ?? '') === '8+') { items.push({ descripcion: 'Páginas adicionales', precio: PRECIOS.WEB.PAGINAS_EXTRA }); subtotal += PRECIOS.WEB.PAGINAS_EXTRA }
    tiempoEstimado = calcularTiempoWeb(extras)
  }

  // ─── APP ─────────────────────────────────────────────────────────────────────
  if (tieneApp) {
    const appTipo = input.app?.tipo ?? 'web'
    const basePrice = appTipo === 'mobile' ? PRECIOS.APP.MOBILE_BASE : PRECIOS.APP.WEB_BASE
    const label = appTipo === 'mobile' ? 'Aplicación móvil nativa (Android + iOS)' : 'Aplicación web (PWA)'
    items.push({ descripcion: label, precio: basePrice })
    subtotal += basePrice
    const extras = input.app?.extras ?? []
    if (extras.includes('usuarios')) { items.push({ descripcion: 'Sistema de usuarios y perfiles', precio: PRECIOS.APP.SISTEMA_USUARIOS }); subtotal += PRECIOS.APP.SISTEMA_USUARIOS }
    if (extras.includes('push')) { items.push({ descripcion: 'Notificaciones push', precio: PRECIOS.APP.NOTIFICACIONES_PUSH }); subtotal += PRECIOS.APP.NOTIFICACIONES_PUSH }
    if (extras.includes('chat')) { items.push({ descripcion: 'Chat en tiempo real', precio: PRECIOS.APP.CHAT_TIEMPO_REAL }); subtotal += PRECIOS.APP.CHAT_TIEMPO_REAL }
    if (extras.includes('pagos')) { items.push({ descripcion: 'Pagos in-app', precio: PRECIOS.APP.PAGOS_IN_APP }); subtotal += PRECIOS.APP.PAGOS_IN_APP }
    if (extras.includes('geo')) { items.push({ descripcion: 'Geolocalización / Mapas', precio: PRECIOS.APP.GEOLOCALIZACION }); subtotal += PRECIOS.APP.GEOLOCALIZACION }
    if (extras.includes('dashboard')) { items.push({ descripcion: 'Dashboard con estadísticas', precio: PRECIOS.APP.DASHBOARD_METRICAS }); subtotal += PRECIOS.APP.DASHBOARD_METRICAS }
    if (extras.includes('api')) { items.push({ descripcion: 'Integración con API externa', precio: PRECIOS.APP.INTEGRACION_API }); subtotal += PRECIOS.APP.INTEGRACION_API }
    if (extras.includes('admin')) { items.push({ descripcion: 'Panel de administración', precio: PRECIOS.APP.PANEL_ADMIN }); subtotal += PRECIOS.APP.PANEL_ADMIN }
    if (extras.includes('reservas')) { items.push({ descripcion: 'Sistema de reservas', precio: PRECIOS.APP.SISTEMA_RESERVAS }); subtotal += PRECIOS.APP.SISTEMA_RESERVAS }
    if (extras.includes('ecommerce')) { items.push({ descripcion: 'Tienda / E-commerce', precio: PRECIOS.APP.CARRITO_ECOMMERCE }); subtotal += PRECIOS.APP.CARRITO_ECOMMERCE }
    if (extras.includes('idiomas')) { items.push({ descripcion: 'Soporte multiidioma', precio: PRECIOS.APP.MULTIIDIOMA }); subtotal += PRECIOS.APP.MULTIIDIOMA }
    if (extras.includes('offline')) { items.push({ descripcion: 'Modo offline', precio: PRECIOS.APP.MODO_OFFLINE }); subtotal += PRECIOS.APP.MODO_OFFLINE }
    tiempoEstimado = appTipo === 'mobile'
      ? { dias: 45, label: 'Aproximadamente 1 mes y medio' }
      : { dias: 30, label: 'Aproximadamente 1 mes' }
  }

  // ─── Descuentos ───────────────────────────────────────────────────────────────
  let descuento = 0
  if (tieneWeb && tieneApp) {
    descuento = Math.round(subtotal * 0.05)
  }

  const total = subtotal - descuento
  return { items, subtotal, descuento, total, tiempoEstimado }
}
