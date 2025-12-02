'use client'

import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useTrialsQuery } from '../hooks/useTrialsQuery'
import { useDeleteTrial } from '../hooks/useTrialMutations'
import { TrialsHeader } from './TrialsHeader'
import { TrialCard } from './TrialCard'
import { TrialListItem } from './TrialListItem'
import { AddTrialModal } from './AddTrialModal'
import { TrialDetailDrawer } from './TrialDetailDrawer'
import { EvaluateTrialModal } from './EvaluateTrialModal'
import { TrialStatusBadge } from './TrialStatusBadge'
import { Trial, TrialFilters } from '../types/trial'
import { useTenantSlug } from '@/lib/hooks/useTenantSlug'

export function TrialsPage() {
  const { tenantId } = useTenantSlug()

  // UI State - MUST be declared before any early returns to follow Rules of Hooks
  const [filters, setFilters] = useState<TrialFilters>({})
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showTrialDetail, setShowTrialDetail] = useState(false)
  const [detailTrial, setDetailTrial] = useState<Trial | null>(null)
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [evaluateTrial, setEvaluateTrial] = useState<Trial | null>(null)

  // Fetch all trials (for counts) and filtered trials
  const { data: allTrials = [] } = useTrialsQuery(tenantId, {}) // No filters for counts
  const { data: trials = [], isLoading, error } = useTrialsQuery(tenantId, filters)
  const deleteTrial = useDeleteTrial(tenantId)

  // Calculate stats and group trials - MUST be declared before any early returns to follow Rules of Hooks
  const { stats, groupedTrials } = useMemo(() => {
    const now = new Date()

    // Calculate stats
    const stats = {
      total: trials.length,
      upcoming: trials.filter(t =>
        t.status === 'SCHEDULED' && new Date(t.scheduledAt) > now
      ).length,
      completed: trials.filter(t => t.status === 'COMPLETED').length,
      pendingEvaluation: trials.filter(t =>
        t.status === 'COMPLETED' && !t.rating
      ).length
    }

    // Group trials by active vs completed
    const activeTrials = trials.filter(t =>
      t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS'
    ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

    const completedTrials = trials.filter(t =>
      t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'NO_SHOW'
    ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()) // Most recent first

    return {
      stats,
      groupedTrials: {
        active: activeTrials,
        completed: completedTrials
      }
    }
  }, [trials])

  // Show loading if tenantId is not yet available - AFTER all hooks
  if (!tenantId) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }


  const handleAddTrial = () => {
    setShowAddModal(true)
  }

  const handleEditTrial = (trial: Trial) => {
    setSelectedTrial(trial)
    setShowAddModal(true)
  }

  const handleDeleteTrial = (trial: Trial) => {
    setShowDeleteConfirm(trial.id)
  }

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return

    try {
      await deleteTrial.mutateAsync(showDeleteConfirm)
      setShowDeleteConfirm(null)
      toast.success('Trial deleted!')
    } catch (error) {
      console.error('Failed to delete trial:', error)
      toast.error('Failed to delete trial')
    }
  }

  const handleEvaluateTrial = (trial: Trial) => {
    setEvaluateTrial(trial)
    setShowEvaluateModal(true)
  }

  const handleTrialClick = (trial: Trial) => {
    setDetailTrial(trial)
    setShowTrialDetail(true)
  }

  if (error) {
    return (
      <div className="min-h-screen relative p-6">

        <div className="max-w-7xl mx-auto relative">
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="text-red-300 font-medium">Error loading trials</h3>
            <p className="text-red-200 text-sm mt-1">
              There was a problem loading the trials. Please try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">

      <div className="relative p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        <TrialsHeader
          onAddTrial={handleAddTrial}
          onFiltersChange={setFilters}
          trialsCount={stats.total}
          upcomingCount={stats.upcoming}
          completedCount={stats.completed}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          allTrials={allTrials}
        />

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-white/20 rounded w-24" />
                        <div className="h-3 bg-white/20 rounded w-16" />
                      </div>
                    </div>
                    <div className="h-6 bg-white/20 rounded-full w-20" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/20 rounded w-full" />
                    <div className="h-4 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trials Content */}
          {!isLoading && trials.length > 0 && (
            viewMode === 'grid' ? (
              <div className="space-y-8">
                {/* Active Trials */}
                {groupedTrials.active.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Active Trials ({groupedTrials.active.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedTrials.active.map((trial) => (
                        <TrialCard
                          key={trial.id}
                          trial={trial}
                          onEdit={handleEditTrial}
                          onDelete={handleDeleteTrial}
                          onEvaluate={handleEvaluateTrial}
                          onClick={handleTrialClick}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Trials */}
                {groupedTrials.completed.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Completed ({groupedTrials.completed.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedTrials.completed.map((trial) => (
                        <TrialCard
                          key={trial.id}
                          trial={trial}
                          onEdit={handleEditTrial}
                          onDelete={handleDeleteTrial}
                          onEvaluate={handleEvaluateTrial}
                          onClick={handleTrialClick}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="space-y-8">
                {/* Active Trials */}
                {groupedTrials.active.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Active Trials ({groupedTrials.active.length})
                    </h3>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                      {/* Desktop List Header */}
                      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-white/10 backdrop-blur-md border-b border-white/20 text-sm font-medium text-white/60">
                        <div className="col-span-2">Player</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-2">Location</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Club</div>
                        <div className="col-span-2">Actions</div>
                      </div>

                      {/* List Items */}
                      <div className="divide-y divide-white/20">
                        {groupedTrials.active.map((trial) => (
                          <TrialListItem
                            key={trial.id}
                            trial={trial}
                            onEdit={handleEditTrial}
                            onDelete={handleDeleteTrial}
                            onClick={handleTrialClick}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed Trials */}
                {groupedTrials.completed.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Completed ({groupedTrials.completed.length})
                    </h3>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                      {/* Desktop List Header */}
                      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-white/10 backdrop-blur-md border-b border-white/20 text-sm font-medium text-white/60">
                        <div className="col-span-2">Player</div>
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-2">Location</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Club</div>
                        <div className="col-span-2">Actions</div>
                      </div>

                      {/* List Items */}
                      <div className="divide-y divide-white/20">
                        {groupedTrials.completed.map((trial) => (
                          <TrialListItem
                            key={trial.id}
                            trial={trial}
                            onEdit={handleEditTrial}
                            onDelete={handleDeleteTrial}
                            onClick={handleTrialClick}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Empty State */}
          {!isLoading && trials.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No trials found
                </h3>
                <p className="text-white/70 mb-6">
                  {Object.keys(filters).length > 0
                    ? 'No trials match your current filters. Try adjusting your search criteria.'
                    : 'Get started by scheduling your first trial session with a player.'
                  }
                </p>
                <button
                  onClick={handleAddTrial}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                >
                  Schedule Trial
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full p-6 border border-white/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium text-white mb-2">
              Delete Trial
            </h3>
            <p className="text-white/70 mb-6">
              Are you sure you want to delete this trial? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTrial.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg"
              >
                {deleteTrial.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Trial Modal */}
      {showAddModal && (
        <AddTrialModal
          isOpen={showAddModal}
          trial={selectedTrial}
          onClose={() => {
            setShowAddModal(false)
            setSelectedTrial(null)
          }}
        />
      )}

      {/* Trial Detail Drawer */}
      <TrialDetailDrawer
        trial={detailTrial}
        isOpen={showTrialDetail}
        onClose={() => {
          setShowTrialDetail(false)
          setDetailTrial(null)
        }}
        onEdit={(trial) => {
          setShowTrialDetail(false)
          setDetailTrial(null)
          handleEditTrial(trial)
        }}
        onDelete={(trial) => {
          setShowTrialDetail(false)
          setDetailTrial(null)
          handleDeleteTrial(trial)
        }}
        onEvaluate={(trial) => {
          setShowTrialDetail(false)
          setDetailTrial(null)
          handleEvaluateTrial(trial)
        }}
      />

      {/* Evaluate Trial Modal */}
      <EvaluateTrialModal
        trial={evaluateTrial}
        isOpen={showEvaluateModal}
        onClose={() => {
          setShowEvaluateModal(false)
          setEvaluateTrial(null)
        }}
      />
    </div>
  )
}