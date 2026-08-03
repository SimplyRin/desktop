// Minimal fallback declarations for glob module
declare module 'glob' {
  interface IOptions {
    cwd?: string
    root?: string
    dot?: boolean
    nomount?: boolean
    mark?: boolean
    nosort?: boolean
    stat?: boolean
    silent?: boolean
    strict?: boolean
    cache?: { [path: string]: any }
    statCache?: { [path: string]: false | { isDirectory(): boolean } }
    symlinks?: any
    realpathCache?: any
    sync?: boolean
    nounique?: boolean
    nonull?: boolean
    debug?: boolean
    nobrace?: boolean
    noglobstar?: boolean
    noext?: boolean
    nocase?: boolean
    matchBase?: boolean
    nodir?: boolean
    ignore?: string | string[]
    follow?: boolean
    realpath?: boolean
    absolute?: boolean
  }

  function glob(
    pattern: string,
    cb: (err: Error | null, matches: string[]) => void
  ): void
  function glob(
    pattern: string,
    options: IOptions,
    cb: (err: Error | null, matches: string[]) => void
  ): void
  export = glob
}
