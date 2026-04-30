import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import fs from 'fs'

// En desarrollo, esto estará en /apps/api. Queremos guardar en la raíz /appLogs
const logsDir = path.resolve(process.cwd(), '../../appLogs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Custom format para simular el ThingWorx Stream
const auditFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    severity: level,
    ...metadata,
    message,
  })
})

const isDev = process.env.NODE_ENV !== 'production'
const enableLogs = process.env.ENABLE_LOGS === 'true'

const transportsList: winston.transport[] = [
  // Transporte de Consola siempre activo
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
]

if (enableLogs) {
  // Solo activar escritura a disco si pasaron la flag --logs
  transportsList.push(
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'audit-%DATE%.log', 
      datePattern: 'YYYY-MM-DD',    
      zippedArchive: true,          
      maxSize: '20m',               
      maxFiles: '3d',               
    })
  )
}

// El logger principal exportado
export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    auditFormat
  ),
  transports: transportsList
})

// Tipos para Auditoría
export type LogCategory = 'Application Log' | 'Communication Log' | 'Config Log' | 'Script Log' | 'Security Log'
export type LogSourceType = 'System' | 'Super Admin' | 'Operador' | 'Residente'

// Función específica para la Consola de Auditoría Avanzada
export const auditLog = (
  category: LogCategory,
  action: string,
  sourceType: LogSourceType,
  sourceName: string,
  description: string,
  metadata?: Record<string, unknown>
) => {
  // Enmascarar datos sensibles
  const safeMetadata = { ...metadata }
  if (safeMetadata.password) safeMetadata.password = '***'
  if (safeMetadata.token) safeMetadata.token = '***'

  logger.info(description, {
    category,
    action,
    sourceType,
    sourceName,
    payload: safeMetadata
  })
}
