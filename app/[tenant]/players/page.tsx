import dynamic from 'next/dynamic'

// Lazy load players module for better performance
const PlayersPage = dynamic(
  () => import('@/modules/players/components/PlayersPage').then(mod => ({ default: mod.PlayersPage })),
  {
    loading: () => (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-white/10 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse">
              <div className="h-20 bg-white/10 rounded mb-4"></div>
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    ),
  }
)

interface PlayersPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Players({ params }: PlayersPageProps) {
  const { tenant } = await params

  return <PlayersPage />
}

export const metadata = {
  title: 'Players | Scout Hub 2',
  description: 'Manage your player database and scouting reports',
  keywords: ['players', 'scouting', 'football', 'soccer', 'database'],
}