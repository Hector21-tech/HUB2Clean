export interface WindowStatus {
  status: 'NO_WINDOW' | 'OPENS_SOON' | 'OPEN' | 'CLOSES_SOON' | 'GRACE_PERIOD' | 'CLOSED' | 'EXPIRED'
  daysLeft?: number
  hoursLeft?: number
  urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  message: string
  canTransfer: boolean
}

export interface WindowBadgeData {
  status: WindowStatus['status']
  color: string
  textColor: string
  borderColor: string
  icon: string
  countdown?: string
  urgencyLevel: WindowStatus['urgencyLevel']
}

export class TransferWindowCalculator {

  static calculateWindowStatus(
    windowOpenAt?: Date | string | null,
    windowCloseAt?: Date | string | null,
    graceDays: number = 3,
    paperworkBufferDays: number = 3
  ): WindowStatus {
    const now = new Date()

    // No window dates provided
    if (!windowOpenAt || !windowCloseAt) {
      return {
        status: 'NO_WINDOW',
        urgencyLevel: 'none',
        message: 'No transfer window specified',
        canTransfer: true // Assume can transfer if no window restrictions
      }
    }

    const openDate = new Date(windowOpenAt)
    const closeDate = new Date(windowCloseAt)
    const graceEndDate = new Date(closeDate.getTime() + (graceDays * 24 * 60 * 60 * 1000))
    const paperworkDeadline = new Date(closeDate.getTime() - (paperworkBufferDays * 24 * 60 * 60 * 1000))

    // Calculate time differences in milliseconds
    const msToOpen = openDate.getTime() - now.getTime()
    const msToClose = closeDate.getTime() - now.getTime()
    const msToGraceEnd = graceEndDate.getTime() - now.getTime()
    const msToPaperwork = paperworkDeadline.getTime() - now.getTime()

    // Convert to days and hours
    const daysToOpen = Math.ceil(msToOpen / (24 * 60 * 60 * 1000))
    const daysToClose = Math.ceil(msToClose / (24 * 60 * 60 * 1000))
    const daysToGraceEnd = Math.ceil(msToGraceEnd / (24 * 60 * 60 * 1000))
    const daysToPaperwork = Math.ceil(msToPaperwork / (24 * 60 * 60 * 1000))

    const hoursToClose = Math.ceil(msToClose / (60 * 60 * 1000))
    const hoursToOpen = Math.ceil(msToOpen / (60 * 60 * 1000))

    // Window hasn't opened yet
    if (now < openDate) {
      const urgency = daysToOpen <= 7 ? 'medium' : 'low'
      return {
        status: 'OPENS_SOON',
        daysLeft: daysToOpen,
        hoursLeft: hoursToOpen,
        urgencyLevel: urgency,
        message: `Opens in ${daysToOpen} day${daysToOpen !== 1 ? 's' : ''}`,
        canTransfer: false
      }
    }

    // Window is currently open
    if (now >= openDate && now <= closeDate) {
      // Critical: Paperwork deadline approaching
      if (msToPaperwork <= 0) {
        return {
          status: 'CLOSES_SOON',
          daysLeft: daysToClose,
          hoursLeft: hoursToClose,
          urgencyLevel: 'critical',
          message: `Paperwork deadline passed! Closes in ${daysToClose} day${daysToClose !== 1 ? 's' : ''}`,
          canTransfer: true
        }
      }

      // High urgency: Within paperwork buffer
      if (daysToPaperwork <= paperworkBufferDays) {
        return {
          status: 'CLOSES_SOON',
          daysLeft: daysToClose,
          hoursLeft: hoursToClose,
          urgencyLevel: 'high',
          message: `Paperwork deadline in ${daysToPaperwork} day${daysToPaperwork !== 1 ? 's' : ''} - Closes in ${daysToClose}`,
          canTransfer: true
        }
      }

      // Medium urgency: Closing within a week
      if (daysToClose <= 7) {
        return {
          status: 'CLOSES_SOON',
          daysLeft: daysToClose,
          hoursLeft: hoursToClose,
          urgencyLevel: 'medium',
          message: `Closes in ${daysToClose} day${daysToClose !== 1 ? 's' : ''}`,
          canTransfer: true
        }
      }

      // Window is open, plenty of time
      return {
        status: 'OPEN',
        daysLeft: daysToClose,
        hoursLeft: hoursToClose,
        urgencyLevel: 'low',
        message: `Open - Closes in ${daysToClose} day${daysToClose !== 1 ? 's' : ''}`,
        canTransfer: true
      }
    }

    // Grace period after window close
    if (now > closeDate && now <= graceEndDate) {
      return {
        status: 'GRACE_PERIOD',
        daysLeft: daysToGraceEnd,
        urgencyLevel: 'critical',
        message: `Grace period - ${daysToGraceEnd} day${daysToGraceEnd !== 1 ? 's' : ''} left`,
        canTransfer: true
      }
    }

    // Window has expired
    return {
      status: 'EXPIRED',
      urgencyLevel: 'none',
      message: 'Transfer window closed',
      canTransfer: false
    }
  }

