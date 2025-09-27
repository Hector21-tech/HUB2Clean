'use client'

import { useState } from 'react'
import { Building2, Target, Calendar, Clock, AlertTriangle, MoreVertical, Plus } from 'lucide-react'
import { WindowBadge } from './WindowBadge'

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

interface BoardColumnProps {
  columnId: string
  title: string
  requests: Request[]
  onRequestUpdate: (requestId: string, newStatus: string) => void
  onRequestSelect: (requestId: string) => void
  selectedRequests: Set<string>
  isDragOver?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  maxHeight?: string
  className?: string
}

export function BoardColumn({
  columnId,
  title,
  requests,
  onRequestUpdate,
  onRequestSelect,
  selectedRequests,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  maxHeight = 'h-64',
  className = ''
}: BoardColumnProps) {
  const [draggedRequest, setDraggedRequest] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    setDraggedRequest(requestId)
    e.dataTransfer.effectAllowed = 'move'

    // Find the request to get its current priority
    const request = requests.find(r => r.id === requestId)
    const sourcePriority = request?.priority || 'MEDIUM'

    const dragData = {
      requestId,
      sourceColumn: columnId,
      sourcePriority
    }

    console.log('BoardColumn - handleDragStart:', dragData)
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
  }

  const handleDragEnd = () => {
    setDraggedRequest(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'border-l-red-500/60 bg-red-500/5'
      case 'high': return 'border-l-orange-500/60 bg-orange-500/5'
      case 'medium': return 'border-l-blue-500/60 bg-blue-500/5'
      case 'low': return 'border-l-gray-500/60 bg-gray-500/5'
      default: return 'border-l-gray-500/60 bg-gray-500/5'
    }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <span className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full">
            {requests.length}
          </span>
        </div>
        <button className="p-1 hover:bg-white/10 rounded transition-colors">
          <Plus className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        className={`flex-1 p-2 transition-all duration-200 ${maxHeight} overflow-y-auto ${
          isDragOver ? 'bg-blue-500/10 border-blue-400/30' : ''
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Request Cards */}
        <div className="space-y-2">
          {requests.map(request => (
            <div
              key={request.id}
              draggable
              onDragStart={(e) => handleDragStart(e, request.id)}
              onDragEnd={handleDragEnd}
              className={`bg-gradient-to-br from-white/5 via-white/3 to-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-move border-l-4 group ${
                getPriorityColor(request.priority)
              } ${
                selectedRequests.has(request.id) ? 'ring-1 ring-blue-400/50 shadow-blue-500/20 shadow-lg' : ''
              } ${
                draggedRequest === request.id ? 'opacity-50 scale-95 rotate-1' : 'hover:scale-[1.02]'
              }`}
              onClick={() => onRequestSelect(request.id)}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white text-xs line-clamp-2 pr-2 group-hover:text-blue-200 transition-colors">
                  {request.title}
                </h4>
                <button className="p-0.5 hover:bg-white/20 rounded transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-3 h-3 text-white/60" />
                </button>
              </div>

              {/* Window Badge */}
              {(request.windowOpenAt || request.windowCloseAt) && (
                <div className="mb-2">
                  <WindowBadge
                    windowOpenAt={request.windowOpenAt}
                    windowCloseAt={request.windowCloseAt}
                    graceDays={request.graceDays}
                    size="sm"
                  />
                </div>
              )}

              {/* Card Content */}
              <div className="space-y-1 text-xs text-white/60 mb-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{request.club}</span>
                </div>

                {request.position && (
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 flex-shrink-0" />
                    <span>{request.position}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-1">
                  {request.priority === 'URGENT' && (
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded backdrop-blur-sm ${
                    request.priority === 'URGENT' ? 'bg-red-500/20 text-red-300' :
                    request.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                    request.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {request.priority}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">
                    {formatDate(request.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {requests.length === 0 && (
            <div className="flex items-center justify-center h-24 text-white/40 border-2 border-dashed border-white/10 rounded-lg">
              <div className="text-center">
                <div className="text-2xl mb-1">📋</div>
                <p className="text-xs">No requests</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}