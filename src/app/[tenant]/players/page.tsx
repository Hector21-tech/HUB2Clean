import { PlayersPage } from '@/modules/players/components/PlayersPage'

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