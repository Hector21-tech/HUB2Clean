'use client'

// Placeholder for AddTrialModal - this will be replaced during trials module migration
interface AddTrialModalProps {
  isOpen: boolean
  onClose: () => void
  onTrialAdded?: () => void
  tenantId?: string
  playerId?: string
  preSelectedPlayerId?: string
}

export function AddTrialModal({
  isOpen: _isOpen,
  onClose: _onClose,
  onTrialAdded: _onTrialAdded,
  tenantId: _tenantId,
  playerId: _playerId,
  preSelectedPlayerId: _preSelectedPlayerId
}: AddTrialModalProps) {
  // Placeholder implementation - returns null
  // This component will be properly implemented when we migrate the trials module
  return null
}

export default AddTrialModal