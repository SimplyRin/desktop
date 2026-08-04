import * as path from 'path'

import { Arch, Platform, build } from 'app-builder-lib'

import { getDistPath } from './dist-info'

/**
 * Build the Linux packages from the app electron-packager already produced.
 *
 * This drives app-builder-lib, the library electron-builder's CLI is a thin
 * wrapper around, rather than spawning the CLI itself. The CLI loads yargs,
 * and yarn regularly leaves us with a tree where yargs' `string-width` is
 * missing (it collides with the `string-width-cjs` npm alias), which made
 * packaging fail before electron-builder ever looked at our config.
 */
export async function packageElectronBuilder(): Promise<Array<string>> {
  const distPath = getDistPath()
  const projectDir = path.resolve(__dirname, '..')
  const configPath = path.resolve(__dirname, 'electron-builder-linux.yml')

  console.log(`Building deb and rpm (x64) from ${distPath}…`)

  const artifacts = await build({
    targets: Platform.LINUX.createTarget(['deb', 'rpm'], Arch.x64),
    prepackaged: distPath,
    projectDir,
    config: configPath,
    publish: 'never',
  })

  const packages = artifacts.filter(
    f => f.endsWith('.deb') || f.endsWith('.rpm')
  )

  if (packages.length === 0) {
    throw new Error(
      `electron-builder produced no deb or rpm packages, only: ${
        artifacts.join(', ') || '(nothing)'
      }`
    )
  }

  console.log(`Successfully built ${packages.length} package(s):`)
  packages.forEach(file => console.log(`  - ${file}`))

  return packages
}
