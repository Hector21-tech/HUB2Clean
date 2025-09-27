/**
 * Structured logging utility for Scout Hub 2
 * Provides consistent logging format across all API endpoints
 * 🛡️ Enterprise Security: Request correlation for troubleshooting
 */

export interface LogContext {
  requestId?: string
  tenant?: string
  userId?: string
  path: string
  method: string
  status: number
  duration?: number
  error?: string
  details?: Record<string, any>
}

/**
 * Generate a unique request ID for correlation across logs
 * Format: timestamp_random for sortability and uniqueness
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `req_${timestamp}_${random}`
}

export class Logger {
  private static formatMessage(level: string, message: string, context: LogContext): string {
    const timestamp = new Date().toISOString()
    const { requestId, tenant, userId, path, method, status, duration, error, details } = context

    const logData = {
      timestamp,
      level,
      message,
      requestId: requestId || 'unknown',
      tenant: tenant || 'unknown',
      userId: userId || 'anonymous',
      path,
      method,
      status,
      ...(duration && { duration: `${duration}ms` }),
      ...(error && { error }),
      ...(details && { details })
    }

    return JSON.stringify(logData)
  }

  static info(message: string, context: LogContext): void {
    console.log(this.formatMessage('INFO', message, context))
  }

  static warn(message: string, context: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context))
  }

  static error(message: string, context: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context))
  }

  static success(message: string, context: LogContext): void {
    console.log(this.formatMessage('SUCCESS', message, context))
  }

  // 🛡️ ENTERPRISE SECURITY: Special logging for security events
  static security(message: string, context: LogContext): void {
    console.warn(this.formatMessage('SECURITY', message, context))
  }

  // Helper to time API operations
  static timer() {
    const start = Date.now()
    return {
      end: () => Date.now() - start
    }
  }
}

// Helper function to extract basic context from NextRequest with request correlation
export function createLogContext(
  request: Request,
  tenant?: string,
  userId?: string,
  requestId?: string
): Omit<LogContext, 'status'> {
  const url = new URL(request.url)
  return {
    requestId: requestId || generateRequestId(),
    tenant,
    userId,
    path: url.pathname,
    method: request.method
  }
}