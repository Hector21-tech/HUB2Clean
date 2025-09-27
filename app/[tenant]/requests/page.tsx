import { RequestsPage } from '@/modules/requests/components/RequestsPage'

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