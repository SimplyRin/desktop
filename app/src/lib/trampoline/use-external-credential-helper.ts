import { getBoolean, setBoolean } from '../local-storage'

// Linux builds don't keep GitHub account tokens inside Desktop. All HTTPS
// authentication is delegated to Git Credential Manager instead.
export const useExternalCredentialHelperDefault = __LINUX__
export const useExternalCredentialHelperKey: string =
  'useExternalCredentialHelper'

export const useExternalCredentialHelper = () =>
  __LINUX__ ||
  getBoolean(useExternalCredentialHelperKey, useExternalCredentialHelperDefault)

/** Whether GCM should handle GitHub hosts in addition to third-party hosts. */
export const useExternalCredentialHelperForAllHosts = () => __LINUX__

export const setUseExternalCredentialHelper = (value: boolean) =>
  setBoolean(useExternalCredentialHelperKey, value)
