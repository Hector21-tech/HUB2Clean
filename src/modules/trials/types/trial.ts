// Trial types based on Prisma schema
export type TrialStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

// Core Trial interface matching Prisma model
export interface Trial {
  id: string
  tenantId: string
  playerId: string
  requestId?: string | null
  scheduledAt: Date
  location?: string | null
  status: TrialStatus
  notes?: string | null
  rating?: number | null // 1-10 rating
  feedback?: string | null
  createdAt: Date
  updatedAt: Date

  // Relations (when populated)
  player?: {
    id: string
    firstName: string
    lastName: string
    position?: string | null
    club?: string | null
    avatarPath?: string | null
    avatarUrl?: string | null
  }
  request?: {
    id: string
    title: string
    club: string
    position?: string | null
  } | null
}

// Create Trial input (for new trials)
export interface CreateTrialInput {
  playerId: string
  requestId?: string | null
  scheduledAt: Date
  location?: string | null
  notes?: string | null
}

// Update Trial input
export interface UpdateTrialInput {
  playerId?: string
  scheduledAt?: Date
  location?: string | null
  status?: TrialStatus
  notes?: string | null
  rating?: number | null
  feedback?: string | null
}

// Trial evaluation input
export interface TrialEvaluationInput {
  rating: number // 1-10
  feedback: string
  notes?: string | null
}

// Trial filters for listing
export interface TrialFilters {
  status?: TrialStatus[]
  playerId?: string
  requestId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

// Trial with computed fields for UI
export interface TrialWithMeta extends Trial {
  playerName: string
  playerPositions: string
  daysUntilTrial?: number
  isUpcoming: boolean
  isPast: boolean
  canEvaluate: boolean
  statusColor: string
  statusLabel: string
}

// Trial dashboard statistics
export interface TrialStats {
  total: number
  scheduled: number
  inProgress: number
  completed: number
  cancelled: number
  noShow: number
  upcomingThisWeek: number
  pendingEvaluation: number
}