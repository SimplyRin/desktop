// Minimal fallback declarations for semver module
declare module 'semver' {
  export function valid(version: string): string | null
  export function clean(version: string): string | null
  export function inc(version: string, release: string): string | null
  export function major(version: string): number
  export function minor(version: string): number
  export function patch(version: string): number
  export function gt(v1: string, v2: string): boolean
  export function lt(v1: string, v2: string): boolean
  export function eq(v1: string, v2: string): boolean
  export function gte(v1: string, v2: string): boolean
  export function lte(v1: string, v2: string): boolean
  export function compare(v1: string, v2: string): number
  export function parse(version: string): any
}
