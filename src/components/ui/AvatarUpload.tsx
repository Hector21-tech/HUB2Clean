'use client'

import { useState, useRef, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Upload, X, Loader2, Camera, User, ZoomIn, ZoomOut, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api-config'
import { invalidateAvatarCache, triggerAvatarCacheInvalidation } from '@/modules/players/hooks/useAvatarUrl'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onUploadComplete: (avatarPath: string) => void
  onUploadError: (error: string) => void
  tenantId: string
  playerId?: string
  playerName?: string
  disabled?: boolean
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc

  await new Promise((resolve) => {
    image.onload = resolve
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas is empty'))
        }
      },
      'image/jpeg',
      0.9
    )
  })
}

export function AvatarUpload({
  currentAvatarUrl,
  onUploadComplete,
  onUploadError,
  tenantId,
  playerId,
  playerName,
  disabled = false
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cropping state
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB (larger since we'll crop)

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed'
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }

    return null
  }

  // Handle crop complete
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Handle file selection - show cropper
  const handleFileSelect = useCallback((file: File) => {
    if (disabled) return

    const validationError = validateFile(file)
    if (validationError) {
      onUploadError(validationError)
      return
    }

    // Create URL for cropper
    const fileUrl = URL.createObjectURL(file)
    setImageToCrop(fileUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }, [disabled, onUploadError])

  // Cancel cropping
  const handleCancelCrop = useCallback(() => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    setImageToCrop(null)
    setCroppedAreaPixels(null)
  }, [imageToCrop])

  // Confirm crop and upload
  const handleConfirmCrop = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Get cropped image
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      setUploadProgress(30)

      // Create file from blob
      const croppedFile = new File([croppedBlob], 'avatar.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      // Show preview
      const previewBlobUrl = URL.createObjectURL(croppedBlob)
      setPreviewUrl(previewBlobUrl)
      setUploadProgress(50)

      // Upload
      const formData = new FormData()
      formData.append('file', croppedFile)
      formData.append('playerId', playerId || 'temp-' + Date.now())

      const response = await apiFetch(`/api/media/avatar-upload?tenant=${encodeURIComponent(tenantId)}`, {
        method: 'POST',
        body: formData
      })

      setUploadProgress(80)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', response.status, errorText)
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        // Cache invalidation
        if (playerId) {
          invalidateAvatarCache(result.data.avatarPath, tenantId)
        }
        triggerAvatarCacheInvalidation()

        onUploadComplete(result.data.avatarPath)
        setUploadProgress(100)

        // Clean up
        URL.revokeObjectURL(imageToCrop)
        setImageToCrop(null)
        setCroppedAreaPixels(null)
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError(error instanceof Error ? error.message : 'Upload failed')
      setPreviewUrl(currentAvatarUrl || null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [imageToCrop, croppedAreaPixels, playerId, tenantId, currentAvatarUrl, onUploadComplete, onUploadError])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Handle file input
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Remove avatar
  const handleRemoveAvatar = useCallback(() => {
    setPreviewUrl(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUploadComplete])

  // Render cropper modal
  if (imageToCrop) {
    return (
      <div className="space-y-4">
        <div className="text-center text-sm font-medium text-white mb-2">
          Drag to position, scroll to zoom
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-64 bg-black/50 rounded-lg overflow-hidden">
          <Cropper
            image={imageToCrop}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="w-4 h-4 text-white/60" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <ZoomIn className="w-4 h-4 text-white/60" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancelCrop}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleConfirmCrop}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={playerName ? `${playerName} avatar` : 'Avatar preview'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>

          {previewUrl && !disabled && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove avatar"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragging
            ? 'border-blue-400 bg-blue-500/20'
            : 'border-white/30 hover:border-white/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <div className="space-y-2">
              <p className="text-sm text-white/80">Uploading avatar...</p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-white/60">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="w-8 h-8 text-white/60 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/80">
                Drop an image here, or click to select
              </p>
              <p className="text-xs text-white/50">
                JPEG, PNG, WebP up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
