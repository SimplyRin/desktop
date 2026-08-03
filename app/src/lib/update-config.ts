/**
 * Configuration for GitHub Desktop updates
 */

/**
 * Check if we should use GitHub Releases for updates instead of central.github.com
 */
export function useGitHubReleasesForUpdates(): boolean {
  return process.env.USE_GITHUB_RELEASES === 'true' || __UPDATES_URL__.includes('api.github.com/repos')
}

/**
 * Get the GitHub repository owner for releases
 */
export function getGitHubReleasesOwner(): string {
  return process.env.GITHUB_RELEASES_OWNER || 'SimplyRin'
}

/**
 * Get the GitHub repository name for releases
 */
export function getGitHubReleasesRepo(): string {
  return process.env.GITHUB_RELEASES_REPO || 'desktop'
}

/**
 * Build the GitHub Releases API URL
 */
export function getGitHubReleasesUrl(): string {
  const owner = getGitHubReleasesOwner()
  const repo = getGitHubReleasesRepo()
  return `https://api.github.com/repos/${owner}/${repo}/releases/latest`
}
