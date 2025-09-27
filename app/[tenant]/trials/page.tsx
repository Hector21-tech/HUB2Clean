import { TrialsPage } from '@/modules/trials/components/TrialsPage'

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