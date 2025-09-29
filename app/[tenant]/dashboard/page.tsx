import dynamic from 'next/dynamic'

// Lazy load dashboard content for faster initial page load
const DashboardContent = dynamic(
  () => import('@/modules/dashboard/components/dashboard-content').then(mod => ({ default: mod.DashboardContent })),
  {
    loading: () => (
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded mb-4"></div>
              <div className="h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 rounded-xl p-6 animate-pulse">
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    ),
  }
)

interface DashboardPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Dashboard({ params }: DashboardPageProps) {
  const { tenant } = await params

  return (
    <div className="flex-1 relative">
      <div className="relative p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/70">Real-time insights and analytics for {tenant}</p>
          </div>
          <DashboardContent tenant={tenant} />
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard | Scout Hub 2',
  description: 'Your scouting dashboard with key metrics and insights',
  keywords: ['dashboard', 'scouting', 'analytics', 'overview'],
}