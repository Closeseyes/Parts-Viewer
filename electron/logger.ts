import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const ensureDir = (dir: string) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch {}
}

const getLogPath = () => {
  const userDir = app.getPath('userData')
  ensureDir(userDir)
  return path.join(userDir, 'parts-viewer.log')
}

const write = (level: 'INFO' | 'ERROR', msg: string) => {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`
  try {
    fs.appendFileSync(getLogPath(), line)
  } catch {}
}

export const log = (msg: string) => write('INFO', msg)
export const error = (msg: string) => write('ERROR', msg)
export const logFilePath = () => getLogPath()
