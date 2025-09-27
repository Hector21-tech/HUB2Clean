import { CalendarPage } from '@/modules/calendar/components/CalendarPage'

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