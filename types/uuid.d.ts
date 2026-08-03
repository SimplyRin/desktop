// Minimal fallback declarations for uuid when @types/uuid resolution fails.
// Supports both default import (legacy v3 types) and named v4 import usage.

declare module 'uuid' {
  export interface IV4Options {
    random?: number[]
    rng?: () => number[]
  }
  export type V4UUID = string
  export function v4(options?: IV4Options): V4UUID
  // Legacy style helper (import uuid from 'uuid')
  // Provide a named re-export instead of default to satisfy lint rules.
  export const uuid: (options?: IV4Options) => V4UUID
}
