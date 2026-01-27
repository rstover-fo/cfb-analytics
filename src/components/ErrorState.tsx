import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { ApiError } from '../services/api'

interface ErrorStateProps {
  error: Error | ApiError | null
  onRetry?: () => void
  context?: string
}

const ErrorState = ({ error, onRetry, context }: ErrorStateProps) => {
  if (!error) return null

  const isApiError = error instanceof ApiError
  const isRetryable = isApiError && error.retryable
  const isNetworkError = isApiError && error.code === 'NETWORK_ERROR'

  const Icon = isNetworkError ? WifiOff : AlertTriangle

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          isNetworkError
            ? 'bg-yellow-100 dark:bg-yellow-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          <Icon
            className={`w-8 h-8 ${
              isNetworkError
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isNetworkError ? 'Connection Issue' : 'Something went wrong'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {error.message}
          </p>
          {context && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              While loading: {context}
            </p>
          )}
        </div>

        {isRetryable && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-4 py-2 min-h-[44px] bg-cfb-primary dark:bg-cfb-accent text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        )}

        {!isRetryable && (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Try selecting different filters or check back later.
          </p>
        )}
      </div>
    </div>
  )
}

export default ErrorState
