/* eslint-disable no-sync */

import * as cp from 'child_process'
import * as path from 'path'
import * as electronInstaller from 'electron-winstaller'
import { getProductName, getCompanyName } from '../app/package-info'
import {
  getDistPath,
  getOSXZipPath,
  getWindowsIdentifierName,
  getWindowsStandaloneName,
  getWindowsInstallerName,
  shouldMakeDelta,
  getUpdatesURL,
  isPublishable,
  getBundleSizes,
  getDistRoot,
  getDistArchitecture,
  getIconDirectory,
  getLinuxArchivePath,
  getLinuxDebPath,
} from './dist-info'
import { isGitHubActions } from './build-platforms'
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs'
import { getVersion } from '../app/package-info'
import { computeBundleHashSync } from '../app/src/lib/compute-bundle-hash'
import { rename } from 'fs/promises'
import { join } from 'path'
import { assertNonNullable } from '../app/src/lib/fatal-error'

const distPath = getDistPath()
const productName = getProductName()
const outputDir = getDistRoot()

const assertExistsSync = (path: string) => {
  if (!existsSync(path)) {
    throw new Error(`Expected ${path} to exist`)
  }
}

if (process.platform === 'darwin') {
  packageOSX()
} else if (process.platform === 'win32') {
  packageWindows()
} else if (process.platform === 'linux') {
  packageLinux()
} else {
  console.error(`I don't know how to package for ${process.platform} :(`)
  process.exit(1)
}

console.log('Writing bundle size info…')
writeFileSync(
  path.join(getDistRoot(), 'bundle-size.json'),
  JSON.stringify(getBundleSizes())
)

console.log('Writing bundle hash…')
writeFileSync(
  path.join(getDistRoot(), 'bundle-hash.json'),
  JSON.stringify({
    bundleHash: computeBundleHashSync(path.join(__dirname, '..', 'out')),
  })
)

function packageOSX() {
  const dest = getOSXZipPath()
  rmSync(dest, { recursive: true, force: true })

  console.log('Packaging for macOS…')
  cp.execSync(
    `ditto -ck --keepParent "${distPath}/${productName}.app" "${dest}"`
  )
}

function packageLinux() {
  const archivePath = getLinuxArchivePath()
  rmSync(archivePath, { force: true })

  console.log('Packaging Linux archive…')
  cp.execFileSync(
    'tar',
    [
      '-czf',
      archivePath,
      '-C',
      path.dirname(distPath),
      path.basename(distPath),
    ],
    { stdio: 'inherit' }
  )

  packageLinuxDeb()
}

function packageLinuxDeb() {
  const packageRoot = path.join(outputDir, '.debian-package')
  const installRoot = path.join(packageRoot, 'opt', 'github-desktop')
  const binRoot = path.join(packageRoot, 'usr', 'bin')
  const applicationsRoot = path.join(
    packageRoot,
    'usr',
    'share',
    'applications'
  )
  const iconsRoot = path.join(
    packageRoot,
    'usr',
    'share',
    'icons',
    'hicolor',
    '512x512',
    'apps'
  )
  const controlRoot = path.join(packageRoot, 'DEBIAN')
  const debPath = getLinuxDebPath()
  const debArchitecture = getDistArchitecture() === 'arm64' ? 'arm64' : 'amd64'

  rmSync(packageRoot, { recursive: true, force: true })
  rmSync(debPath, { force: true })

  try {
    mkdirSync(path.dirname(installRoot), { recursive: true })
    cpSync(distPath, installRoot, {
      recursive: true,
      verbatimSymlinks: true,
    })

    mkdirSync(binRoot, { recursive: true })
    symlinkSync(
      '/opt/github-desktop/desktop',
      path.join(binRoot, 'github-desktop')
    )

    mkdirSync(applicationsRoot, { recursive: true })
    writeFileSync(
      path.join(applicationsRoot, 'github-desktop.desktop'),
      `[Desktop Entry]
Name=GitHub Desktop
Comment=Simple collaboration from your desktop
Exec=/usr/bin/github-desktop %U
Terminal=false
Type=Application
Icon=github-desktop
Categories=Development;RevisionControl;
MimeType=x-scheme-handler/x-github-client;
`
    )

    mkdirSync(iconsRoot, { recursive: true })
    cpSync(
      path.join(__dirname, '..', 'app', 'static', 'linux', 'icon-logo.png'),
      path.join(iconsRoot, 'github-desktop.png')
    )

    mkdirSync(controlRoot, { recursive: true })
    writeFileSync(
      path.join(controlRoot, 'control'),
      `Package: github-desktop
Version: ${getVersion()}
Section: devel
Priority: optional
Architecture: ${debArchitecture}
Maintainer: ${getCompanyName()} <opensource+desktop@github.com>
Depends: libgtk-3-0 | libgtk-3-0t64, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0, libasound2 | libasound2t64, libgbm1
Homepage: https://desktop.github.com/
Description: GitHub Desktop for Linux
 Simple collaboration from your desktop. HTTPS authentication is delegated
 to Git Credential Manager.
`
    )

    console.log('Packaging Linux Debian package…')
    cp.execFileSync(
      'dpkg-deb',
      ['--root-owner-group', '--build', packageRoot, debPath],
      { stdio: 'inherit' }
    )
  } finally {
    rmSync(packageRoot, { recursive: true, force: true })
  }
}

