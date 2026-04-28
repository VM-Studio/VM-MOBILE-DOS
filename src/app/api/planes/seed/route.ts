import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Plan from '@/lib/models/Plan'
import { verifyToken } from '@/lib/auth/generateToken'

const PLANES_INICIALES = [
  {
    nombre: 'Web Básica Informativa',
    descripcion: 'Sitio web informativo de hasta 5 páginas, ideal para presencia digital básica.',
    tipo: 'web',
    precio: 100000,
    tipoPago: 'pago_unico',
    mantenimientoPrecio: 30000,
    mantenimientoObligatorio: false,
    orden: 1,
    incluye: [
      'Hasta 5 páginas (Inicio, Nosotros, Servicios, Galería, Contacto)',
      'Diseño responsive (mobile + desktop)',
      'Formulario de contacto',
      'Integración con redes sociales',
      'Optimización SEO básica',
      'Hosting y dominio el primer año',
      '1 ronda de revisiones incluida',
    ],
  },
  {
    nombre: 'Landing Page',
    descripcion: 'Página de aterrizaje de alta conversión para campañas de marketing y captación de leads.',
    tipo: 'landing',
    precio: 150000,
    tipoPago: 'pago_unico',
    mantenimientoPrecio: 50000,
    mantenimientoObligatorio: false,
    orden: 2,
    incluye: [
      'Página única optimizada para conversión',
      'Diseño responsive premium',
      'Formulario de captura de leads',
      'Integración con WhatsApp',
      'SEO on-page completo',
      'Velocidad de carga optimizada',
      '2 rondas de revisiones incluidas',
      'Estadísticas básicas de visitas',
    ],
  },
  {
    nombre: 'Web Profesional',
    descripcion: 'Sitio web completo con diseño a medida, múltiples secciones y funcionalidades avanzadas.',
    tipo: 'web',
    precio: 250000,
    tipoPago: 'pago_unico',
    mantenimientoPrecio: 70000,
    mantenimientoObligatorio: false,
    orden: 3,
    incluye: [
      'Hasta 10 páginas personalizadas',
      'Diseño premium a medida',
      'Panel de administración de contenido',
      'Blog integrado',
      'Formularios avanzados',
      'Integración con redes sociales y Google Analytics',
      'SEO avanzado + sitemap',
      'SSL incluido',
      '3 rondas de revisiones incluidas',
      'Capacitación de uso incluida',
    ],
  },
  {
    nombre: 'Aplicación Web',
    descripcion: 'Plataforma web a medida con funcionalidades complejas, usuarios, y lógica de negocio.',
    tipo: 'app',
    precio: 750000,
    tipoPago: 'pago_unico',
    mantenimientoPrecio: 100000,
    mantenimientoObligatorio: false,
    orden: 4,
    incluye: [
      'Desarrollo full-stack a medida',
      'Sistema de autenticación y roles de usuario',
      'Panel de administración completo',
      'Base de datos en la nube',
      'API REST o GraphQL',
      'Diseño UX/UI profesional',
      'Testing y QA incluido',
      'Deploy en servidor dedicado',
      '6 meses de soporte técnico post-entrega',
      'Documentación técnica incluida',
    ],
  },
  {
    nombre: 'Aplicación Móvil',
    descripcion: 'App nativa o híbrida para iOS y Android con diseño y experiencia de usuario de primer nivel.',
    tipo: 'app',
    precio: 1050000,
    tipoPago: 'pago_unico',
    mantenimientoPrecio: 100000,
    mantenimientoObligatorio: false,
    orden: 5,
    incluye: [
      'Desarrollo para iOS y Android',
      'Diseño UX/UI nativo',
      'Sistema de notificaciones push',
      'Integración con APIs externas',
      'Panel web de administración',
      'Publicación en App Store y Google Play',
      'Testing en dispositivos reales',
      '6 meses de soporte técnico post-entrega',
      'Actualizaciones menores incluidas el primer año',
    ],
  },
  {
    nombre: 'Sistema de Gestión Empresarial',
    descripcion: 'ERP o CRM a medida para automatizar y gestionar los procesos internos de tu empresa.',
    tipo: 'sistema',
    precio: 1500000,
    tipoPago: 'pago_unico',
    mantenimientoPrecio: 150000,
    mantenimientoObligatorio: true,
    orden: 6,
    incluye: [
      'Análisis y relevamiento de procesos',
      'Desarrollo a medida de todos los módulos requeridos',
      'Gestión de usuarios, roles y permisos',
      'Reportes y dashboards en tiempo real',
      'Integración con sistemas existentes',
      'Facturación electrónica (AFIP)',
      'Capacitación del equipo incluida',
      'Soporte prioritario permanente',
      'Mantenimiento mensual obligatorio',
      'Backups automáticos diarios',
      'SLA de disponibilidad 99.9%',
    ],
  },
]

// POST /api/planes/seed — cargar planes iniciales (solo admin)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  try {
    const payload = verifyToken(auth.split(' ')[1])
    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
  }

  try {
    await dbConnect()

    const existing = await Plan.countDocuments()
    if (existing > 0) {
      return NextResponse.json(
        { message: `Ya existen ${existing} planes en la base de datos. Seed omitido.` },
        { status: 200 }
      )
    }

    const planes = await Plan.insertMany(
      PLANES_INICIALES.map((p) => ({ ...p, activo: true }))
    )

    return NextResponse.json({ message: `${planes.length} planes creados correctamente.`, planes }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/planes/seed]', error)
    return NextResponse.json({ error: 'Error al ejecutar el seed.' }, { status: 500 })
  }
}
