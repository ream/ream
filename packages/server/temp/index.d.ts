import type { Router, RouteRecordRaw } from '@ream/app/router';
import type { HTMLResult as HeadResult } from '@ream/app/head';
import { render, renderToHTML, getPreloadData } from './render';
export { ReamServerHandler, ReamServerRequest, ReamServerResponse, } from './server';
export { Connect } from './connect';
export declare type GetDocumentArgs = {
    head(): string;
    main(): string;
    scripts(): string;
    htmlAttrs(): string;
    bodyAttrs(): string;
};
export declare type ServerEntry = {
    render: any;
    createClientRouter: () => Router;
    createServerRouter: (routes: RouteRecordRaw[]) => Router;
    _document: () => Promise<{
        default: (args: GetDocumentArgs) => string | Promise<string>;
    }>;
    renderHeadToString: (app: any) => HeadResult;
    ErrorComponent: any;
    serverRoutes: RouteRecordRaw[];
};
declare type LoadServerEntry = () => Promise<ServerEntry> | ServerEntry;
declare type CreateServerContext = {
    /**
     * Development mode
     * @default {false}
     */
    dev?: boolean;
    /**
     * Path to your project
     * i.e. the directory where we create the .ream folder
     * @default {`.ream`}
     */
    cwd?: string;
    devMiddleware?: any;
    loadServerEntry?: LoadServerEntry;
    ssrFixStacktrace?: (err: Error) => void;
};
export { render, renderToHTML, getPreloadData };
export declare const extractClientManifest: (dotReamDir: string) => {
    scripts: string;
    styles: any;
} | undefined;
export declare const writeCacheFiles: (files: Map<string, string>) => Promise<void>;
export declare function createServer(ctx?: CreateServerContext): Promise<import("./connect").Connect>;
