import { redirect } from 'next/navigation'

// Server-side redirect — avoids the client-side hydration → render → useEffect
// → router.replace() cycle that caused a blank flash on every dashboard visit.
export default function DashboardPage() {
  redirect('/dashboard/proyectos')
}
