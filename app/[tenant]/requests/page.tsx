import dynamic from 'next/dynamic'

// Lazy load requests module (17.3kB) for better performance
const RequestsPage = dynamic(
  () => import('@/modules/requests/components/RequestsPage').then(mod => ({ default: mod.RequestsPage })),
  {
    loading: () => (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-white/10 rounded w-48 mb-4 animate-pulse"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/10 rounded w-20 animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <div className="h-6 bg-white/10 rounded w-48"></div>
                <div className="h-6 bg-white/10 rounded w-20"></div>
              </div>
              <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    ),
  }
)

interface RequestsPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Requests({ params }: RequestsPageProps) {
  const { tenant } = await params

  return <RequestsPage />
}

export const metadata = {
  title: 'Requests | Scout Hub 2',
  description: 'Manage player requests and scouting opportunities',
  keywords: ['requests', 'scouting', 'player management', 'football', 'soccer'],
}