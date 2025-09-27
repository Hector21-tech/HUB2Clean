'use client'

import { useMemo } from 'react'
import { Player } from '../types/player'
import { AlertTriangle, Calendar, Users } from 'lucide-react'
import { isContractExpiring, formatDate } from '@/lib/formatters'

interface ContractExpiryWidgetProps {
  players: Player[]
  onPlayerSelect: (player: Player) => void
}

export function ContractExpiryWidget({ players, onPlayerSelect }: ContractExpiryWidgetProps) {
  // Filter players with contracts expiring within 6 months
  const expiringPlayers = useMemo(() => {
    return players
      .filter(player => player.contractExpiry && isContractExpiring(player.contractExpiry))
      .sort((a, b) => {
        // Sort by contract expiry date (soonest first)
        if (!a.contractExpiry || !b.contractExpiry) return 0
        return new Date(a.contractExpiry).getTime() - new Date(b.contractExpiry).getTime()
      })
      .slice(0, 5) // Show only top 5 most urgent
  }, [players])

  if (expiringPlayers.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Contract Status</h3>
            <p className="text-sm text-white/60">All contracts are secure</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-center">
          <div className="text-green-400">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              ✓
            </div>
            <p className="text-sm text-white/70">No contracts expiring soon</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Contracts Expiring Soon</h3>
          <p className="text-sm text-white/60">{expiringPlayers.length} players need attention</p>
        </div>
      </div>

      <div className="space-y-3">
        {expiringPlayers.map((player) => {
          const daysUntilExpiry = player.contractExpiry
            ? Math.ceil((new Date(player.contractExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 0

          const urgencyColor = daysUntilExpiry <= 30
            ? 'text-red-400 bg-red-500/20'
            : daysUntilExpiry <= 90
              ? 'text-orange-400 bg-orange-500/20'
              : 'text-yellow-400 bg-yellow-500/20'

          return (
            <div
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-full flex items-center justify-center overflow-hidden">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white text-sm" translate="no" lang="en">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-xs text-white/60">
                    {player.club} • {formatDate(player.contractExpiry)}
                  </p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyColor}`}>
                {daysUntilExpiry}d
              </div>
            </div>
          )
        })}
      </div>

      {expiringPlayers.length === 5 && players.filter(p => p.contractExpiry && isContractExpiring(p.contractExpiry)).length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            View all {players.filter(p => p.contractExpiry && isContractExpiring(p.contractExpiry)).length} expiring contracts →
          </button>
        </div>
      )}
    </div>
  )
}