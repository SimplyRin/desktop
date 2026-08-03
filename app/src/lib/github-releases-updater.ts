import { getVersion } from '../ui/lib/app-proxy'
import { compare } from 'semver'
import { getUserAgent } from './http'

/**
 * Interface for GitHub Release API response
 */
interface IGitHubRelease {
  tag_name: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
  assets: Array<{
    name: string
    browser_download_url: string
    content_type: string
    size: number
  }>
  published_at: string
  html_url: string
}

/**
 * Check if GitHub Releases-based updates are enabled
 */
export function isGitHubReleasesEnabled(): boolean {
  return __UPDATES_URL__.includes('api.github.com/repos')
}

/**
 * Get asset name pattern for current platform and architecture
 */
function getAssetNamePattern(): string {
  if (process.platform === 'darwin') {
    return 'GitHub Desktop.*\\.zip$'
  } else if (process.platform === 'win32') {
    return 'GitHubDesktopSetup.*\\.exe$'
  } else if (process.platform === 'linux') {
    // For Linux, we now support deb and rpm packages only
    return 'GitHubDesktop.*\\.(deb|rpm)$'
  }
  return ''
}

/**
 * Check for updates using GitHub Releases API
 */
export async function checkGitHubReleasesForUpdate(): Promise<{
  updateAvailable: boolean
  latestVersion?: string
  downloadUrl?: string
  releaseNotes?: string
} | null> {
  try {
    const response = await fetch(__UPDATES_URL__, {
      headers: {
        'User-Agent': getUserAgent(),
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`)
    }

    const release: IGitHubRelease = await response.json()

    // Skip draft and prerelease versions for stable builds
    if (release.draft || release.prerelease) {
      return { updateAvailable: false }
    }

    const currentVersion = await getVersion()
    const latestVersion = release.tag_name.replace(/^v/, '') // Remove 'v' prefix if present

    // Compare versions
    const updateAvailable = compare(latestVersion, currentVersion) > 0

    if (!updateAvailable) {
      return { updateAvailable: false }
    }

    // Find appropriate asset for current platform
    const assetPattern = getAssetNamePattern()
    const asset = release.assets.find(asset =>
      new RegExp(assetPattern, 'i').test(asset.name)
    )

    if (!asset) {
      throw new Error(
        `No compatible asset found for platform ${process.platform}`
      )
    }

    return {
      updateAvailable: true,
      latestVersion,
      downloadUrl: asset.browser_download_url,
      releaseNotes: release.body,
    }
  } catch (error) {
    console.error('Error checking GitHub Releases for updates:', error)
    return null
  }
}

/**
 * Transform GitHub Releases response to match expected update format
 */
export function transformGitHubReleaseToUpdateInfo(
  updateInfo: NonNullable<
    Awaited<ReturnType<typeof checkGitHubReleasesForUpdate>>
  >
) {
  if (!updateInfo.updateAvailable) {
    return null
  }

  return {
    version: updateInfo.latestVersion,
    url: updateInfo.downloadUrl,
    releaseNotes: updateInfo.releaseNotes,
    // Additional fields that might be expected by the updater
    files: [
      {
        url: updateInfo.downloadUrl,
        size: 0, // We don't have size info easily available
        sha512: '', // We don't have checksum info
      },
    ],
  }
}
