'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { TransferWindowCalculator, type WindowStatus, type WindowBadgeData } from '@/lib/transfer-window/window-utils'
import { cn } from '@/lib/utils'

interface WindowBadgeProps {
  windowOpenAt?: Date | string | null
  windowCloseAt?: Date | string | null
  graceDays?: number
  paperworkBufferDays?: number
  className?: string
  showCountdown?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function WindowBadge({
  windowOpenAt,
  windowCloseAt,
  graceDays = 3,
  paperworkBufferDays = 3,
  className,
  showCountdown = true,
  size = 'md'
}: WindowBadgeProps) {
  const [windowStatus, setWindowStatus] = useState<WindowStatus>()
  const [badgeData, setBadgeData] = useState<WindowBadgeData>()

  // Calculate window status
  useEffect(() => {
    const calculateStatus = () => {
      const status = TransferWindowCalculator.calculateWindowStatus(
        windowOpenAt,
        windowCloseAt,
        graceDays,
        paperworkBufferDays
      )
      const badge = TransferWindowCalculator.getBadgeData(status)

      setWindowStatus(status)
      setBadgeData(badge)
    }

    calculateStatus()

    // Update every minute for real-time countdown
    const interval = setInterval(calculateStatus, 60000)
    return () => clearInterval(interval)
  }, [windowOpenAt, windowCloseAt, graceDays, paperworkBufferDays])

  if (!windowStatus || !badgeData) return null

  // Don't show badge for NO_WINDOW status unless it's a closed status
  if (windowStatus.status === 'NO_WINDOW') return null

  const getIcon = () => {
    switch (windowStatus.status) {
      case 'OPEN':
        return <CheckCircle className="w-3 h-3" />
      case 'CLOSES_SOON':
      case 'GRACE_PERIOD':
        return <AlertTriangle className="w-3 h-3" />
      case 'OPENS_SOON':
        return <Calendar className="w-3 h-3" />
      case 'CLOSED':
      case 'EXPIRED':
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-4 py-2 text-sm'
      case 'md':
      default:
        return 'px-3 py-1.5 text-xs'
    }
  }

  const getAnimationClasses = () => {
    // Removed animate-pulse as it was distracting
    // Keep urgency indication through colors and icons only
    return ''
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {/* Main Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200',
          badgeData.color,
          badgeData.textColor,
          badgeData.borderColor,
          getSizeClasses(),
          getAnimationClasses()
        )}
        title={`${windowStatus.message} - ${TransferWindowCalculator.getUrgencyDescription(windowStatus.urgencyLevel)}`}
      >
        {getIcon()}
        <span className="whitespace-nowrap">
          {getStatusLabel(windowStatus.status)}
        </span>

        {/* Countdown */}
        {showCountdown && badgeData.countdown && (
          <span className="font-mono text-xs opacity-80">
            {badgeData.countdown}
          </span>
        )}
      </div>

      {/* Urgency Indicator */}
      {windowStatus.urgencyLevel === 'critical' && (
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
             title="Critical: Immediate action required" />
      )}
    </div>
  )
}

function getStatusLabel(status: WindowStatus['status']): string {
  switch (status) {
    case 'OPEN':
      return 'Open'
    case 'CLOSES_SOON':
      return 'Closing Soon'
    case 'GRACE_PERIOD':
      return 'Grace Period'
    case 'OPENS_SOON':
      return 'Opens Soon'
    case 'CLOSED':
      return 'Closed'
    case 'EXPIRED':
      return 'Expired'
    case 'NO_WINDOW':
      return 'No Window'
    default:
      return 'Unknown'
  }
}

// Compact version for tight spaces
export function WindowBadgeCompact({
  windowOpenAt,
  windowCloseAt,
  graceDays = 3,
  paperworkBufferDays = 3,
  className
}: Omit<WindowBadgeProps, 'showCountdown' | 'size'>) {
  return (
    <WindowBadge
      windowOpenAt={windowOpenAt}
      windowCloseAt={windowCloseAt}
      graceDays={graceDays}
      paperworkBufferDays={paperworkBufferDays}
      showCountdown={false}
      size="sm"
      className={className}
    />
  )
}

// Full version with detailed info
export function WindowBadgeDetailed({
  windowOpenAt,
  windowCloseAt,
  graceDays = 3,
  paperworkBufferDays = 3,
  className
}: Omit<WindowBadgeProps, 'showCountdown' | 'size'>) {
  const [windowStatus, setWindowStatus] = useState<WindowStatus>()

  useEffect(() => {
    const status = TransferWindowCalculator.calculateWindowStatus(
      windowOpenAt,
      windowCloseAt,
      graceDays,
      paperworkBufferDays
    )
    setWindowStatus(status)
  }, [windowOpenAt, windowCloseAt, graceDays, paperworkBufferDays])

  if (!windowStatus || windowStatus.status === 'NO_WINDOW') return null

  return (
    <div className={cn('space-y-2', className)}>
      <WindowBadge
        windowOpenAt={windowOpenAt}
        windowCloseAt={windowCloseAt}
        graceDays={graceDays}
        paperworkBufferDays={paperworkBufferDays}
        size="lg"
      />

      <div className="text-xs text-gray-600">
        <div>{windowStatus.message}</div>
        {windowStatus.urgencyLevel !== 'none' && (
          <div className="text-gray-500">
            {TransferWindowCalculator.getUrgencyDescription(windowStatus.urgencyLevel)}
          </div>
        )}
      </div>
    </div>
  )
}