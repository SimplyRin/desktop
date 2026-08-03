import { getBoolean, setBoolean } from '../local-storage'

export const useExternalCredentialHelperDefault = false
export const useExternalCredentialHelperKey: string =
  'useExternalCredentialHelper'

export const useExternalCredentialHelperForAllHostsDefault = false
export const useExternalCredentialHelperForAllHostsKey: string =
  'useExternalCredentialHelperForAllHosts'

/**
 * Whether the external credential helper should handle GitHub hosts as well as
 * third-party hosts.
 *
 * When enabled, Desktop never asks the user to sign in to a GitHub account and
 * doesn't store a token of its own - all HTTPS authentication is delegated to
 * Git Credential Manager.
 */
export const useExternalCredentialHelperForAllHosts = () =>
  getBoolean(
    useExternalCredentialHelperForAllHostsKey,
    useExternalCredentialHelperForAllHostsDefault
  )

export const useExternalCredentialHelper = () =>
  // Delegating GitHub hosts to the external helper implies using it for
  // third-party hosts too.
  useExternalCredentialHelperForAllHosts() ||
  getBoolean(useExternalCredentialHelperKey, useExternalCredentialHelperDefault)

export const setUseExternalCredentialHelper = (value: boolean) =>
  setBoolean(useExternalCredentialHelperKey, value)

export const setUseExternalCredentialHelperForAllHosts = (value: boolean) =>
  setBoolean(useExternalCredentialHelperForAllHostsKey, value)
