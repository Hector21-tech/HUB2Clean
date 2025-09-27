'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, Camera, User } from 'lucide-react'
import { apiFetch } from '@/lib/api-config'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onUploadComplete: (avatarPath: string) => void
  onUploadError: (error: string) => void
  tenantId: string
  playerId?: string
  playerName?: string
  disabled?: boolean
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

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed'
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    return null
  }

  // Compress image if needed
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 800px on any side)
        const maxSize = 800
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          0.8 // 80% quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (disabled) return

    const validationError = validateFile(file)
    if (validationError) {
      onUploadError(validationError)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Show preview immediately
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)

      // Compress image
      const compressedFile = await compressImage(file)

      // NEW: Direct upload using apiFetch with CSRF protection
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('playerId', playerId || 'temp-' + Date.now())

      // Use apiFetch for CSRF token handling (tenantId is actually tenant slug)
      const response = await apiFetch(`/api/media/avatar-upload?tenant=${encodeURIComponent(tenantId)}`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', response.status, errorText)
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        onUploadComplete(result.path)
        setUploadProgress(100)
        setIsUploading(false)
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError(error instanceof Error ? error.message : 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
      setPreviewUrl(currentAvatarUrl || null)
    }
  }, [disabled, tenantId, playerId, currentAvatarUrl, compressImage, onUploadComplete, onUploadError])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

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
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  // Remove avatar
  const handleRemoveAvatar = useCallback(() => {
    setPreviewUrl(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUploadComplete])

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
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-gray-300 hover:border-gray-400'
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
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading avatar...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                Drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}