  static getBadgeData(windowStatus: WindowStatus): WindowBadgeData {
    switch (windowStatus.status) {
      case 'OPEN':
        return {
          status: windowStatus.status,
          color: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: '🟢',
          countdown: this.formatCountdown(windowStatus.daysLeft, windowStatus.hoursLeft),
          urgencyLevel: windowStatus.urgencyLevel
        }

      case 'CLOSES_SOON':
        const urgencyColor = windowStatus.urgencyLevel === 'critical'
          ? { color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-200' }
          : windowStatus.urgencyLevel === 'high'
          ? { color: 'bg-orange-100', textColor: 'text-orange-800', borderColor: 'border-orange-200' }
          : { color: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-200' }

        return {
          status: windowStatus.status,
          ...urgencyColor,
          icon: windowStatus.urgencyLevel === 'critical' ? '🔴' : '🟡',
          countdown: this.formatCountdown(windowStatus.daysLeft, windowStatus.hoursLeft),
          urgencyLevel: windowStatus.urgencyLevel
        }

      case 'GRACE_PERIOD':
        return {
          status: windowStatus.status,
          color: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: '⚠️',
          countdown: this.formatCountdown(windowStatus.daysLeft, windowStatus.hoursLeft),
          urgencyLevel: windowStatus.urgencyLevel
        }

      case 'OPENS_SOON':
        return {
          status: windowStatus.status,
          color: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: '🔵',
          countdown: this.formatCountdown(windowStatus.daysLeft, windowStatus.hoursLeft),
          urgencyLevel: windowStatus.urgencyLevel
        }

      case 'CLOSED':
      case 'EXPIRED':
        return {
          status: windowStatus.status,
          color: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: '⚫',
          urgencyLevel: windowStatus.urgencyLevel
        }

      case 'NO_WINDOW':
      default:
        return {
          status: windowStatus.status,
          color: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-100',
          icon: '➖',
          urgencyLevel: windowStatus.urgencyLevel
        }
    }
  }

  private static formatCountdown(days?: number, hours?: number): string | undefined {
    if (!days && !hours) return undefined

    if (days && days > 0) {
      if (days === 1 && hours && hours <= 24) {
        return `${hours}h`
      }
      return `${days}d`
    }

    if (hours && hours > 0) {
      return `${hours}h`
    }

    return undefined
  }

  static getUrgencyDescription(urgencyLevel: WindowStatus['urgencyLevel']): string {
    switch (urgencyLevel) {
      case 'critical': return 'Immediate action required'
      case 'high': return 'Act within days'
      case 'medium': return 'Plan accordingly'
      case 'low': return 'No immediate rush'
      case 'none': return 'No time constraints'
      default: return ''
    }
  }
}