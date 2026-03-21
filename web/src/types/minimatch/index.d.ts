// Local stub so TypeScript finds a valid entry-point for @types/minimatch.
// @types/minimatch@6 is intentionally empty (minimatch@6+ ships its own types),
// but our transitive deps install the empty v6 shim alongside minimatch@3 which
// needs these declarations. This stub satisfies the "implicit type library" lookup
// without affecting any source imports.
declare function minimatch(path: string, pattern: string, opts?: minimatch.IOptions): boolean;
declare namespace minimatch {
  interface IOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }
  function match(list: string[], pattern: string, opts?: IOptions): string[];
  function filter(pattern: string, opts?: IOptions): (element: string, index: number, array: string[]) => boolean;
  function makeRe(pattern: string, opts?: IOptions): RegExp;
  function braceExpand(pattern: string, opts?: IOptions): string[];
}
export = minimatch;
