/// <reference types="node" />
import type { ReamServerResponse } from './server';
export declare type SendData = NodeJS.ReadableStream | object | string | Buffer;
export declare function send(res: ReamServerResponse, data?: SendData): ReamServerResponse | undefined;
export declare function status(res: ReamServerResponse, code: number): void;
