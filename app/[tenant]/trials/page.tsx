import dynamic from 'next/dynamic'

// Lazy load trials module (8.33kB) for better performance
const TrialsPage = dynamic(
  () => import('@/modules/trials/components/TrialsPage').then(mod => ({ default: mod.TrialsPage })),
  {
    loading: () => (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-white/10 rounded w-48 mb-4 animate-pulse"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-white/10 rounded w-24 animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-white/10 rounded w-32"></div>
                <div className="h-6 bg-white/10 rounded w-16"></div>
              </div>
              <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-white/10 rounded w-20"></div>
                <div className="h-8 bg-white/10 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  }
)

interface TrialsPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Trials({ params }: TrialsPageProps) {
  const { tenant } = await params

  return <TrialsPage />
}

export const metadata = {
  title: 'Trials | Scout Hub 2',
  description: 'Manage player trials and evaluations',
}