function packageWindows() {
  const iconSource = join(getIconDirectory(), 'icon-logo.ico')

  if (!existsSync(iconSource)) {
    console.error(`expected setup icon not found at location: ${iconSource}`)
    process.exit(1)
  }

  const splashScreenPath = path.resolve(
    __dirname,
    '../app/static/logos/win32-installer-splash.gif'
  )

  if (!existsSync(splashScreenPath)) {
    console.error(
      `expected setup splash screen gif not found at location: ${splashScreenPath}`
    )
    process.exit(1)
  }

  const iconUrl = 'https://desktop.githubusercontent.com/app-icon.ico'

  const nugetPkgName = getWindowsIdentifierName()
  const options: electronInstaller.Options = {
    name: nugetPkgName,
    appDirectory: distPath,
    outputDirectory: outputDir,
    authors: getCompanyName(),
    iconUrl: iconUrl,
    setupIcon: iconSource,
    loadingGif: splashScreenPath,
    exe: `${nugetPkgName}.exe`,
    title: productName,
    setupExe: getWindowsStandaloneName(),
    setupMsi: getWindowsInstallerName(),
  }

  if (shouldMakeDelta()) {
    const url = new URL(getUpdatesURL())
    // Make sure Squirrel.Windows isn't affected by partially or completely
    // disabled releases.
    url.searchParams.set('bypassStaggeredRelease', '1')
    options.remoteReleases = url.toString()
  }

  if (isGitHubActions() && isPublishable()) {
    assertNonNullable(process.env.RUNNER_TEMP, 'Missing RUNNER_TEMP env var')

    const acsPath = join(process.env.RUNNER_TEMP, 'acs')
    const dlibPath = join(acsPath, 'bin', 'x64', 'Azure.CodeSigning.Dlib.dll')

    assertExistsSync(dlibPath)

    const metadataPath = join(acsPath, 'metadata.json')
    const acsMetadata = {
      Endpoint: 'https://wus3.codesigning.azure.net/',
      CodeSigningAccountName: 'GitHubInc',
      CertificateProfileName: 'GitHubInc',
      CorrelationId: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    }
    writeFileSync(metadataPath, JSON.stringify(acsMetadata))

    options.signWithParams = `/v /fd SHA256 /tr "http://timestamp.acs.microsoft.com" /td SHA256 /dlib "${dlibPath}" /dmdf "${metadataPath}"`
  }

  console.log('Packaging for Windows…')
  electronInstaller
    .createWindowsInstaller(options)
    .then(() => console.log(`Installers created in ${outputDir}`))
    .then(async () => {
      // electron-winstaller (more specifically Squirrel.Windows) doesn't let
      // us control the name of the nuget packages but we want them to include
      // the architecture similar to how the setup exe and msi do so we'll just
      // have to rename them here after the fact.
      const arch = getDistArchitecture()
      const prefix = `${getWindowsIdentifierName()}-${getVersion()}`

      for (const kind of shouldMakeDelta() ? ['full', 'delta'] : ['full']) {
        const from = join(outputDir, `${prefix}-${kind}.nupkg`)
        const to = join(outputDir, `${prefix}-${arch}-${kind}.nupkg`)

        console.log(`Renaming ${from} to ${to}`)
        await rename(from, to)
      }
    })
    .catch(e => {
      console.error(`Error packaging: ${e}`)
      process.exit(1)
    })
}
