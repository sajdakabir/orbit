import { app } from 'electron'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

let stage = process.env.ORBIT_ENV || import.meta.env.VITE_ORBIT_ENV
if (!stage && import.meta.env.DEV) {
  stage = 'local'
}
if (!stage) {
  throw new Error(' ORBIT_ENV or VITE_ORBIT_ENV must be set to dev or prod')
}

const userDataDir = path.join(app.getPath('appData'), `Orbit-${stage}`)
app.setPath('userData', userDataDir)

if (stage !== 'prod') {
  app.setName(`Orbit (${stage})`)
}

export const ORBIT_ENV = stage
