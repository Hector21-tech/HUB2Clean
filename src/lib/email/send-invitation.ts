import { Resend } from 'resend'
import { InvitationEmail } from './templates/invitation-email'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  to: string
  inviteToken: string
  organizationName: string
  role: string
  expiresAt: Date
  invitedByName?: string
}

export async function sendInvitationEmail({
  to,
  inviteToken,
  organizationName,
  role,
  expiresAt,
  invitedByName
}: SendInvitationEmailParams) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteLink = `${siteUrl}/accept-invite/${inviteToken}`

    console.log('📧 Sending invitation email:', {
      to,
      organizationName,
      role,
      inviteLink: inviteLink.substring(0, 50) + '...'
    })

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Scout Hub <onboarding@resend.dev>',
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      react: InvitationEmail({
        inviteLink,
        organizationName,
        role,
        expiresAt,
        invitedByName
      })
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('✅ Email sent successfully:', data?.id)
    return { success: true, emailId: data?.id }

  } catch (error) {
    console.error('❌ Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}