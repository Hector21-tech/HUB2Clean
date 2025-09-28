import { DashboardContent } from '@/modules/dashboard/components/dashboard-content'

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