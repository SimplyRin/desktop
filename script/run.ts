import { join } from 'path'
import { spawn, SpawnOptions } from 'child_process'
import * as Fs from 'fs'
import { getDistPath, getExecutableName } from './dist-info'

const distPath = getDistPath()
const productName = getExecutableName()

let binaryPath = ''
if (process.platform === 'darwin') {
  binaryPath = join(
    distPath,
    `${productName}.app`,
    'Contents',
    'MacOS',
    `${productName}`
  )
} else if (process.platform === 'win32') {
  binaryPath = join(distPath, `${productName}.exe`)
} else if (process.platform === 'linux') {
  binaryPath = join(distPath, productName)
} else {
  console.error(`I dunno how to run on ${process.platform} ${process.arch} :(`)
  process.exit(1)
}

export function run(spawnOptions: SpawnOptions) {
  try {
    // eslint-disable-next-line no-sync
    const stats = Fs.statSync(binaryPath)
    if (!stats.isFile()) {
      return null
    }
  } catch (e) {
    return null
  }

  const opts = Object.assign({}, spawnOptions)

  opts.env = Object.assign(opts.env || {}, process.env, {
    NODE_ENV: 'development',
  })

  // Support debugging the Electron main process by setting ELECTRON_INSPECT.
  //  ELECTRON_INSPECT=1 -> uses default 9229
  //  ELECTRON_INSPECT=<port> -> uses specified port
  const extraArgs: string[] = []
  const inspect = process.env.ELECTRON_INSPECT
  if (inspect) {
    const port = inspect === '1' || inspect === '' ? '9229' : inspect
    extraArgs.push(`--inspect=${port}`)
  }

  return spawn(binaryPath, extraArgs, opts)
}
