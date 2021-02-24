/// <reference types="node" />
import fs from 'fs';
export declare const outputFile: (filepath: string, content: Buffer | string, encoding?: BufferEncoding | null | undefined) => Promise<void>;
export declare const readFile: typeof fs.promises.readFile;
export declare const pathExists: (filepath: string) => Promise<unknown>;
