import { Key } from 'path-to-regexp';
export declare function execPathRegexp(path: string, regexp: RegExp, keys: Key[]): {
    [k: string]: string;
};
export declare function getParams(path: string, pattern: string): {
    [k: string]: string;
} | undefined;
export declare function compileToPath(pattern: string, params: any): string;
export { pathToRegexp } from 'path-to-regexp';
