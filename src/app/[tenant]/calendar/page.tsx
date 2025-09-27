import { MainNav } from '@/components/main-nav'
import { UserNav } from '@/components/user-nav'
import { CalendarPage } from '@/modules/calendar/components/CalendarPage'

interface CalendarPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function Calendar({ params }: CalendarPageProps) {
  // Handle Next.js 15 async params
  const { tenant } = await params

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex h-16 items-center px-4">
          <MainNav tenant={tenant} />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>

      <CalendarPage />
    </div>
  )
}

export const metadata = {
  title: 'Calendar | Scout Hub 2',
  description: 'Manage your scouting events, trials, and schedule',
}