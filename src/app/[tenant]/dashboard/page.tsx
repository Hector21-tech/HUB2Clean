interface DashboardPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Dashboard({ params }: DashboardPageProps) {
  const { tenant } = await params

  return (
    <div className="flex-1 bg-gradient-to-br from-[#020617] via-[#0c1532] via-[#1e3a8a] via-[#0f1b3e] to-[#020510] relative">
      <div className="relative p-6">
        <div className="text-white">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Welcome to your {tenant} dashboard!</p>
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