'use client'

import { useState } from 'react'
import { KanbanBoard, AdvancedFilters, WindowBadge } from '@/components/football'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock data for testing
const mockRequests = [
  {
    id: '1',
    title: 'Marcus Rashford - Manchester United',
    description: 'Talented striker looking for new challenges',
    club: 'Manchester United',
    position: 'ST',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    windowOpenAt: '2024-01-01',
    windowCloseAt: '2024-01-31',
    graceDays: 3
  },
  {
    id: '2',
    title: 'Pedri - FC Barcelona',
    description: 'Young midfielder with great potential',
    club: 'FC Barcelona',
    position: 'CM',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25',
    windowOpenAt: '2024-01-01',
    windowCloseAt: '2024-02-15',
    graceDays: 5
  },
  {
    id: '3',
    title: 'Erling Haaland - Manchester City',
    description: 'Goal machine striker',
    club: 'Manchester City',
    position: 'ST',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-22',
    windowOpenAt: null,
    windowCloseAt: null,
    graceDays: 3
  }
]

const initialFilters = {
  search: '',
  status: [] as string[],
  priority: [] as string[],
  positions: [] as string[],
  clubs: [] as string[],
  countries: [] as string[],
  dateRange: { from: '', to: '' },
  windowStatus: [] as string[]
}

export default function DemoPage() {
  const [requests, setRequests] = useState(mockRequests)
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(initialFilters)

  const handleRequestUpdate = (requestId: string, newStatus: string) => {
    setRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } : req
    ))
  }

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(requestId)) {
        newSet.delete(requestId)
      } else {
        newSet.add(requestId)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Scout Hub Components Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            Testing the migrated football components from HUB2-Innankaos
          </p>
        </div>

        {/* Window Badge Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Window Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <WindowBadge
                windowOpenAt="2024-01-01"
                windowCloseAt="2024-01-31"
                size="sm"
              />
              <WindowBadge
                windowOpenAt="2024-02-01"
                windowCloseAt="2024-02-28"
                size="md"
              />
              <WindowBadge
                windowOpenAt="2024-06-01"
                windowCloseAt="2024-08-31"
                size="lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            onClick={() => setShowFilters(true)}
            variant="outline"
          >
            Open Advanced Filters
          </Button>
          <Button
            onClick={() => setSelectedRequests(new Set())}
            variant="outline"
          >
            Clear Selection ({selectedRequests.size})
          </Button>
        </div>

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <CardTitle>Football Transfer Kanban Board</CardTitle>
          </CardHeader>
          <CardContent>
            <KanbanBoard
              requests={requests}
              onRequestUpdate={handleRequestUpdate}
              onRequestSelect={handleRequestSelect}
              selectedRequests={selectedRequests}
            />
          </CardContent>
        </Card>

        {/* Advanced Filters Modal */}
        {showFilters && (
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
            availableClubs={['Manchester United', 'FC Barcelona', 'Manchester City']}
            availableCountries={['England', 'Spain', 'Norway']}
          />
        )}
      </div>
    </div>
  )
}