/**
 * Structured Logger
 *
 * Simple structured logging for the API. Outputs JSON in production,
 * human-readable in development.
 */
const isDev = process.env.NODE_ENV !== 'production'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }

  if (isDev) {
    const color = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', debug: '\x1b[90m' }[level]
    const reset = '\x1b[0m'
    const extra = data ? ` ${JSON.stringify(data)}` : ''
    console.log(`${color}[${level.toUpperCase()}]${reset} ${message}${extra}`)
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info:  (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn:  (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
}
