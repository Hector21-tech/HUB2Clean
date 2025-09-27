'use client'

import { useState } from 'react'
import {
  Inbox,
  BarChart3,
  List,
  Calendar,
  Archive,
  Clock,
  AlertTriangle,
  CalendarDays,
  XCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Settings
} from 'lucide-react'

export type SavedView =
  | 'inbox'
  | 'board'
  | 'list'
  | 'calendar'
  | 'archive'
  | 'open-now'
  | 'closes-soon'
  | 'opens-soon'
  | 'expired'

interface SavedViewsSidebarProps {
  activeView: SavedView
  onViewChange: (view: SavedView) => void
  requestCounts: {
    total: number
    inbox: number
    openNow: number
    closesSoon: number
    opensSoon: number
    expired: number
    archived: number
  }
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const MAIN_VIEWS = [
  {
    id: 'inbox' as SavedView,
    label: 'Inbox',
    icon: Inbox,
    description: 'All active requests',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-400/30'
  },
  {
    id: 'board' as SavedView,
    label: 'Board (CRM)',
    icon: BarChart3,
    description: 'Priority swimlanes view',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-400/30'
  },
  {
    id: 'list' as SavedView,
    label: 'List',
    icon: List,
    description: 'Detailed list view',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-400/30'
  },
  {
    id: 'calendar' as SavedView,
    label: 'Calendar',
    icon: Calendar,
    description: 'Timeline view',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-400/30'
  },
  {
    id: 'archive' as SavedView,
    label: 'Archive',
    icon: Archive,
    description: 'Completed requests',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-400/30'
  }
]

const SMART_VIEWS = [
  {
    id: 'open-now' as SavedView,
    label: 'Open now',
    icon: Clock,
    description: 'Transfer window is open',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-400/30',
    countKey: 'openNow' as keyof SavedViewsSidebarProps['requestCounts']
  },
  {
    id: 'closes-soon' as SavedView,
    label: 'Closes ≤7d',
    icon: AlertTriangle,
    description: 'Window closing within 7 days',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-400/30',
    countKey: 'closesSoon' as keyof SavedViewsSidebarProps['requestCounts']
  },
  {
    id: 'opens-soon' as SavedView,
    label: 'Soon ≤30d',
    icon: CalendarDays,
    description: 'Window opening within 30 days',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-400/30',
    countKey: 'opensSoon' as keyof SavedViewsSidebarProps['requestCounts']
  },
  {
    id: 'expired' as SavedView,
    label: 'Expired',
    icon: XCircle,
    description: 'Window has closed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-400/30',
    countKey: 'expired' as keyof SavedViewsSidebarProps['requestCounts']
  }
]

export function SavedViewsSidebar({
  activeView,
  onViewChange,
  requestCounts,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}: SavedViewsSidebarProps) {
  const [showSmartViews, setShowSmartViews] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const getCountForView = (viewId: SavedView) => {
    switch (viewId) {
      case 'inbox':
        return requestCounts.inbox
      case 'archive':
        return requestCounts.archived
      case 'open-now':
        return requestCounts.openNow
      case 'closes-soon':
        return requestCounts.closesSoon
      case 'opens-soon':
        return requestCounts.opensSoon
      case 'expired':
        return requestCounts.expired
      default:
        return requestCounts.total
    }
  }

  const renderViewItem = (view: typeof MAIN_VIEWS[0] | typeof SMART_VIEWS[0], count?: number) => {
    const isActive = activeView === view.id
    const itemCount = count ?? getCountForView(view.id)
    const Icon = view.icon

    return (
      <button
        key={view.id}
        onClick={() => onViewChange(view.id)}
        className={`w-full group transition-all duration-200 ${
          isActive
            ? `${view.bgColor} shadow-lg`
            : 'hover:bg-white/5'
        }`}
        title={view.description}
      >
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <Icon className={`w-5 h-5 flex-shrink-0 ${
            isActive ? view.color : 'text-white/60 group-hover:text-white/80'
          }`} />

          {!isCollapsed && (
            <>
              <span className={`font-medium flex-1 text-left ${
                isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
              }`}>
                {view.label}
              </span>

              {itemCount > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/60 group-hover:bg-white/15 group-hover:text-white/80'
                }`}>
                  {itemCount}
                </span>
              )}
            </>
          )}
        </div>
      </button>
    )
  }

  if (isCollapsed) {
    return (
      <div className={`bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40 backdrop-blur-xl border-r border-white/10 ${className}`}>
        <div className="p-3 space-y-2">
          {MAIN_VIEWS.map(view => renderViewItem(view))}
          <div className="border-t border-white/10 pt-2 mt-2">
            {SMART_VIEWS.map(view => renderViewItem(view))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40 backdrop-blur-xl border-r border-white/10 ${className}`}>
      <div className="p-4 space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Saved Views</h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Collapse sidebar"
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Main Views */}
        <div className="space-y-1">
          {MAIN_VIEWS.map(view => renderViewItem(view))}
        </div>

        {/* Smart Views Section */}
        <div className="pt-4">
          <button
            onClick={() => setShowSmartViews(!showSmartViews)}
            className="flex items-center gap-2 w-full p-2 hover:bg-white/5 rounded-lg transition-colors group"
          >
            {showSmartViews ? (
              <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white/80" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/80" />
            )}
            <span className="text-sm font-medium text-white/70 group-hover:text-white/90">
              Smart Views
            </span>
          </button>

          {showSmartViews && (
            <div className="space-y-1 mt-2">
              {SMART_VIEWS.map(view => renderViewItem(view))}
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="pt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 w-full p-2 hover:bg-white/5 rounded-lg transition-colors group"
          >
            {showFilters ? (
              <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white/80" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/80" />
            )}
            <Filter className="w-4 h-4 text-white/60 group-hover:text-white/80" />
            <span className="text-sm font-medium text-white/70 group-hover:text-white/90 flex-1 text-left">
              Filters
            </span>
            <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-white/60" />
          </button>

          {showFilters && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/60 mb-2">Quick access to filters</p>
              <div className="space-y-2">
                <button className="flex items-center gap-2 w-full p-2 text-xs text-white/70 hover:text-white/90 hover:bg-white/5 rounded transition-colors">
                  <Settings className="w-3 h-3" />
                  Advanced Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <div className="text-xs text-white/50 space-y-1">
            <div className="flex justify-between">
              <span>Total Requests</span>
              <span className="font-medium text-white/70">{requestCounts.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Active</span>
              <span className="font-medium text-white/70">{requestCounts.inbox}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}