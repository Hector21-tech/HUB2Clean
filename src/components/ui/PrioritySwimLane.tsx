'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronRight } from 'lucide-react'
import { BoardColumn } from './BoardColumn'

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

interface PrioritySwimLaneProps {
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT'
  requests: Request[]
  onRequestUpdate: (requestId: string, newStatus: string, newPriority?: string) => void
  onRequestSelect: (requestId: string) => void
  selectedRequests: Set<string>
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const STATUS_COLUMNS = [
  { id: 'OPEN', title: 'New', description: 'Recently received' },
  { id: 'IN_PROGRESS', title: 'Qualified', description: 'Initial screening passed' },
  { id: 'OFFER_SENT', title: 'In Dialog', description: 'Active negotiations' },
  { id: 'AGREEMENT', title: 'Offer Sent', description: 'Waiting for response' },
  { id: 'COMPLETED', title: 'Agreement', description: 'Terms agreed upon' }
]

export function PrioritySwimLane({
  priority,
  requests,
  onRequestUpdate,
  onRequestSelect,
  selectedRequests,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}: PrioritySwimLaneProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          icon: AlertTriangle,
          label: 'Urgent',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400/30',
          count: requests.length
        }
      case 'HIGH':
        return {
          icon: ArrowUp,
          label: 'High Priority',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-400/30',
          count: requests.length
        }
      case 'MEDIUM':
        return {
          icon: Minus,
          label: 'Medium Priority',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400/30',
          count: requests.length
        }
      case 'LOW':
        return {
          icon: ArrowDown,
          label: 'Low Priority',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-400/30',
          count: requests.length
        }
      default:
        return {
          icon: Minus,
          label: priority,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-400/30',
          count: requests.length
        }
    }
  }

  const getRequestsByStatus = (status: string) => {
    return requests.filter(request => request.status === status)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    console.log('PrioritySwimLane - handleDrop:', { columnId, priority })

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      const { requestId, sourceColumn, sourcePriority } = data

      console.log('Drop data:', { requestId, sourceColumn, sourcePriority, targetColumn: columnId, targetPriority: priority })

      if (requestId) {
        // Check if we're changing status, priority, or both
        const statusChanged = sourceColumn !== columnId
        const priorityChanged = sourcePriority !== priority

        if (statusChanged || priorityChanged) {
          console.log('Updating request:', { statusChanged, priorityChanged })
          // Always send both status and priority to parent
          onRequestUpdate(requestId, columnId, priority)
        } else {
          console.log('No changes needed - same column and priority')
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  const config = getPriorityConfig(priority)
  const Icon = config.icon

  // Don't render if no requests and priority is LOW (to reduce clutter)
  if (requests.length === 0 && priority === 'LOW') {
    return null
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl backdrop-blur-sm ${className}`}>
      {/* Swimlane Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </button>

          <Icon className={`w-5 h-5 ${config.color}`} />
          <h2 className="text-lg font-semibold text-white">{config.label}</h2>
          <span className="bg-white/10 text-white/70 text-sm px-3 py-1 rounded-full">
            {config.count}
          </span>
        </div>

        {/* Priority Actions */}
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>Swimlane: PRIORITY = {priority}</span>
        </div>
      </div>

      {/* Columns Container */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4 min-h-64">
            {STATUS_COLUMNS.map(column => {
              const columnRequests = getRequestsByStatus(column.id)

              return (
                <BoardColumn
                  key={`${priority}-${column.id}`}
                  columnId={column.id}
                  title={column.title}
                  requests={columnRequests}
                  onRequestUpdate={onRequestUpdate}
                  onRequestSelect={onRequestSelect}
                  selectedRequests={selectedRequests}
                  isDragOver={dragOverColumn === column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                  maxHeight="h-64"
                  className="bg-white/5 border border-white/10 rounded-lg"
                />
              )
            })}
          </div>

          {/* Swimlane Footer */}
          {config.count > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <p className="text-xs text-white/50">
                {config.count} request{config.count !== 1 ? 's' : ''} in {config.label.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="p-4 text-center">
          <p className="text-sm text-white/70">
            {config.count} request{config.count !== 1 ? 's' : ''} • Click to expand
          </p>
        </div>
      )}
    </div>
  )
}