'use client'

import { useState } from 'react'
import { Building2, Target, Calendar, Clock, AlertTriangle, MoreVertical } from 'lucide-react'
import { WindowBadge } from './window-badge'

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

interface KanbanBoardProps {
  requests: Request[]
  onRequestUpdate: (requestId: string, newStatus: string) => void
  onRequestSelect: (requestId: string) => void
  selectedRequests: Set<string>
}

const STATUS_FILTERS = [
  {
    id: 'ALL',
    title: 'All',
    color: 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 dark:from-slate-400/20 dark:to-slate-500/20',
    textColor: 'text-slate-700 dark:text-slate-200',
    borderColor: 'border-slate-400/30 dark:border-slate-500/30',
    hoverColor: 'hover:from-slate-500/30 hover:to-slate-600/30 dark:hover:from-slate-400/30 dark:hover:to-slate-500/30',
    count: 0
  },
  {
    id: 'OPEN',
    title: 'New',
    color: 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-500/20',
    textColor: 'text-blue-700 dark:text-blue-200',
    borderColor: 'border-blue-400/30 dark:border-blue-500/30',
    hoverColor: 'hover:from-blue-500/30 hover:to-blue-600/30 dark:hover:from-blue-400/30 dark:hover:to-blue-500/30',
    count: 0
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    color: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 dark:from-yellow-400/20 dark:to-yellow-500/20',
    textColor: 'text-yellow-700 dark:text-yellow-200',
    borderColor: 'border-yellow-400/30 dark:border-yellow-500/30',
    hoverColor: 'hover:from-yellow-500/30 hover:to-yellow-600/30 dark:hover:from-yellow-400/30 dark:hover:to-yellow-500/30',
    count: 0
  },
  {
    id: 'OFFER_SENT',
    title: 'Offer Sent',
    color: 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 dark:from-orange-400/20 dark:to-orange-500/20',
    textColor: 'text-orange-700 dark:text-orange-200',
    borderColor: 'border-orange-400/30 dark:border-orange-500/30',
    hoverColor: 'hover:from-orange-500/30 hover:to-orange-600/30 dark:hover:from-orange-400/30 dark:hover:to-orange-500/30',
    count: 0
  },
  {
    id: 'AGREEMENT',
    title: 'Agreement',
    color: 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 dark:from-purple-400/20 dark:to-purple-500/20',
    textColor: 'text-purple-700 dark:text-purple-200',
    borderColor: 'border-purple-400/30 dark:border-purple-500/30',
    hoverColor: 'hover:from-purple-500/30 hover:to-purple-600/30 dark:hover:from-purple-400/30 dark:hover:to-purple-500/30',
    count: 0
  },
  {
    id: 'COMPLETED',
    title: 'Won',
    color: 'bg-gradient-to-r from-green-500/20 to-green-600/20 dark:from-green-400/20 dark:to-green-500/20',
    textColor: 'text-green-700 dark:text-green-200',
    borderColor: 'border-green-400/30 dark:border-green-500/30',
    hoverColor: 'hover:from-green-500/30 hover:to-green-600/30 dark:hover:from-green-400/30 dark:hover:to-green-500/30',
    count: 0
  },
  {
    id: 'CANCELLED',
    title: 'Lost',
    color: 'bg-gradient-to-r from-red-500/20 to-red-600/20 dark:from-red-400/20 dark:to-red-500/20',
    textColor: 'text-red-700 dark:text-red-200',
    borderColor: 'border-red-400/30 dark:border-red-500/30',
    hoverColor: 'hover:from-red-500/30 hover:to-red-600/30 dark:hover:from-red-400/30 dark:hover:to-red-500/30',
    count: 0
  }
]

