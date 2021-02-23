/// <reference types="node" />
import fs from 'fs';
export declare const outputFile: (filepath: string, content: Buffer | string, encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | null | undefined) => Promise<void>;
export declare const readFile: typeof fs.promises.readFile;
export declare const pathExists: (filepath: string) => Promise<unknown>;
