'use client'

import { useState, useMemo } from 'react'
import { PrioritySwimLane } from './PrioritySwimLane'
import { Target, AlertTriangle } from 'lucide-react'

interface Request {
  id: string
  title: string
  description: string
  club: string
  position: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  windowOpenAt?: string | null
  windowCloseAt?: string | null
  deadline?: string | null
  graceDays?: number
}

interface SwimlaneBoardViewProps {
  requests: Request[]
  onRequestUpdate: (requestId: string, newStatus: string, newPriority?: string) => void
  onRequestSelect: (requestId: string) => void
  selectedRequests: Set<string>
  className?: string
}

const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const
type Priority = typeof PRIORITY_ORDER[number]

export function SwimlaneBoardView({
  requests,
  onRequestUpdate,
  onRequestSelect,
  selectedRequests,
  className = ''
}: SwimlaneBoardViewProps) {
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<Priority>>(new Set(['LOW' as Priority]))

  // Group requests by priority
  const requestsByPriority = useMemo(() => {
    const grouped = requests.reduce((acc, request) => {
      const priority = (request.priority || 'MEDIUM') as Priority
      if (!acc[priority]) {
        acc[priority] = []
      }
      acc[priority].push(request)
      return acc
    }, {} as Record<Priority, Request[]>)

    // Ensure all priorities have arrays (even if empty)
    PRIORITY_ORDER.forEach(priority => {
      if (!grouped[priority]) {
        grouped[priority] = []
      }
    })

    return grouped
  }, [requests])

  const toggleSwimlaneCollapse = (priority: Priority) => {
    const newCollapsed = new Set(collapsedSwimlanes)
    if (newCollapsed.has(priority)) {
      newCollapsed.delete(priority)
    } else {
      newCollapsed.add(priority)
    }
    setCollapsedSwimlanes(newCollapsed)
  }

  const handleRequestUpdate = (requestId: string, newStatus: string, newPriority?: string) => {
    console.log('SwimlaneBoardView - handleRequestUpdate:', { requestId, newStatus, newPriority })

    // Always call the parent with all three parameters
    onRequestUpdate(requestId, newStatus, newPriority)
  }

  const totalRequests = requests.length
  const hasRequests = totalRequests > 0

  if (!hasRequests) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-white/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Target className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium mb-2">No requests found</p>
          <p className="text-sm text-white/40">
            Create your first scout request to see the board view
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Board Header Stats */}
      <div className="bg-gradient-to-r from-slate-900/40 via-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalRequests}</div>
              <div className="text-xs text-white/60">Total Requests</div>
            </div>
            {PRIORITY_ORDER.map(priority => {
              const count = requestsByPriority[priority]?.length || 0
              if (count === 0 && priority === 'LOW') return null

              return (
                <div key={priority} className="text-center">
                  <div className="text-lg font-semibold text-white">{count}</div>
                  <div className="text-xs text-white/60 flex items-center gap-1">
                    {priority === 'URGENT' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    {priority}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Pipeline View</span>
            <span>•</span>
            <button
              onClick={() => {
                if (collapsedSwimlanes.size === PRIORITY_ORDER.length) {
                  setCollapsedSwimlanes(new Set())
                } else {
                  setCollapsedSwimlanes(new Set(PRIORITY_ORDER))
                }
              }}
              className="hover:text-white/80 transition-colors"
            >
              {collapsedSwimlanes.size === PRIORITY_ORDER.length ? 'Expand All' : 'Collapse All'}
            </button>
          </div>
        </div>
      </div>

      {/* Priority Swimlanes */}
      <div className="space-y-4">
        {PRIORITY_ORDER.map(priority => {
          const priorityRequests = requestsByPriority[priority] || []

          // Skip empty low priority swimlane
          if (priorityRequests.length === 0 && priority === 'LOW') {
            return null
          }

          return (
            <PrioritySwimLane
              key={priority}
              priority={priority}
              requests={priorityRequests}
              onRequestUpdate={handleRequestUpdate}
              onRequestSelect={onRequestSelect}
              selectedRequests={selectedRequests}
              isCollapsed={collapsedSwimlanes.has(priority)}
              onToggleCollapse={() => toggleSwimlaneCollapse(priority)}
              className="transition-all duration-300"
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>💡 Drag requests between columns to update status • Drag between swimlanes to change priority</span>
          <div className="flex items-center gap-4">
            <span>📋 New → ✅ Qualified → 💬 In Dialog → 📤 Offer Sent → 🤝 Agreement</span>
          </div>
        </div>
      </div>
    </div>
  )
}