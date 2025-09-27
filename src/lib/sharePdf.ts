interface SharePDFOptions {
  html?: string
  url?: string
  fileName?: string
  title?: string
  playerData?: any
  aiImprovedNotes?: string | null
  tenantData?: {
    name?: string
    description?: string
  }
}

export async function generateAndSharePDF({
  html,
  url,
  fileName = 'document.pdf',
  title = 'PDF Document',
  playerData,
  aiImprovedNotes,
  tenantData
}: SharePDFOptions): Promise<void> {
  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), 25000)

  try {
    const response = await fetch('/api/generate-player-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url, fileName, playerData, aiImprovedNotes, tenantData }),
      cache: 'no-store',
      signal: ac.signal,
    })

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`)
    }

    const blob = await response.blob()
    const safeFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`

    // Always fallback to download since navigator.share requires user gesture
    // and we've lost the gesture context after async operations
    const href = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href,
      download: safeFileName,
      style: 'display: none'
    })
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('PDF generation timed out. Please try again.')
    }
    console.error('PDF share error:', error)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// For immediate sharing when user gesture is preserved
export async function shareGeneratedPDF(blob: Blob, fileName: string, title: string): Promise<void> {
  const safeFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`
  const file = new File([blob], safeFileName, { type: 'application/pdf' })

  // Try native share on mobile (only works in user gesture context)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title,
        files: [file]
      })
      return
    } catch (shareError) {
      // Fall back to download if sharing fails
      console.warn('Share failed, falling back to download:', shareError)
    }
  }

  // Fallback: download
  const href = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href,
    download: safeFileName,
    style: 'display: none'
  })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

// New function that preserves user gesture for mobile sharing
export async function generateAndSharePDFWithGesture({
  html,
  url,
  fileName = 'document.pdf',
  title = 'PDF Document',
  playerData,
  aiImprovedNotes,
  tenantData,
  onProgress
}: SharePDFOptions & { onProgress?: (stage: string) => void }): Promise<void> {
  const safeFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`

  // Check if we can share before starting generation
  const canShare = typeof navigator.share !== 'undefined' && isMobileDevice()

  // Debug logging for mobile share capability
  console.log('Mobile share debug:', {
    hasNavigatorShare: typeof navigator.share !== 'undefined',
    isMobile: isMobileDevice(),
    canShare,
    userAgent: navigator.userAgent
  })

  if (onProgress) onProgress('Generating PDF...')

  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), 25000)

  try {
    const response = await fetch('/api/generate-player-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url, fileName, playerData, aiImprovedNotes, tenantData }),
      cache: 'no-store',
      signal: ac.signal,
    })

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`)
    }

    if (onProgress) onProgress('Processing...')
    const blob = await response.blob()

    if (onProgress) onProgress('Sharing...')

    // Try to share immediately if possible (user gesture should still be active)
    if (canShare) {
      const file = new File([blob], safeFileName, { type: 'application/pdf' })

      console.log('Share attempt details:', {
        fileSize: blob.size,
        fileName: safeFileName,
        canShareFiles: navigator.canShare?.({ files: [file] }),
        navigatorShare: !!navigator.share
      })

      if (navigator.canShare?.({ files: [file] })) {
        try {
          console.log('Attempting native share...')
          await navigator.share({
            title,
            files: [file]
          })
          console.log('Native share successful!')
          return
        } catch (shareError) {
          console.warn('Share failed, falling back to download:', shareError)
          console.log('Share error details:', {
            errorName: shareError instanceof Error ? shareError.name : 'Unknown',
            errorMessage: shareError instanceof Error ? shareError.message : shareError
          })
        }
      } else {
        console.log('navigator.canShare returned false for file sharing')
      }
    } else {
      console.log('canShare is false, using download fallback')
    }

    // Fallback: download
    const href = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href,
      download: safeFileName,
      style: 'display: none'
    })
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('PDF generation timed out. Please try again.')
    }
    console.error('PDF share error:', error)
    throw error
  } finally {
    clearTimeout(timeout)
    if (onProgress) onProgress('')
  }
}

// Utility functions for mobile detection
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
}

export function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' &&
         'share' in navigator &&
         'canShare' in navigator
}