import dynamic from 'next/dynamic'

// Lazy load calendar module (40.9kB) for much better performance
const CalendarPage = dynamic(
  () => import('@/modules/calendar/components/CalendarPage').then(mod => ({ default: mod.CalendarPage })),
  {
    loading: () => (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-white/10 rounded w-64 mb-4 animate-pulse"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-white/10 rounded w-24 animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-6 bg-white/10 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/10 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
)

interface CalendarPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Calendar({ params }: CalendarPageProps) {
  // Handle Next.js 15 async params
  const { tenant } = await params

  return <CalendarPage />
}

export const metadata = {
  title: 'Calendar | Scout Hub 2',
  description: 'Manage your scouting events, trials, and schedule',
}