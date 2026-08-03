// Minimal fallback declarations for fs-extra when @types/fs-extra not resolved
// This is a safety net for CI; real types come from @types/fs-extra.
// Only the members used in packaging scripts are declared.

declare module 'fs-extra' {
  import { Stats } from 'fs'
  export function pathExists(path: string): Promise<boolean>
  export function chmod(path: string, mode: number): Promise<void>
  export function copySync(src: string, dest: string): void
  export function remove(path: string): Promise<void>
  export function ensureDir(path: string): Promise<void>
  export function stat(path: string): Promise<Stats>
  export function rename(oldPath: string, newPath: string): Promise<void>
  export function readFileSync(path: string, encoding?: string): string | Buffer
}
