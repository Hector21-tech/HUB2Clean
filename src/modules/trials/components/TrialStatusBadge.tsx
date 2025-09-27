import { TrialStatus } from '../types/trial'

interface TrialStatusBadgeProps {
  status: TrialStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📅'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳'
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅'
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '❌'
  },
  NO_SHOW: {
    label: 'No Show',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: '👻'
  }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

export function TrialStatusBadge({ status, size = 'md', className = '' }: TrialStatusBadgeProps) {
  const config = statusConfig[status]
  const sizeClass = sizeClasses[size]

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${config.className}
        ${sizeClass}
        ${className}
      `}
    >
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  )
}