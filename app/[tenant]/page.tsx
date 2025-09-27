import { redirect } from 'next/navigation'

interface TenantIndexProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function TenantIndex({ params }: TenantIndexProps) {
  const { tenant } = await params

  // Redirect to dashboard as the default tenant page
  redirect(`/${tenant}/dashboard`)
}