export function KanbanBoard({ requests, onRequestUpdate, onRequestSelect, selectedRequests }: KanbanBoardProps) {
  const [activeFilter, setActiveFilter] = useState<string>('ALL')
  const [draggedRequest, setDraggedRequest] = useState<string | null>(null)

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    requests.forEach(request => {
      counts[request.status] = (counts[request.status] || 0) + 1
    })
    return counts
  }

  const getFilteredRequests = () => {
    if (activeFilter === 'ALL') return requests
    return requests.filter(request => request.status === activeFilter)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'border-l-red-500/60 bg-red-500/5 dark:bg-red-500/10'
      case 'high': return 'border-l-orange-500/60 bg-orange-500/5 dark:bg-orange-500/10'
      case 'medium': return 'border-l-blue-500/60 bg-blue-500/5 dark:bg-blue-500/10'
      case 'low': return 'border-l-gray-500/60 bg-gray-500/5 dark:bg-gray-500/10'
      default: return 'border-l-gray-500/60 bg-gray-500/5 dark:bg-gray-500/10'
    }
  }

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    setDraggedRequest(requestId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedRequest && draggedRequest !== newStatus) {
      onRequestUpdate(draggedRequest, newStatus)
    }
    setDraggedRequest(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    })
  }

  const statusCounts = getStatusCounts()
  const filteredRequests = getFilteredRequests()

  return (
    <div className="space-y-6">
      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-3 p-4 bg-gradient-to-br from-background/80 via-background/90 to-background/80 backdrop-blur-xl border border-border rounded-xl">
        {STATUS_FILTERS.map(filter => {
          const count = filter.id === 'ALL' ? requests.length : (statusCounts[filter.id] || 0)
          const isActive = activeFilter === filter.id

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg border backdrop-blur-sm transition-all duration-200 font-medium text-sm ${
                isActive
                  ? `${filter.color} ${filter.textColor} ${filter.borderColor} shadow-lg scale-105`
                  : `bg-background/20 text-foreground/60 border-border/50 hover:bg-background/30 ${filter.hoverColor}`
              }`}
            >
              <span>{filter.title}</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Request Cards Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.preventDefault()
          if (draggedRequest && activeFilter !== 'ALL') {
            handleDrop(e, activeFilter)
          }
        }}
      >
        {filteredRequests.map(request => (
          <div
            key={request.id}
            draggable
            onDragStart={(e) => handleDragStart(e, request.id)}
            className={`bg-gradient-to-br from-card/80 via-card/90 to-card/80 backdrop-blur-xl border border-border rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 cursor-move border-l-4 ${
              getPriorityColor(request.priority)
            } ${
              selectedRequests.has(request.id) ? 'ring-2 ring-primary/50 shadow-primary/20 shadow-2xl' : ''
            } ${
              draggedRequest === request.id ? 'opacity-50 scale-95 rotate-1' : 'hover:scale-105'
            }`}
            onClick={() => onRequestSelect(request.id)}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                  {request.title}
                </h4>
                <div className="flex items-center gap-2">
                  <WindowBadge
                    windowOpenAt={request.windowOpenAt}
                    windowCloseAt={request.windowCloseAt}
                    graceDays={request.graceDays}
                    size="sm"
                  />
                </div>
              </div>
              <button className="p-1 hover:bg-background/20 rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-foreground/60" />
              </button>
            </div>

            {/* Card Content */}
            <div className="space-y-2 text-xs text-foreground/70 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{request.club}</span>
              </div>

              {request.position && (
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  <span>{request.position}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(request.createdAt)}</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                {request.priority === 'URGENT' && (
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm border ${
                  request.priority === 'URGENT' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                  request.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-400/30' :
                  request.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-400/30' :
                  'bg-muted text-muted-foreground border-muted'
                }`}>
                  {request.priority}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-foreground/40" />
                <span className="text-xs text-foreground/50">
                  {formatDate(request.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="flex items-center justify-center h-64 text-foreground/60">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background/20 border border-border flex items-center justify-center">
              <Target className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium mb-2">No requests found</p>
            <p className="text-sm text-foreground/40">
              {activeFilter === 'ALL' ? 'No requests in your system yet' : `No requests with status "${STATUS_FILTERS.find(f => f.id === activeFilter)?.title}"`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}