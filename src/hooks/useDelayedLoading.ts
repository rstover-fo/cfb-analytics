import { useState, useEffect, useRef } from 'react'

/**
 * Delays showing loading state to prevent flash for fast operations.
 * Per Vercel guidelines: avoid showing loading indicators for operations
 * that complete quickly (< 150-200ms).
 *
 * @param isLoading - The actual loading state
 * @param delay - Delay before showing loading (default: 150ms)
 * @param minDuration - Minimum time to show loading once shown (default: 300ms)
 * @returns Delayed loading state that won't flash for quick operations
 */
export function useDelayedLoading(
  isLoading: boolean,
  delay: number = 150,
  minDuration: number = 300
): boolean {
  const [showLoading, setShowLoading] = useState(false)
  const loadingStartTime = useRef<number | null>(null)
  const delayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minDurationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      // Start delay timer before showing loading
      delayTimeout.current = setTimeout(() => {
        loadingStartTime.current = Date.now()
        setShowLoading(true)
      }, delay)
    } else {
      // Clear delay timer if loading finishes before delay
      if (delayTimeout.current) {
        clearTimeout(delayTimeout.current)
        delayTimeout.current = null
      }

      // If loading was shown, ensure minimum duration
      if (showLoading && loadingStartTime.current) {
        const elapsed = Date.now() - loadingStartTime.current
        const remaining = minDuration - elapsed

        if (remaining > 0) {
          minDurationTimeout.current = setTimeout(() => {
            setShowLoading(false)
            loadingStartTime.current = null
          }, remaining)
        } else {
          setShowLoading(false)
          loadingStartTime.current = null
        }
      }
    }

    return () => {
      if (delayTimeout.current) {
        clearTimeout(delayTimeout.current)
      }
      if (minDurationTimeout.current) {
        clearTimeout(minDurationTimeout.current)
      }
    }
  }, [isLoading, delay, minDuration, showLoading])

  return showLoading
}

export default useDelayedLoading
